import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { projectService } from '@/firebase/services/projectService';
import { Loader2, Search, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';

const ViewSubmissions = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchSubmissions(currentUser.uid);
    }
  }, [currentUser]);

  const fetchSubmissions = async (facultyId) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch students assigned to this faculty
      const students = await studentService.getByFacultyId(facultyId);
      
      // Fetch all projects (or preferably projects assigned to these students)
      const allProjects = await projectService.getAll();
      
      // Merge data to create a "submissions" view
      const mergedData = students.map(student => {
        const proj = allProjects.find(p => p.studentId === student.uid);
        return {
          id: student.uid,
          studentName: student.name,
          rollNumber: student.rollNumber,
          projectTitle: proj?.title || 'No Project Assigned',
          milestone: proj?.currentMilestone || 'Not Started',
          repoLink: proj?.repositoryLink || null,
          status: proj ? 'Submitted' : 'Pending',
          updatedAt: proj?.updatedAt || '-'
        };
      });

      setSubmissions(mergedData);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to fetch submissions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { header: 'Roll No.', accessor: 'rollNumber', render: (row) => <span className="font-semibold text-gray-900">{row.rollNumber}</span> },
    { header: 'Student Name', accessor: 'studentName' },
    { header: 'Project Title', accessor: 'projectTitle', render: (row) => (
      <div className="max-w-[200px] truncate" title={row.projectTitle}>{row.projectTitle}</div>
    )},
    { header: 'Milestone', accessor: 'milestone' },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Submitted' ? 'success' : 'warning'}>
        {row.status}
      </Badge>
    )},
    { header: 'Submission Date', render: (row) => (
      <span className="text-sm text-gray-500">
        {row.updatedAt !== '-' ? new Date(row.updatedAt).toLocaleDateString() : '-'}
      </span>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex gap-2">
        {row.repoLink ? (
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => window.open(row.repoLink, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" /> View Repo
          </Button>
        ) : (
           <Button variant="ghost" size="sm" disabled className="text-xs">
            <Download className="w-3 h-3 mr-1" /> N/A
          </Button>
        )}
      </div>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - View Submissions">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - View Submissions">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-600" /> Project Submissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">Review documents and repository links submitted by your assigned students.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="w-full md:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by student, roll number, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
               <Badge variant="primary" className="px-3 py-1.5 text-sm font-medium">
                 {filteredSubmissions.length} Records Found
               </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredSubmissions.length > 0 ? (
              <Table columns={columns} data={filteredSubmissions} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={FileText}
                  title="No Submissions Found"
                  description={searchQuery ? `No matches found for "${searchQuery}".` : "No project submissions exist for your students."}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewSubmissions;
