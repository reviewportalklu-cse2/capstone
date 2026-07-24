import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Trash2, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { auditService, syncService } from '@/firebase/services';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';

const CsvSync = () => {
  const navigationItems = useAdminNavigation();
  const { currentUser } = useAuth();
  
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('master');
  const [previewData, setPreviewData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingState, setProcessingState] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [purgeStatus, setPurgeStatus] = useState('');

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile, uploadType);
    }
  };

  const getField = (obj, keys) => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
    }
    return '';
  };

  const matchSheetName = (sheetName, targetType) => {
    const normalized = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
    switch (targetType) {
      case 'student': return normalized.includes('student');
      case 'guide': return normalized.includes('guide');
      case 'faculty': return normalized.includes('faculty');
      case 'reviewer': return normalized.includes('reviewer');
      case 'assignments': return normalized.includes('assignment');
      default: return false;
    }
  };

  const parseFile = (file, type) => {
    setProcessing(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        if (type === 'master') {
          const extracted = { student: [], guide: [], faculty: [], reviewer: [], assignments: [] };
          let totalRows = 0;
          let sheetsFound = 0;

          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            
            if (matchSheetName(sheetName, 'student')) { extracted.student = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'guide')) { extracted.guide = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'faculty')) { extracted.faculty = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'reviewer')) { extracted.reviewer = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'assignments')) { extracted.assignments = json; totalRows += json.length; sheetsFound++; }
          });

          setPreviewData({
            isMaster: true,
            sheets: extracted,
            summary: {
              sheetsFound,
              total: totalRows
            }
          });
        } else {
          // Single sheet fallback mode
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          
          setPreviewData({
            isMaster: false,
            records: json,
            summary: {
              total: json.length,
              added: json.length,
            }
          });
        }
        setProcessing(false);
      } catch (err) {
        console.error("Error parsing file", err);
        setErrorMsg("Failed to parse file. Make sure it is a valid CSV or Excel file.");
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSync = async () => {
    setProcessing(true);
    setErrorMsg(null);
    setSyncStatus(null);
    const now = new Date().toISOString();
    const importId = `IMPORT-${Date.now()}`;
    
    let totalWrites = 0;
    let syncResultText = "";

    try {
      if (previewData.isMaster) {
        setProcessingState('Starting Master Workbook parsing...');
        const { student, guide, faculty, reviewer, assignments } = previewData.extracted;
        let failures = 0;

        // 1. Students
        if (student.length > 0) {
          console.log(`[CSV_SYNC] Starting Students Import. Rows to parse: ${student.length}`);
          console.log(`[CSV_SYNC] First parsed student row:`, student[0]);
          setProcessingState(`Importing ${student.length} Students...`);
          for (const row of student) {
            const id = getField(row, ['Roll Number', 'rollNumber']).toLowerCase() || `STD-${Date.now()}-${Math.random()}`;
            try {
              console.log(`[CSV_SYNC] Writing to collection 'students', Doc ID: ${id}`);
              await FirestoreService.set('students', id, { ...row, createdAt: now, status: 'Active' });
              console.log(`[CSV_SYNC] SUCCESS - Doc ID: ${id}`);
              totalWrites++;
            } catch (err) {
              console.error(`[CSV_SYNC] FAILED to write student Doc ID: ${id}. Reason:`, err);
              failures++;
            }
          }
        }

        // 2. Guides
        if (guide.length > 0) {
          console.log(`[CSV_SYNC] Starting Guides Import. Rows to parse: ${guide.length}`);
          console.log(`[CSV_SYNC] First parsed guide row:`, guide[0]);
          setProcessingState(`Importing ${guide.length} Guides...`);
          for (const row of guide) {
            const id = getField(row, ['Employee ID', 'employeeId', 'Email', 'email']).toLowerCase() || `GUI-${Date.now()}-${Math.random()}`;
            try {
              console.log(`[CSV_SYNC] Writing to collection 'guides', Doc ID: ${id}`);
              await FirestoreService.set('guides', id, { ...row, createdAt: now, status: 'Active' });
              console.log(`[CSV_SYNC] SUCCESS - Doc ID: ${id}`);
              totalWrites++;
            } catch (err) {
              console.error(`[CSV_SYNC] FAILED to write guide Doc ID: ${id}. Reason:`, err);
              failures++;
            }
          }
        }

        // 3. Faculty
        if (faculty.length > 0) {
          console.log(`[CSV_SYNC] Starting Faculty Import. Rows to parse: ${faculty.length}`);
          console.log(`[CSV_SYNC] First parsed faculty row:`, faculty[0]);
          setProcessingState(`Importing ${faculty.length} Faculty...`);
          for (const row of faculty) {
            const id = getField(row, ['Employee ID', 'employeeId', 'Email', 'email']).toLowerCase() || `FAC-${Date.now()}-${Math.random()}`;
            try {
              console.log(`[CSV_SYNC] Writing to collection 'classroomFaculty', Doc ID: ${id}`);
              await FirestoreService.set('classroomFaculty', id, { ...row, createdAt: now, status: 'Active' });
              console.log(`[CSV_SYNC] SUCCESS - Doc ID: ${id}`);
              totalWrites++;
            } catch (err) {
              console.error(`[CSV_SYNC] FAILED to write faculty Doc ID: ${id}. Reason:`, err);
              failures++;
            }
          }
        }

        // 4. Reviewers
        if (reviewer.length > 0) {
          console.log(`[CSV_SYNC] Starting Reviewers Import. Rows to parse: ${reviewer.length}`);
          console.log(`[CSV_SYNC] First parsed reviewer row:`, reviewer[0]);
          setProcessingState(`Importing ${reviewer.length} Reviewers...`);
          for (const row of reviewer) {
            const id = getField(row, ['Employee ID', 'employeeId', 'Email', 'email']).toLowerCase() || `REV-${Date.now()}-${Math.random()}`;
            try {
              console.log(`[CSV_SYNC] Writing to collection 'reviewers', Doc ID: ${id}`);
              await FirestoreService.set('reviewers', id, { ...row, createdAt: now, status: 'Active' });
              console.log(`[CSV_SYNC] SUCCESS - Doc ID: ${id}`);
              totalWrites++;
            } catch (err) {
              console.error(`[CSV_SYNC] FAILED to write reviewer Doc ID: ${id}. Reason:`, err);
              failures++;
            }
          }
        }

        if (assignments.length > 0) {
          setProcessingState(`Running Assignment Engine on ${assignments.length} mappings...`);
          const result = await syncService.syncAssignments(assignments);
          
          let report = `Master Import Complete!\n\n`;
          report += `Students linked: ${result.stats.studentsLinked}\n`;
          report += `Teams created: ${result.stats.teamsCreated}\n`;
          report += `Projects created: ${result.stats.projectsCreated}\n`;
          report += `Guides updated: ${result.stats.guidesUpdated}\n`;
          report += `Faculty updated: ${result.stats.facultyUpdated}\n`;
          report += `Reviewers updated: ${result.stats.reviewersUpdated}\n`;
          report += `Students updated: ${result.stats.studentsUpdated}\n`;
          
          if (result.warnings && result.warnings.length > 0) {
            report += `\nWARNINGS:\n- ${result.warnings.join('\n- ')}`;
          }

          syncResultText = report;
          totalWrites += (result.stats.teamsCreated * 2) + result.stats.studentsAssigned; // Just an approximation for audit logging
          
          if (result.warnings.length > 0) {
             setErrorMsg(`There were ${result.warnings.length} relationship mapping issues. Check the import result log.`);
          }
          
        } else {
          syncResultText = `Master Import Complete! Updated ${totalWrites} base entity records.`;
        }

        if (failures > 0) {
          throw new Error(`${failures} base entities failed to write to Firestore. Check the console logs for details.`);
        }

        await auditService.log(currentUser.uid, 'MASTER_IMPORT', 'BulkUpload', importId, { totalWrites });

      } else {
        // Fallback Single Mode
        setProcessingState(`Importing ${previewData.summary.total} records...`);
        const records = previewData.records;
        
        console.log(`[CSV_SYNC] Starting Legacy Import. Type: ${uploadType}, Rows to parse: ${records.length}`);
        if (records.length > 0) console.log(`[CSV_SYNC] First parsed row:`, records[0]);

        if (uploadType === 'assignments') {
          const result = await syncService.syncAssignments(records);
          let report = `Assignments Import Complete!\n\n`;
          report += `Students linked: ${result.stats.studentsLinked}\n`;
          report += `Teams created: ${result.stats.teamsCreated}\n`;
          report += `Projects created: ${result.stats.projectsCreated}\n`;
          report += `Guides updated: ${result.stats.guidesUpdated}\n`;
          report += `Faculty updated: ${result.stats.facultyUpdated}\n`;
          report += `Reviewers updated: ${result.stats.reviewersUpdated}\n`;
          report += `Students updated: ${result.stats.studentsUpdated}\n`;
          
          if (result.warnings && result.warnings.length > 0) {
            report += `\nWARNINGS:\n- ${result.warnings.join('\n- ')}`;
          }

          syncResultText = report;
          totalWrites += (result.stats.teamsCreated * 2) + result.stats.studentsAssigned; // Approximation
          
          if (result.warnings.length > 0) {
             setErrorMsg(`There were ${result.warnings.length} relationship mapping issues. Check the import result log.`);
          }
        } else {
          let colName = '';
          if (uploadType === 'student') colName = 'students';
          else if (uploadType === 'guide') colName = 'guides';
          else if (uploadType === 'reviewer') colName = 'reviewers';
          else if (uploadType === 'faculty') colName = 'classroomFaculty';
          
          let failures = 0;
          for (const row of records) {
            let id = getField(row, ['Roll Number', 'rollNumber', 'Employee ID', 'employeeId', 'Email', 'email']).toLowerCase();
            if (!id) id = `REC-${Date.now()}-${Math.random()}`;
            try {
              console.log(`[CSV_SYNC] Writing to collection '${colName}', Doc ID: ${id}`);
              await FirestoreService.set(colName, id, { ...row, createdAt: now, status: 'Active' });
              console.log(`[CSV_SYNC] SUCCESS - Doc ID: ${id}`);
              totalWrites++;
            } catch (err) {
              console.error(`[CSV_SYNC] FAILED to write Doc ID: ${id} to ${colName}. Reason:`, err);
              failures++;
            }
          }
          console.log(`[CSV_SYNC] Legacy import completed. Total written: ${totalWrites}, Failures: ${failures}`);
          if (failures > 0) {
            setErrorMsg(`Warning: ${failures} records failed to write. Check browser console for details.`);
          }
          syncResultText = `Success! Processed ${records.length} ${uploadType} records. (${totalWrites} written)`;
        }
        
        await auditService.log(currentUser.uid, `SINGLE_IMPORT_${uploadType.toUpperCase()}`, 'BulkUpload', importId, { count: records.length });
      }

      setSyncStatus(syncResultText);
      setPreviewData(null);
      setFile(null);
    } catch (err) {
      console.error("Error syncing data:", err);
      setErrorMsg("Critical Failure: " + err.message + ". The synchronization process was aborted safely.");
    } finally {
      setProcessing(false);
      setProcessingState('');
    }
  };

  const handlePurge = async () => {
    if (!window.confirm("WARNING: This will permanently delete all students, guides, faculty, reviewers, teams, and projects. Proceed?")) return;
    setProcessing(true);
    setPurgeStatus('Purging database...');
    try {
      await syncService.purgeDatabase();
      await auditService.log(currentUser.uid, 'PURGE_DATABASE', 'System', null, {});
      setPurgeStatus('Database purged successfully. Ready for fresh import.');
    } catch (err) {
      console.error("Error purging database:", err);
      setPurgeStatus('Failed to purge database.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPreviewStats = () => {
    if (!previewData) return null;
    
    if (previewData.isMaster) {
      const { student, guide, faculty, reviewer, assignments } = previewData.sheets;
      return (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Master Workbook Detected Sheets</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white border p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{student.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Students</div>
            </div>
            <div className="bg-white border p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-emerald-600">{guide.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Guides</div>
            </div>
            <div className="bg-white border p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-purple-600">{faculty.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Faculty</div>
            </div>
            <div className="bg-white border p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-orange-600">{reviewer.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Reviewers</div>
            </div>
            <div className="bg-white border p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-teal-600">{assignments.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Assignments</div>
            </div>
          </div>
        </div>
      );
    } else {
      const records = previewData.records.slice(0, 5);
      const columns = Object.keys(records[0] || {}).map(key => ({ header: key, accessor: key }));
      return (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex justify-between items-center">
            <span>Data Preview <span className="text-sm font-normal text-gray-500">(First 5 records)</span></span>
          </h4>
          <Table columns={columns} data={records} />
        </div>
      );
    }
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Enterprise Data Synchronization">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-800 font-bold flex items-center gap-2"><Trash2 className="w-5 h-5"/> Data Cleanup</h3>
                <p className="text-sm text-red-600">Delete all dummy records before fresh import.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handlePurge} className="border-red-300 text-red-700 hover:bg-red-100">
                Purge Database
              </Button>
            </div>
            {purgeStatus && <div className="mt-2 text-sm font-bold text-red-800">{purgeStatus}</div>}
          </Card>

          <Card title="Enterprise Bulk Upload">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mode</label>
                <div className="flex flex-wrap gap-2">
                  {['master', 'student', 'guide', 'reviewer', 'faculty', 'assignments'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setUploadType(type);
                        setFile(null);
                        setPreviewData(null);
                        setSyncStatus(null);
                        setErrorMsg(null);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        uploadType === type 
                          ? type === 'master' ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-primary-50 text-primary-700 border-primary-200' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'master' ? 'Master Workbook ⭐' : type === 'assignments' ? 'Assignments (Legacy)' : type.charAt(0).toUpperCase() + type.slice(1) + ' (Legacy)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors bg-gray-50">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className={`mx-auto h-12 w-12 ${uploadType === 'master' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500">
                        <span>Browse file</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="sr-only" onChange={handleFileUpload} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Supports .csv, .xlsx</p>
                    {file && <p className="text-sm font-semibold text-primary-600 pt-2">{file.name}</p>}
                  </div>
                </div>
              </div>

              {syncStatus && (
                <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm whitespace-pre-wrap">{syncStatus}</div>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-md bg-red-50 flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <div className="text-sm whitespace-pre-wrap">{errorMsg}</div>
                </div>
              )}
            </div>
          </Card>

          {processing && !syncStatus && (
            <div className="flex justify-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center space-y-3 text-primary-600">
                <Loader2 className="animate-spin h-8 w-8" />
                <span className="font-bold text-lg">Processing Synchronization</span>
                {processingState && <span className="text-sm text-gray-500 animate-pulse">{processingState}</span>}
              </div>
            </div>
          )}

          {previewData && !processing && renderPreviewStats()}
        </div>

        {/* Sync Summary Section */}
        <div className="lg:col-span-1">
          <Card title="Sync Status" className="sticky top-6">
            {syncStatus ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <h4 className="text-lg font-bold text-gray-900">Synchronization Completed Successfully</h4>
                <p className="text-sm text-gray-500 mt-2 bg-green-50 p-3 rounded-md text-green-800">{syncStatus}</p>
                <button 
                  onClick={() => {
                    setSyncStatus(null);
                    setUploadType('master');
                  }}
                  className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Upload Another File
                </button>
              </div>
            ) : previewData ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-md">
                    <span className="text-sm font-medium text-gray-900">Total Valid Rows</span>
                    <span className="font-bold text-primary-600">{previewData.summary.total}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSync}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Execute {uploadType === 'master' ? 'Master Synchronization' : 'Legacy Import'}
                </button>
                <div className="flex items-start mt-4 text-xs text-blue-600 bg-blue-50 p-3 rounded-md">
                  <Info className="h-4 w-4 mr-1 flex-shrink-0 text-blue-500" />
                  <p>Updates existing records idempotently to prevent duplication. Referential relationships will be established at the end.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                <FileSpreadsheet className="w-10 h-10 text-gray-200 mb-2"/>
                Upload a workbook to preview the structural mapping before triggering the sync engine.
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CsvSync;
