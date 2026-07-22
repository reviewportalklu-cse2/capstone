import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { submissionService, auditService, studentService, projectService } from '@/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCsv } from '@/utils/csvExport';
import { Search, Loader2, Download, CheckCircle, XCircle } from 'lucide-react';

const SubmissionsManagement = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suData, stData, prData] = await Promise.all([
        submissionService.getAll(),
        studentService.getAll(),
        projectService.getAll()
      ]);
      setSubmissions(suData || []);
      setStudents(stData || []);
      setProjects(prData || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (submission, status) => {
    try {
      await submissionService.update(submission.id, { status });
      await auditService.log(currentUser.uid, `UPDATE_SUBMISSION_${status.toUpperCase()}`, 'Submission', submission, { ...submission, status });
      setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, status } : s));
    } catch (err) {
      console.error("Error updating submission:", err);
    }
  };

  const handleExport = () => {
    const dataToExport = submissions.map(s => {
      const student = students.find(st => st.id === s.studentId);
      const project = projects.find(pr => pr.id === s.projectId);
      return {
        'Submission Type': s.type,
        'File Name': s.fileName,
        'Student': student?.name || 'Unknown',
        'Project': project?.title || 'Unknown',
        'Date': new Date(s.createdAt).toLocaleDateString(),
        'Status': s.status || 'Pending'
      };
    });
    exportToCsv('capstoneflow_submissions.csv', dataToExport);
  };

  const filteredSubmissions = submissions.filter(s => 
    s.type?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Submission Info', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.type}</p>
          <p className="text-xs text-primary-600 truncate max-w-[200px]">{row.fileName}</p>
        </div>
      ) 
    },
    { 
      header: 'Student', 
      render: (row) => {
        const st = students.find(s => s.id === row.studentId);
        return <span className="text-sm">{st?.name || 'Unknown'}</span>;
      }
    },
    { 
      header: 'Project', 
      render: (row) => {
        const pr = projects.find(p => p.id === row.projectId);
        return <span className="text-sm">{pr?.title || 'Unknown'}</span>;
      }
    },
    { 
      header: 'Submitted On', 
      render: (row) => <span className="text-sm text-gray-600">{new Date(row.createdAt).toLocaleDateString()}</span> 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'warning'}>
          {row.status || 'Pending'}
        </Badge>
      )
    },
    { 
      header: 'Action', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.fileUrl && (
            <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-700" title="Download">
              <Download className="w-4 h-4" />
            </a>
          )}
          <button 
            onClick={() => handleUpdateStatus(row, 'Approved')} 
            className="text-green-500 hover:text-green-700" 
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleUpdateStatus(row, 'Rejected')} 
            className="text-red-500 hover:text-red-700" 
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) 
    },
  ];

  return (
    <DashboardLayout navigationItems={adminNavigation} title="CapstoneFlow - Submissions Management">
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by Type or Filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <Table columns={columns} data={filteredSubmissions} />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubmissionsManagement;
