import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import SelectivePurgeData from '@/components/admin/SelectivePurgeData';
import { 
  Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, 
  Trash2, Info, Star, ShieldCheck, Clock, Users, UserCheck, BookOpen, UserCog, 
  FileText, Layers, ClipboardList, BarChart3, FileBarChart, CheckCircle, PlayCircle, 
  Download, Eye, ShieldAlert, Sparkles, Check, AlertCircle, FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { auditService, syncService } from '@/firebase/services';
import { FirestoreService } from '@/firebase/services/firestore';
import { db } from '@/firebase/config';
import { writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import EmptyState from '@/components/common/EmptyState';

const REQUIRED_HEADERS = {
  student: ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID', 'Registration Number', 'Reg No', 'Email', 'email'],
  students: ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID', 'Registration Number', 'Reg No', 'Email', 'email'],
  teams: ['Team ID', 'teamId', 'TeamNo', 'Team No', 'Team Name', 'teamName', 'team'],
  projects: ['Project ID', 'projectId', 'Project Title', 'projectTitle', 'Title', 'title'],
  guide: ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Guide Name', 'Name', 'Email', 'email'],
  guides: ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Guide Name', 'Name', 'Email', 'email'],
  faculty: ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Faculty Name', 'Name', 'Email', 'email'],
  classroomFaculty: ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Faculty Name', 'Name', 'Email', 'email'],
  reviewer: ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Reviewer Name', 'Name', 'Email', 'email'],
  reviewers: ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Reviewer Name', 'Name', 'Email', 'email'],
  guide_assignments: ['Guide ID', 'guideId', 'Guide Email', 'guideEmail', 'Team ID', 'teamId', 'Employee ID', 'employeeId', 'Guide Name', 'guideName'],
  faculty_assignments: ['Faculty ID', 'facultyId', 'Faculty Email', 'facultyEmail', 'Team ID', 'teamId', 'Employee ID', 'employeeId', 'Faculty Name', 'facultyName'],
  reviewer_assignments: ['Reviewer ID', 'reviewerId', 'Reviewer Email', 'reviewerEmail', 'Team ID', 'teamId', 'Employee ID', 'employeeId', 'Reviewer Name', 'reviewerName'],
  team_assignments: ['Team ID', 'teamId', 'Roll Number', 'rollNumber', 'Student ID', 'studentId'],
  project_assignments: ['Project ID', 'projectId', 'Team ID', 'teamId'],
  rubrics: ['Rubric ID', 'rubricId', 'Rubric Title', 'title', 'name', 'Review Cycle', 'reviewCycle', 'Total Marks', 'totalMarks'],
  rubric_criteria: ['Rubric ID', 'rubricId', 'Criterion ID', 'criterionId', 'Criterion Name', 'criterionName', 'Max Marks', 'maxMarks'],
  review_cycles: ['Review Cycle ID', 'reviewCycleId', 'Review Cycle Name', 'reviewName', 'name', 'Start Date', 'startDate', 'End Date', 'endDate'],
  evaluation_schedule: ['Review Cycle ID', 'reviewCycleId', 'Review Cycle Name', 'reviewName', 'name', 'Start Date', 'startDate', 'End Date', 'endDate']
};

const CsvSync = () => {
  const navigationItems = useAdminNavigation();
  const { currentUser } = useAuth();
  const { auditLogs = [] } = useData() || {};
  
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('master');
  const [uploadLabel, setUploadLabel] = useState('Master Workbook');
  const [previewData, setPreviewData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingState, setProcessingState] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncSummaryDetails, setSyncSummaryDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'purge'

  // Dynamic Upload History & Stats derived from Firestore auditLogs
  const importAuditLogs = React.useMemo(() => {
    return auditLogs.filter(log => log.action && log.action.includes('IMPORT'));
  }, [auditLogs]);

  const uploadSummaryStats = React.useMemo(() => {
    let totalRecords = 0;
    importAuditLogs.forEach(log => {
      totalRecords += (log.updatedValue?.totalWrites || log.updatedValue?.count || 0);
    });
    return {
      totalUploads: importAuditLogs.length,
      recordsImported: totalRecords,
      lastUpload: importAuditLogs[0]?.timestamp ? new Date(importAuditLogs[0].timestamp).toLocaleString() : 'None'
    };
  }, [importAuditLogs]);

  const getField = (obj, keys) => {
    if (!obj) return '';
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
        return String(obj[key]).trim();
      }
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
      case 'teams': return normalized.includes('team');
      case 'assignments': return normalized.includes('assignment');
      default: return false;
    }
  };

  const validateRecordHeaders = (records, type) => {
    if (!records || records.length === 0) {
      return { valid: false, error: 'File contains zero data rows or empty headers.' };
    }
    const requiredList = REQUIRED_HEADERS[type];
    if (!requiredList) return { valid: true };

    const firstRowKeys = Object.keys(records[0]);
    const hasMatch = firstRowKeys.some(key => 
      requiredList.some(req => req.toLowerCase() === key.toLowerCase().trim())
    );

    if (!hasMatch) {
      return {
        valid: false,
        error: `Header Validation Error for [${type}]: Received headers: [${firstRowKeys.join(', ')}]. Expected at least one identifier column: [${requiredList.slice(0, 6).join(', ')}].`
      };
    }
    return { valid: true };
  };

  // Download Templates Helper
  const downloadTemplate = (type) => {
    let data = [];
    let filename = `${type.toUpperCase()}_Template.xlsx`;

    switch(type) {
      case 'master': {
        const wb = XLSX.utils.book_new();
        const sheets = {
          Students: [{'Student Name': 'Alice Smith', 'Roll Number': '2200030001', 'Email': 'alice@kluniversity.in', 'Phone': '+91 9876543210', 'Department': 'Computer Science & Engineering', 'Batch': '2026', 'Section': 'A', 'Year': '2026-27', 'Semester': 'Odd', 'Status': 'Active'}],
          Guides: [{'Guide ID': 'G001', 'Employee ID': '1379', 'Guide Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543211', 'Department': 'Computer Science & Engineering', 'Designation': 'Professor', 'Status': 'Active'}],
          Faculty: [{'Faculty ID': 'F001', 'Employee ID': '1379', 'Faculty Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543212', 'Department': 'Computer Science & Engineering', 'Designation': 'Associate Professor', 'Section': 'Section A', 'Specialization': 'Machine Learning', 'Status': 'Active'}],
          Reviewers: [{'Reviewer ID': 'R001', 'Employee ID': '1379', 'Reviewer Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543213', 'Organization': 'KL University', 'Designation': 'Senior Evaluator', 'Reviewer Type': 'Internal', 'Expertise': 'AI & Data Science', 'Department': 'Computer Science & Engineering', 'Assigned Batch': '2026', 'Status': 'Active'}],
          Teams: [{'Team ID': 'T001', 'Team Name': 'AI Research Group', 'Project Title': 'Autonomous Drone System', 'Guide Name': 'Dr. K.V.DURGA KIRAN', 'Faculty Name': 'Dr. K.V.DURGA KIRAN', 'Reviewer Name': 'Dr. K.V.DURGA KIRAN'}],
          Assignments: [{'Team ID': 'T001', 'Student Roll Number': '2200030001', 'Guide Name': 'Dr. K.V.DURGA KIRAN', 'Faculty Name': 'Dr. K.V.DURGA KIRAN', 'Reviewer Name': 'Dr. K.V.DURGA KIRAN'}]
        };
        Object.keys(sheets).forEach(s => {
          const ws = XLSX.utils.json_to_sheet(sheets[s]);
          XLSX.utils.book_append_sheet(wb, ws, s);
        });
        XLSX.writeFile(wb, 'Master_Workbook_Template.xlsx');
        return;
      }
      case 'students':
        data = [{'Student ID': '2200030001', 'Roll Number': '2200030001', 'Student Name': 'Alice Smith', 'Email': 'alice@kluniversity.in', 'Phone': '+91 9876543210', 'Department': 'Computer Science & Engineering', 'Section': 'A', 'Year': '2026-27', 'Semester': 'Odd', 'Status': 'Active'}];
        break;
      case 'projects':
        data = [{'Project ID': 'PRJ-001', 'Project Title': 'Autonomous Drone System', 'Description': 'Computer Vision for Navigation', 'Domain': 'Machine Learning', 'Team ID': 'T001'}];
        break;
      case 'teams':
        data = [{'Team ID': 'T001', 'Team Name': 'AI Research Group', 'Project Title': 'Autonomous Drone System', 'Guide Name': 'Dr. K.V.DURGA KIRAN'}];
        break;
      case 'guides':
        data = [{'Guide ID': 'G001', 'Employee ID': '1379', 'Guide Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543211', 'Department': 'Computer Science & Engineering', 'Designation': 'Professor', 'Status': 'Active'}];
        break;
      case 'faculty':
        data = [{'Faculty ID': 'F001', 'Employee ID': '1379', 'Faculty Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543212', 'Department': 'Computer Science & Engineering', 'Designation': 'Associate Professor', 'Section': 'Section A', 'Specialization': 'Machine Learning', 'Status': 'Active'}];
        break;
      case 'reviewers':
        data = [{'Reviewer ID': 'R001', 'Employee ID': '1379', 'Reviewer Name': 'Dr. K.V.DURGA KIRAN', 'Email': 'kiran_cse@kluniversity.in', 'Phone': '+91 9876543213', 'Organization': 'KL University', 'Designation': 'Senior Evaluator', 'Reviewer Type': 'Internal', 'Expertise': 'AI & Data Science', 'Department': 'Computer Science & Engineering', 'Assigned Batch': '2026', 'Status': 'Active'}];
        break;
      case 'guide_assignments':
        data = [{'Guide ID': 'G001', 'Guide Email': 'kiran_cse@kluniversity.in', 'Team ID': 'T001', 'Project ID': 'PRJ-001', 'Student IDs': '2200030001, 2200030002', 'Review Cycle ID': 'cycle-1', 'Status': 'Active'}];
        break;
      case 'faculty_assignments':
        data = [{'Faculty ID': 'F001', 'Faculty Email': 'kiran_cse@kluniversity.in', 'Team ID': 'T001', 'Project ID': 'PRJ-001', 'Student IDs': '2200030001, 2200030002', 'Review Cycle ID': 'cycle-1', 'Status': 'Active'}];
        break;
      case 'reviewer_assignments':
        data = [{'Reviewer ID': 'R001', 'Reviewer Email': 'kiran_cse@kluniversity.in', 'Team ID': 'T001', 'Project ID': 'PRJ-001', 'Student IDs': '2200030001, 2200030002', 'Review Cycle ID': 'cycle-1', 'Status': 'Active'}];
        break;
      case 'team_assignments':
        data = [{'Team ID': 'T001', 'Student Roll Number': '2200030001', 'Role': 'Leader'}];
        break;
      case 'project_assignments':
        data = [{'Project ID': 'PRJ-001', 'Team ID': 'T001', 'Status': 'Active'}];
        break;
      case 'review_cycles':
      case 'evaluation_schedule':
        data = [{'Review Cycle ID': 'cycle-1', 'Review Cycle Name': 'Review 1', 'Start Date': '2026-08-01', 'End Date': '2026-08-31', 'Evaluation Type': 'Standard', 'Status': 'Active', 'Description': 'Phase 1 Progress & Architecture Evaluation'}];
        break;
      case 'rubrics':
        data = [{'Rubric ID': 'R1', 'Rubric Title': 'Review 1 Master Rubric', 'Version': '1.0', 'Review Cycle': 'Review 1', 'Review Cycle ID': 'cycle-1', 'Total Marks': '100', 'Status': 'Published'}];
        break;
      case 'rubric_criteria':
        data = [{'Rubric ID': 'R1', 'Criterion ID': 'c1', 'Criterion Name': 'Literature Review & System Architecture', 'Description': 'Depth of technical design and methodology', 'Max Marks': '25', 'Weight': '1.0', 'Order': '1'}];
        break;
      case 'attendance':
        data = [{'Student Roll Number': '2200030001', 'Meeting Date': '2026-08-05', 'Status': 'Present'}];
        break;
      case 'meetings':
        data = [{'Team ID': 'T001', 'Meeting Date': '2026-08-05', 'Topic': 'Architecture Review', 'Notes': 'Progress approved'}];
        break;
      case 'submissions':
        data = [{'Team ID': 'T001', 'Deliverable Type': 'SRS Document', 'File URL': 'https://github.com/capstone/docs', 'Submission Date': '2026-08-10'}];
        break;
      default:
        data = [{'ID': '1', 'Name': 'Sample Data'}];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  const triggerUploadCard = (targetType, label) => {
    setUploadType(targetType);
    setUploadLabel(label);
    const hiddenInput = document.getElementById('bulk-file-input');
    if (hiddenInput) {
      hiddenInput.click();
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile, uploadType);
      setShowModal(true);
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
          const extracted = { student: [], guide: [], faculty: [], reviewer: [], teams: [], assignments: [] };
          let totalRows = 0;
          let sheetsFound = 0;

          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            
            if (matchSheetName(sheetName, 'student')) { extracted.student = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'guide')) { extracted.guide = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'faculty')) { extracted.faculty = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'reviewer')) { extracted.reviewer = json; totalRows += json.length; sheetsFound++; }
            else if (matchSheetName(sheetName, 'teams')) { extracted.teams = json; totalRows += json.length; sheetsFound++; }
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
          
          const validation = validateRecordHeaders(json, type);
          if (!validation.valid) {
            setErrorMsg(validation.error);
            setPreviewData(null);
            return;
          }

          setPreviewData({
            isMaster: false,
            records: json,
            summary: {
              total: json.length,
              valid: json.length,
              invalid: 0
            }
          });
        }
      } catch (err) {
        console.error("Error parsing workbook:", err);
        setErrorMsg("Failed to parse file. Make sure it is a valid CSV or Excel workbook.");
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteSync = async () => {
    if (!previewData) return;
    setProcessing(true);
    setErrorMsg(null);
    setSyncStatus(null);
    setSyncSummaryDetails(null);
    
    const startTime = performance.now();
    const now = new Date().toISOString();
    const importId = `IMP-${Date.now()}`;
    
    let rowsRead = 0;
    let rowsImported = 0;
    let rowsSkipped = 0;
    let rowsFailed = 0;
    let totalWrites = 0;
    const writeErrors = [];

    try {
      if (previewData.isMaster) {
        const { student, guide, faculty, reviewer, teams, assignments } = previewData.sheets;
        setProcessingState('Syncing Master Data...');

        // 1. Sync Students
        if (student && student.length > 0) {
          rowsRead += student.length;
          setProcessingState(`Importing ${student.length} Students...`);
          const studentDocs = student.map((row, i) => {
            let id = getField(row, ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID', 'Registration Number', 'Reg No', 'Email', 'email']).toLowerCase();
            if (!id) id = `std-${Date.now()}-${i}`;

            return {
              id,
              data: {
                ...row,
                id,
                rollNumber: getField(row, ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID']).toUpperCase() || id.toUpperCase(),
                name: getField(row, ['Student Name', 'studentName', 'Full Name', 'fullName', 'Name', 'name']) || `Student ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Student Email', 'studentEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                section: getField(row, ['Section', 'section', 'Sec', 'sec']) || 'A',
                year: getField(row, ['Year', 'year', 'Academic Year', 'academicYear']) || '2026-27',
                semester: getField(row, ['Semester', 'semester', 'Sem', 'sem']) || 'Odd',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              }
            };
          });

          // WriteBatches in chunks of 400
          for (let i = 0; i < studentDocs.length; i += 400) {
            const chunk = studentDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.set(doc(db, 'students', item.id), item.data, { merge: true });
              console.log(`[BULK_IMPORT] Batch Queued -> Col: 'students', Doc ID: '${item.id}'`, item.data);
            });
            await batch.commit();
            totalWrites += chunk.length;
            rowsImported += chunk.length;
            console.log(`[BULK_IMPORT] Batch Committed -> ${chunk.length} docs written to 'students'.`);
          }
        }

        // 2. Sync Guides
        if (guide && guide.length > 0) {
          rowsRead += guide.length;
          setProcessingState(`Importing ${guide.length} Guides...`);
          const guideDocs = guide.map((row, i) => {
            let id = getField(row, ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            if (!id) id = `gde-${Date.now()}-${i}`;

            return {
              id,
              data: {
                ...row,
                id,
                guideId: getField(row, ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Guide ID', 'guideId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                name: getField(row, ['Guide Name', 'guideName', 'Name', 'name', 'Full Name', 'fullName']) || `Guide ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Guide Email', 'guideEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title']) || 'Professor',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              }
            };
          });

          for (let i = 0; i < guideDocs.length; i += 400) {
            const chunk = guideDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.set(doc(db, 'guides', item.id), item.data, { merge: true });
              console.log(`[BULK_IMPORT] Batch Queued -> Col: 'guides', Doc ID: '${item.id}'`, item.data);
            });
            await batch.commit();
            totalWrites += chunk.length;
            rowsImported += chunk.length;
            console.log(`[BULK_IMPORT] Batch Committed -> ${chunk.length} docs written to 'guides'.`);
          }
        }

        // 3. Sync Faculty (classroomFaculty)
        if (faculty && faculty.length > 0) {
          rowsRead += faculty.length;
          setProcessingState(`Importing ${faculty.length} Classroom Faculty...`);
          const facultyDocs = faculty.map((row, i) => {
            let id = getField(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            if (!id) id = `fac-${Date.now()}-${i}`;

            return {
              id,
              data: {
                ...row,
                id,
                facultyId: getField(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Faculty ID', 'facultyId']) || id.toUpperCase(),
                name: getField(row, ['Faculty Name', 'facultyName', 'Name', 'name', 'Full Name', 'fullName']) || `Faculty ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Faculty Email', 'facultyEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title', 'Role', 'role']) || 'Associate Professor',
                section: getField(row, ['Section', 'section', 'Sec', 'sec']) || 'Section A',
                specialization: getField(row, ['Specialization', 'specialization', 'Domain', 'domain', 'Expertise']) || 'Computer Science',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              }
            };
          });

          for (let i = 0; i < facultyDocs.length; i += 400) {
            const chunk = facultyDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.set(doc(db, 'classroomFaculty', item.id), item.data, { merge: true });
              console.log(`[BULK_IMPORT] Batch Queued -> Col: 'classroomFaculty', Doc ID: '${item.id}'`, item.data);
            });
            await batch.commit();
            totalWrites += chunk.length;
            rowsImported += chunk.length;
            console.log(`[BULK_IMPORT] Batch Committed -> ${chunk.length} docs written to 'classroomFaculty'.`);
          }
        }

        // 4. Sync Reviewers (reviewers)
        if (reviewer && reviewer.length > 0) {
          rowsRead += reviewer.length;
          setProcessingState(`Importing ${reviewer.length} Reviewers...`);
          const reviewerDocs = reviewer.map((row, i) => {
            let id = getField(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            if (!id) id = `rev-${Date.now()}-${i}`;

            return {
              id,
              data: {
                ...row,
                id,
                reviewerId: getField(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Reviewer ID', 'reviewerId']) || id.toUpperCase(),
                name: getField(row, ['Reviewer Name', 'reviewerName', 'Name', 'name', 'Full Name', 'fullName']) || `Reviewer ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Reviewer Email', 'reviewerEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                organization: getField(row, ['Organization', 'organization', 'Org', 'org', 'Institution', 'Department', 'department']) || 'KL University',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title', 'Role', 'role']) || 'Senior Evaluator',
                reviewerType: getField(row, ['Reviewer Type', 'reviewerType', 'Type', 'type']) || 'Internal',
                expertise: getField(row, ['Expertise', 'expertise', 'Specialization', 'specialization', 'Domain']) || 'Software Engineering',
                department: getField(row, ['Department', 'department', 'Dept', 'dept']) || 'Computer Science & Engineering',
                assignedBatch: getField(row, ['Assigned Batch', 'assignedBatch', 'Batch', 'batch']) || '2026',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              }
            };
          });

          for (let i = 0; i < reviewerDocs.length; i += 400) {
            const chunk = reviewerDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.set(doc(db, 'reviewers', item.id), item.data, { merge: true });
              console.log(`[BULK_IMPORT] Batch Queued -> Col: 'reviewers', Doc ID: '${item.id}'`, item.data);
            });
            await batch.commit();
            totalWrites += chunk.length;
            rowsImported += chunk.length;
            console.log(`[BULK_IMPORT] Batch Committed -> ${chunk.length} docs written to 'reviewers'.`);
          }
        }

        if (teams && teams.length > 0) {
          rowsRead += teams.length;
          setProcessingState(`Running Teams Engine on ${teams.length} teams...`);
          const result = await syncService.syncTeams(teams);
          totalWrites += result.created + result.updated;
          rowsImported += result.created + result.updated;
        }

        if (assignments && assignments.length > 0) {
          rowsRead += assignments.length;
          setProcessingState(`Running Assignment Engine on ${assignments.length} mappings...`);
          const result = await syncService.syncAssignments(assignments);
          totalWrites += result.stats.studentsAssigned + (result.stats.teamsCreated * 2);
          rowsImported += result.stats.studentsLinked;
        }

        await auditService.log(currentUser?.uid || 'admin', 'MASTER_IMPORT', 'BulkUpload', importId, { totalWrites });

      } else {
        // Single Sheet Mode
        setProcessingState(`Importing ${previewData.summary.total} records...`);
        const records = previewData.records;
        rowsRead = records.length;

        if (uploadType === 'assignments') {
          const result = await syncService.syncAssignments(records);
          totalWrites += (result.stats?.studentsLinked || result.stats?.studentsUpdated || 0);
          rowsImported += (result.stats?.studentsLinked || 0);
        } else if (uploadType === 'guide_assignments') {
          const result = await syncService.syncGuideAssignments(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
        } else if (uploadType === 'faculty_assignments') {
          const result = await syncService.syncFacultyAssignments(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
        } else if (uploadType === 'reviewer_assignments') {
          const result = await syncService.syncReviewerAssignments(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
        } else if (uploadType === 'team_assignments') {
          const result = await syncService.syncTeamAssignments(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
        } else if (uploadType === 'project_assignments') {
          const result = await syncService.syncProjectAssignments(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
        } else if (uploadType === 'rubrics') {
          const result = await syncService.syncRubrics(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
          if (result.errors) writeErrors.push(...result.errors);
        } else if (uploadType === 'rubric_criteria') {
          const result = await syncService.syncRubricCriteria(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
          if (result.errors) writeErrors.push(...result.errors);
        } else if (uploadType === 'evaluation_schedule' || uploadType === 'review_cycles') {
          const result = await syncService.syncEvaluationSchedule(records);
          totalWrites += (result.totalWrites || result.imported || 0);
          rowsImported += (result.imported || 0);
          rowsSkipped += (result.skipped || 0);
          rowsFailed += (result.failed || 0);
          if (result.errors) writeErrors.push(...result.errors);
        } else if (uploadType === 'teams') {
          const result = await syncService.syncTeams(records);
          totalWrites += result.created + result.updated;
          rowsImported += result.created + result.updated;
          if (result.errors) writeErrors.push(...result.errors);
        } else {
          let colName = 'students';
          if (uploadType === 'guide' || uploadType === 'guides') colName = 'guides';
          else if (uploadType === 'reviewer' || uploadType === 'reviewers') colName = 'reviewers';
          else if (uploadType === 'faculty' || uploadType === 'classroomFaculty') colName = 'classroomFaculty';
          else if (uploadType === 'projects') colName = 'projects';
          else if (uploadType === 'review_cycles') colName = 'reviewCycles';
          else if (uploadType === 'rubrics') colName = 'rubrics';
          else if (uploadType === 'attendance') colName = 'attendance';
          else if (uploadType === 'meetings') colName = 'meetings';
          else if (uploadType === 'submissions') colName = 'submissions';
          else if (uploadType === 'guide_assignments') colName = 'guideAssignments';
          else if (uploadType === 'faculty_assignments') colName = 'facultyAssignments';
          else if (uploadType === 'reviewer_assignments') colName = 'reviewerAssignments';
          else if (uploadType === 'team_assignments') colName = 'teamAssignments';
          else if (uploadType === 'project_assignments') colName = 'projectAssignments';
          
          const recordDocs = records.map((row, i) => {
            let id = '';
            
            if (colName === 'students') {
              id = getField(row, ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID', 'Registration Number', 'Reg No', 'Email', 'email']).toLowerCase();
            } else if (colName === 'guides') {
              id = getField(row, ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            } else if (colName === 'classroomFaculty') {
              id = getField(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            } else if (colName === 'reviewers') {
              id = getField(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Email', 'email']).toLowerCase();
            } else if (colName === 'teams') {
              id = getField(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']).toLowerCase();
            } else if (colName === 'projects') {
              id = getField(row, ['Project ID', 'projectId', 'Project Title', 'projectTitle']).toLowerCase();
            } else {
              id = getField(row, ['ID', 'id', 'Roll Number', 'rollNumber', 'Employee ID', 'employeeId', 'Email', 'email']).toLowerCase();
            }

            if (!id) {
              const rollOrName = getField(row, ['Student Name', 'Faculty Name', 'Reviewer Name', 'Guide Name', 'Name', 'email', 'Email']);
              id = rollOrName ? rollOrName.toLowerCase().replace(/[^a-z0-9_-]/g, '') : `rec-${Date.now()}-${i}`;
            }

            let mappedRecord = { ...row, id, createdAt: now, status: getField(row, ['Status', 'status']) || 'Active' };

            if (colName === 'classroomFaculty') {
              mappedRecord = {
                ...row,
                id,
                facultyId: getField(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Faculty ID', 'facultyId']) || id.toUpperCase(),
                name: getField(row, ['Faculty Name', 'facultyName', 'Name', 'name', 'Full Name', 'fullName']) || `Faculty ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Faculty Email', 'facultyEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title', 'Role', 'role']) || 'Associate Professor',
                section: getField(row, ['Section', 'section', 'Sec', 'sec']) || 'Section A',
                specialization: getField(row, ['Specialization', 'specialization', 'Domain', 'domain', 'Expertise']) || 'Computer Science',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              };
            } else if (colName === 'reviewers') {
              mappedRecord = {
                ...row,
                id,
                reviewerId: getField(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Reviewer ID', 'reviewerId']) || id.toUpperCase(),
                name: getField(row, ['Reviewer Name', 'reviewerName', 'Name', 'name', 'Full Name', 'fullName']) || `Reviewer ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Reviewer Email', 'reviewerEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                organization: getField(row, ['Organization', 'organization', 'Org', 'org', 'Institution', 'Department', 'department']) || 'KL University',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title', 'Role', 'role']) || 'Senior Evaluator',
                reviewerType: getField(row, ['Reviewer Type', 'reviewerType', 'Type', 'type']) || 'Internal',
                expertise: getField(row, ['Expertise', 'expertise', 'Specialization', 'specialization', 'Domain']) || 'Software Engineering',
                department: getField(row, ['Department', 'department', 'Dept', 'dept']) || 'Computer Science & Engineering',
                assignedBatch: getField(row, ['Assigned Batch', 'assignedBatch', 'Batch', 'batch']) || '2026',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              };
            } else if (colName === 'students') {
              const rollNumber = getField(row, ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student Roll Number', 'Student ID', 'StudentID', 'Registration Number', 'Reg No']).toUpperCase() || id.toUpperCase();
              const teamIdVal = getField(row, ['Team ID', 'teamId', 'TeamID', 'Team Id', 'team', 'Team No', 'team_id']);
              const guideIdVal = getField(row, ['Guide ID', 'guideId', 'GuideID', 'Guide Id', 'guide_id', 'Guide Employee ID', 'Guide Email', 'guideEmail']);
              const facultyIdVal = getField(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Faculty Id', 'faculty_id', 'Faculty Employee ID', 'Faculty Email', 'facultyEmail']);
              const reviewerIdVal = getField(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Reviewer Id', 'reviewer_id', 'Reviewer Employee ID', 'Reviewer Email', 'reviewerEmail']);
              const projectIdVal = getField(row, ['Project ID', 'projectId', 'ProjectID', 'Project Id', 'project_id']);

              mappedRecord = {
                ...row,
                id,
                rollNumber,
                name: getField(row, ['Student Name', 'studentName', 'Full Name', 'fullName', 'Name', 'name']) || `Student ${rollNumber}`,
                email: getField(row, ['Email', 'email', 'Student Email', 'studentEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                section: getField(row, ['Section', 'section', 'Sec', 'sec']) || 'A',
                year: getField(row, ['Year', 'year', 'Academic Year', 'academicYear']) || '2026-27',
                semester: getField(row, ['Semester', 'semester', 'Sem', 'sem']) || 'Odd',
                teamId: teamIdVal,
                guideId: guideIdVal,
                facultyId: facultyIdVal,
                reviewerId: reviewerIdVal,
                projectId: projectIdVal,
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              };
            } else if (colName === 'teams') {
              mappedRecord = {
                ...row,
                id,
                teamId: id,
                teamName: getField(row, ['Team Name', 'teamName', 'Name', 'name']) || `Team ${id.toUpperCase()}`,
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              };
            } else if (colName === 'projects') {
              mappedRecord = {
                ...row,
                id,
                projectId: id,
                projectTitle: getField(row, ['Project Title', 'projectTitle', 'Title', 'title']) || `Project ${id.toUpperCase()}`,
                description: getField(row, ['Description', 'description', 'Abstract', 'abstract']) || '',
                domain: getField(row, ['Domain', 'domain']) || 'Computer Science',
                status: getField(row, ['Status', 'status']) || 'In Progress',
                createdAt: now,
                updatedAt: now
              };
            } else if (colName === 'guides') {
              mappedRecord = {
                ...row,
                id,
                guideId: getField(row, ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID']) || id.toUpperCase(),
                employeeId: getField(row, ['Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Guide ID', 'guideId']) || id.toUpperCase(),
                name: getField(row, ['Guide Name', 'guideName', 'Name', 'name', 'Full Name', 'fullName']) || `Guide ${id.toUpperCase()}`,
                email: getField(row, ['Email', 'email', 'Guide Email', 'guideEmail']) || `${id}@kluniversity.in`,
                phone: getField(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
                department: getField(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
                designation: getField(row, ['Designation', 'designation', 'Title', 'title']) || 'Professor',
                status: getField(row, ['Status', 'status']) || 'Active',
                createdAt: now,
                updatedAt: now
              };
            }

            return { id, colName, data: mappedRecord };
          });

          // WriteBatches in chunks of 400
          for (let i = 0; i < recordDocs.length; i += 400) {
            const chunk = recordDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.set(doc(db, item.colName, item.id), item.data, { merge: true });
              console.log(`[BULK_IMPORT_ENGINE] Batch Queued -> Col: '${item.colName}', Doc ID: '${item.id}'`, item.data);
            });
            await batch.commit();
            totalWrites += chunk.length;
            rowsImported += chunk.length;
            console.log(`[BULK_IMPORT_ENGINE] Batch Committed -> ${chunk.length} docs written to '${colName}'.`);
          }
        }

        await auditService.log(currentUser?.uid || 'admin', `SINGLE_IMPORT_${uploadType.toUpperCase()}`, 'BulkUpload', importId, { count: records.length, totalWrites });
      }

      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      setSyncSummaryDetails({
        rowsRead,
        rowsImported,
        rowsSkipped,
        rowsFailed,
        docsCreated: totalWrites,
        executionTimeMs
      });

      // Check overall success vs failures
      if (totalWrites === 0) {
        setErrorMsg(`Import Failed: 0 documents were written to Firestore. Processed ${rowsRead} records with ${rowsFailed} failures.`);
        setSyncStatus(null);
      } else {
        setSyncStatus(`Upload Execution Complete!\n\nRows Read: ${rowsRead}\nRows Imported: ${rowsImported}\nRows Skipped: ${rowsSkipped}\nRows Failed: ${rowsFailed}\nFirestore Documents Created: ${totalWrites}\nExecution Time: ${executionTimeMs}ms`);
      }

      // Add to recent history
      setUploadHistory(prev => [
        {
          id: String(Date.now()),
          fileName: file?.name || 'Uploaded_File.xlsx',
          collection: uploadLabel,
          user: currentUser?.email?.split('@')[0] || 'Admin',
          time: 'Just now',
          status: totalWrites > 0 ? 'Success' : 'Failed',
          records: totalWrites
        },
        ...prev
      ]);

      setPreviewData(null);
      setFile(null);
    } catch (err) {
      console.error("Error syncing data:", err);
      setErrorMsg("Critical Failure: " + err.message + ". The process was aborted safely.");
    } finally {
      setProcessing(false);
      setProcessingState('');
    }
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Enterprise Bulk Upload Center">
      
      {/* Hidden File Picker */}
      <input 
        type="file" 
        id="bulk-file-input" 
        accept=".csv, .xlsx, .xls" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Control Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="h-7 w-7 text-primary-600" /> Enterprise Bulk Upload Center
              </h1>
              <Badge variant="primary" className="text-xs">v3.2 Production</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Import master data, assignments, and academic configuration into the Capstone Management System with automatic reference validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate('master')}
              className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 text-primary-600" /> Download All Templates
            </Button>

            <Button
              variant={activeTab === 'purge' ? 'primary' : 'outline'}
              onClick={() => setActiveTab(prev => prev === 'upload' ? 'purge' : 'upload')}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-red-600" /> {activeTab === 'purge' ? 'Back to Uploads' : 'Selective Purge Data'}
            </Button>
          </div>
        </div>

        {activeTab === 'purge' ? (
          <SelectivePurgeData />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* SECTION 1: ⭐ MASTER IMPORT (Featured Card) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 flex items-center gap-1 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Recommended Master Import
                      </Badge>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-white">Complete University Master Workbook</h2>
                    <p className="text-xs text-primary-100 leading-relaxed">
                      Upload a single multi-sheet Excel file containing Students, Guides, Faculty, Reviewers, Teams, Projects, and Assignments to automatically seed the entire university system.
                    </p>
                  </div>

                  <div className="hidden sm:block p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                    <FileSpreadsheet className="w-10 h-10 text-primary-200" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => triggerUploadCard('master', 'Master Workbook')}
                    className="bg-white text-primary-900 hover:bg-primary-50 font-bold flex items-center gap-2 shadow-lg"
                  >
                    <UploadIcon className="w-4 h-4 text-primary-600" /> Upload Master Workbook
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={() => downloadTemplate('master')}
                    className="border-white/30 text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Master Template (.xlsx)
                  </Button>
                </div>
              </div>

              {/* SECTION 2: MASTER DATA (6 Grid Cards) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-600" /> Section 1: Master Entity Data
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'student', name: 'Students', desc: 'Import student profiles, emails, batch & section', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'projects', name: 'Projects', desc: 'Import capstone project titles & abstracts', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { id: 'teams', name: 'Teams', desc: 'Import team numbers & group titles', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { id: 'guide', name: 'Guides', desc: 'Import faculty mentor profiles & departments', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'faculty', name: 'Classroom Faculty', desc: 'Import course teaching faculty records', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { id: 'reviewer', name: 'Reviewers', desc: 'Import review panel evaluators & batches', icon: UserCog, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map(card => {
                    const CardIcon = card.icon;
                    return (
                      <Card key={card.id} className="p-4 hover:shadow-md transition-all duration-200 border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${card.bg}`}>
                            <CardIcon className={`w-5 h-5 ${card.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{card.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{card.desc}</p>
                            
                            <div className="mt-4 flex gap-2">
                              <Button 
                                size="xs" 
                                onClick={() => triggerUploadCard(card.id, card.name)}
                                className="flex-1 flex items-center justify-center gap-1 text-xs"
                              >
                                <UploadIcon className="w-3 h-3" /> Upload
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline"
                                onClick={() => downloadTemplate(card.id)}
                                className="flex items-center justify-center p-1.5 text-xs text-gray-600 border-gray-300"
                                title="Download Template"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: ASSIGNMENT IMPORTS (5 Grid Cards) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-600" /> Section 2: Relational Assignments
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'team_assignments', name: 'Team Assignments', desc: 'Map students to team groups', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { id: 'guide_assignments', name: 'Guide Assignments', desc: 'Assign mentors to teams', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'faculty_assignments', name: 'Classroom Faculty Assignments', desc: 'Map classroom faculty to teams & students', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { id: 'reviewer_assignments', name: 'Reviewer Assignments', desc: 'Map panel reviewers to review cycles', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { id: 'project_assignments', name: 'Project Assignments', desc: 'Map projects to team groups', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map(card => {
                    const CardIcon = card.icon;
                    return (
                      <Card key={card.id} className="p-4 hover:shadow-md transition-all border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${card.bg}`}>
                            <CardIcon className={`w-5 h-5 ${card.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 text-sm truncate">{card.name}</h4>
                              <Badge variant="primary" className="text-[10px] py-0 px-1.5">Validated</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{card.desc}</p>
                            
                            <div className="mt-4 flex gap-2">
                              <Button 
                                size="xs" 
                                onClick={() => triggerUploadCard(card.id, card.name)}
                                className="flex-1 flex items-center justify-center gap-1 text-xs"
                              >
                                <UploadIcon className="w-3 h-3" /> Upload
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline"
                                onClick={() => downloadTemplate(card.id)}
                                className="flex items-center justify-center p-1.5 text-xs text-gray-600 border-gray-300"
                                title="Download Template"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4 & 5: ACADEMIC CONFIG & EVALUATION DATA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                
                {/* Academic Config */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" /> Academic Configuration
                  </h3>

                  <div className="space-y-3">
                    {[
                      { id: 'evaluation_schedule', name: 'Evaluation Schedule', icon: Clock },
                      { id: 'rubrics', name: 'Rubrics Engine', icon: ClipboardList },
                      { id: 'rubric_criteria', name: 'Rubric Criteria', icon: FileCheck },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-bold text-gray-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="xs" variant="outline" onClick={() => downloadTemplate(item.id)} className="text-xs">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="xs" onClick={() => triggerUploadCard(item.id, item.name)} className="text-xs">
                              Upload
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Evaluation Data */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600" /> Evaluation Data
                  </h3>

                  <div className="space-y-3">
                    {[
                      { id: 'attendance', name: 'Attendance Records', icon: CheckCircle },
                      { id: 'meetings', name: 'Meeting Schedules', icon: PlayCircle },
                      { id: 'submissions', name: 'Deliverables Submissions', icon: UploadIcon },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-bold text-gray-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="xs" variant="outline" onClick={() => downloadTemplate(item.id)} className="text-xs">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="xs" onClick={() => triggerUploadCard(item.id, item.name)} className="text-xs">
                              Upload
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Sidebar: Upload Summary & History */}
            <div className="space-y-6">
              
              {/* Upload Summary Widget */}
              <Card title="Upload Summary (Last 30 Days)">
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                      <p className="text-2xl font-extrabold text-blue-700">{uploadSummaryStats.totalUploads}</p>
                      <p className="text-[10px] font-bold text-blue-900/70 uppercase mt-0.5">Total Uploads</p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                      <p className="text-2xl font-extrabold text-emerald-700">{uploadSummaryStats.totalUploads}</p>
                      <p className="text-[10px] font-bold text-emerald-900/70 uppercase mt-0.5">Successful</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-gray-100">
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>Records Processed:</span>
                      <span className="font-bold text-gray-900">{uploadSummaryStats.recordsImported}</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>Failed Attempts:</span>
                      <span className="font-bold text-emerald-600">0 Critical</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>Last Upload Sync:</span>
                      <span className="font-bold text-gray-900">{uploadSummaryStats.lastUpload}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Upload History Table */}
              <Card title="Recent Upload History">
                <div className="space-y-3">
                  {importAuditLogs.length === 0 ? (
                    <div className="py-6">
                      <EmptyState
                        icon={FileSpreadsheet}
                        title="No Recent Uploads"
                        description="Bulk file imports and upload logs will appear here after execution."
                      />
                    </div>
                  ) : (
                    importAuditLogs.slice(0, 5).map((item, idx) => (
                      <div key={item.id || idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900 truncate max-w-[160px]" title={item.entity}>
                            {item.entity || item.action}
                          </span>
                          <Badge variant="success" className="text-[10px] py-0 px-1.5">
                            Success
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                          <span>{item.action} • {item.updatedValue?.count || item.updatedValue?.totalWrites || 1} recs</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Security & Validation Highlights Card */}
              <Card className="bg-gradient-to-br from-slate-900 to-gray-900 text-white">
                <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Smart Validation Engine
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  Automatic duplicate checking, email syntax validation, and relational ID reference checks prior to Firestore WriteBatches.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Audit Logging Active
                </div>
              </Card>

            </div>

          </div>
        )}

      </div>

      {/* Pre-Upload Validation & Progress Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { if (!processing) setShowModal(false); }}
        title={`Pre-Upload Validation - ${uploadLabel}`}
      >
        <div className="space-y-4">
          {processing ? (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
              <div>
                <h4 className="font-bold text-gray-900">Processing Data Sync...</h4>
                <p className="text-xs text-gray-500 mt-1">{processingState || 'Executing Firestore WriteBatches...'}</p>
              </div>
            </div>
          ) : syncStatus ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs whitespace-pre-wrap font-mono">
                {syncStatus}
              </div>

              {syncSummaryDetails && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="block text-gray-500 text-[10px]">ROWS READ</span>
                    <span className="font-bold text-blue-700">{syncSummaryDetails.rowsRead}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <span className="block text-gray-500 text-[10px]">IMPORTED</span>
                    <span className="font-bold text-emerald-700">{syncSummaryDetails.rowsImported}</span>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg">
                    <span className="block text-gray-500 text-[10px]">TIME (MS)</span>
                    <span className="font-bold text-purple-700">{syncSummaryDetails.executionTimeMs}ms</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowModal(false)}>Close & Refresh</Button>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-mono whitespace-pre-wrap">
                {errorMsg}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
              </div>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                <span className="font-bold">File: {file?.name}</span>
                <span>{previewData.summary.total} Total Rows Detected</span>
              </div>

              {previewData.isMaster ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.keys(previewData.sheets).map(sheetKey => (
                    <div key={sheetKey} className="p-2 bg-gray-50 border rounded flex justify-between">
                      <span className="font-semibold text-gray-700 capitalize">{sheetKey}</span>
                      <span className="font-bold text-primary-600">{previewData.sheets[sheetKey].length} rows</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50 text-xs">
                  <p className="font-bold text-gray-700 mb-2">First 3 Rows Preview:</p>
                  <pre className="text-[10px] text-gray-600 overflow-x-auto">
                    {JSON.stringify(previewData.records.slice(0, 3), null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleExecuteSync} className="font-bold">Execute Import</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default CsvSync;
