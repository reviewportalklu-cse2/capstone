import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { Loader2, Search, FileBarChart, Download, ExternalLink, AlertCircle } from 'lucide-react';

const ViewSubmissions = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchSubmissions(currentUser.uid);
    }
  }, [currentUser]);

  const fetchSubmissions = async (uid) => {
    try {
      setLoading(true);
      const data = await studentService.getByReviewerId(uid);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to fetch student submissions.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQ = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name?.toLowerCase().includes(lowerQ) || 
      s.rollNumber?.toLowerCase().includes(lowerQ) ||
      s.projectTitle?.toLowerCase().includes(lowerQ)
    );
  }, [students, searchQuery]);

  const columns = [
    { header: 'Student Name', accessor: 'name', render: (row) => (
      <div>
        <div className="font-semibold text-gray-900">{row.name}</div>
        <div className="text-xs text-gray-500">{row.rollNumber}</div>
      </div>
    )},
    { header: 'Project', accessor: 'projectTitle', render: (row) => <div className="max-w-[150px] truncate">{row.projectTitle || 'N/A'}</div> },
    { header: 'Proposal', render: (row) => (
      <Badge variant={row.documents?.proposal ? 'success' : 'secondary'}>
        {row.documents?.proposal ? 'Submitted' : 'Pending'}
      </Badge>
    )},
    { header: 'Design Doc', render: (row) => (
      <Badge variant={row.documents?.design ? 'success' : 'secondary'}>
        {row.documents?.design ? 'Submitted' : 'Pending'}
      </Badge>
    )},
    { header: 'Repository', render: (row) => (
      row.repositoryLink ? (
        <a href={row.repositoryLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1 font-medium">
          View Repo <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="text-gray-400 text-sm">Not linked</span>
      )
    )},
    { header: 'Actions', render: (row) => (
      <Button 
        variant="outline" 
        size="sm"
        className="text-xs flex items-center gap-1"
        onClick={() => alert(`Downloading archive for ${row.name}... (Simulated)`)}
      >
        <Download className="w-3 h-3" /> Download All
      </Button>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - View Submissions">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - View Submissions">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> View Submissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">Review project proposals, design documents, and final reports submitted by your assigned students.</p>
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
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredStudents.length > 0 ? (
              <Table columns={columns} data={filteredStudents} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={FileBarChart}
                  title="No Submissions Found"
                  description={searchQuery ? `No matches found for "${searchQuery}".` : "No submissions available to review."}
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
