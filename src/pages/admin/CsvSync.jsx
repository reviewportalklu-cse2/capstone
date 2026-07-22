import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { studentService, guideService, reviewerService, facultyService, auditService } from '@/firebase/services';
import { useAuth } from '@/contexts/AuthContext';

const CsvSync = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('student');
  const [previewData, setPreviewData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  };

  const parseFile = (file) => {
    setProcessing(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        setPreviewData({
          records: json,
          summary: {
            total: json.length,
            added: json.length,
            updated: 0,
            removed: 0
          }
        });
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
    try {
      const records = previewData.records;
      const now = new Date().toISOString();
      
      let service;
      if (uploadType === 'student') service = studentService;
      else if (uploadType === 'guide') service = guideService;
      else if (uploadType === 'reviewer') service = reviewerService;
      else if (uploadType === 'faculty') service = facultyService;
      
      // Batch processing sequentially for simplicity and stability in this enterprise demo
      for (const record of records) {
        await service.create({
          ...record,
          createdAt: now,
          status: 'Active'
        });
      }

      await auditService.log(
        currentUser.uid, 
        `BULK_IMPORT_${uploadType.toUpperCase()}`, 
        'BulkUpload', 
        null, 
        { count: records.length, type: uploadType }
      );

      setSyncStatus('success');
      setPreviewData(null);
      setFile(null);
    } catch (err) {
      console.error("Error syncing data:", err);
      setErrorMsg("Failed to synchronize data with the database.");
    } finally {
      setProcessing(false);
    }
  };

  const renderPreviewTable = () => {
    if (!previewData || !previewData.records.length) return null;
    
    const records = previewData.records.slice(0, 10);
    const columns = Object.keys(records[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      accessor: key
    }));

    return (
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex justify-between items-center">
          <span>Data Preview <span className="text-sm font-normal text-gray-500">(Showing first 10 records)</span></span>
        </h4>
        <Table columns={columns} data={records} />
      </div>
    );
  };

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Enterprise Data Synchronization">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Bulk Upload">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                <div className="flex flex-wrap gap-2">
                  {['student', 'guide', 'reviewer', 'faculty'].map(type => (
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
                          ? 'bg-primary-50 text-primary-700 border-primary-200' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)} Data
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors bg-gray-50">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
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

              {errorMsg && (
                <div className="p-4 rounded-md bg-red-50 flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {errorMsg}
                </div>
              )}
            </div>
          </Card>

          {processing && !syncStatus && (
            <div className="flex justify-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 text-primary-600">
                <Loader2 className="animate-spin h-6 w-6" />
                <span className="font-medium">Processing Data...</span>
              </div>
            </div>
          )}

          {previewData && !processing && renderPreviewTable()}
        </div>

        {/* Sync Summary Section */}
        <div className="lg:col-span-1">
          <Card title="Sync Summary" className="sticky top-6">
            {syncStatus === 'success' ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900">Import Complete!</h4>
                <p className="text-sm text-gray-500 mt-1">Firestore has been updated successfully with {uploadType} data.</p>
                <button 
                  onClick={() => setSyncStatus(null)}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Upload Another File
                </button>
              </div>
            ) : previewData ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Records to Add</span>
                    <span className="font-semibold text-gray-900">{previewData.summary.added}</span>
                  </div>
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
                  Start Import
                </button>
                <div className="flex items-start mt-4 text-xs text-blue-600 bg-blue-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 text-blue-500" />
                  <p>All imported records will be added to the {uploadType} database collection.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                Upload a file to preview the data before importing into the database.
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CsvSync;
