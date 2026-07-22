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
import { Loader2, Search, UserCheck, AlertCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssignedStudents = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchStudents(currentUser.uid);
    }
  }, [currentUser]);

  const fetchStudents = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getByReviewerId(uid);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to fetch assigned students. Please try again later.");
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
      s.projectTitle?.toLowerCase().includes(lowerQ) ||
      s.batch?.toLowerCase().includes(lowerQ)
    );
  }, [students, searchQuery]);

  const columns = [
    { header: 'Roll No.', accessor: 'rollNumber', render: (row) => <span className="font-semibold text-gray-900">{row.rollNumber}</span> },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Batch', accessor: 'batch' },
    { header: 'Project', accessor: 'projectTitle', render: (row) => (
      <div className="max-w-[200px] truncate" title={row.projectTitle}>
        {row.projectTitle || 'N/A'}
      </div>
    )},
    { header: 'Review Stage', render: (row) => (
      <Badge variant={row.reviewStage === 'Review 3' ? 'success' : row.reviewStage === 'Review 2' ? 'warning' : 'primary'}>
        {row.reviewStage || 'Review 1'}
      </Badge>
    )},
    { header: 'Actions', render: (row) => (
      <Button 
        variant="outline" 
        size="sm"
        className="text-xs flex items-center"
        onClick={() => {
          const stage = row.reviewStage || 'Review 1';
          const route = stage === 'Review 3' ? '/reviewer/review3' : stage === 'Review 2' ? '/reviewer/review2' : '/reviewer/review1';
          navigate(`${route}?student=${row.uid}`);
        }}
      >
        <PlayCircle className="w-3 h-3 mr-1" /> Evaluate
      </Button>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Assigned Students">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Assigned Students">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary-600" /> Assigned Students
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and evaluate students explicitly assigned to your workflow.</p>
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
                placeholder="Search by name, roll number, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
               <Badge variant="primary" className="px-3 py-1.5 text-sm font-medium">
                 {filteredStudents.length} Students
               </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredStudents.length > 0 ? (
              <Table columns={columns} data={filteredStudents} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={UserCheck}
                  title="No Students Found"
                  description={searchQuery ? `No matches found for "${searchQuery}".` : "You have no assigned students currently."}
                />
              </div>
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AssignedStudents;
