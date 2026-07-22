import React, { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Search, Users, ExternalLink, GraduationCap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyStudents = () => {
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

  const fetchStudents = async (facultyId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getByFacultyId(facultyId);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to fetch students. Please try again later.");
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
      <div className="max-w-[250px] truncate" title={row.projectTitle}>
        {row.projectTitle || 'N/A'}
      </div>
    )},
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Active' ? 'success' : 'secondary'}>
        {row.status || 'Unknown'}
      </Badge>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={() => navigate(`/faculty/marks?student=${row.uid}`)}
        >
          Evaluate
        </Button>
      </div>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - My Students">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - My Students">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary-600" /> My Assigned Students
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and evaluate students assigned to your classes.</p>
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
                 {filteredStudents.length} Students Found
               </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredStudents.length > 0 ? (
              <Table columns={columns} data={filteredStudents} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={GraduationCap}
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

export default MyStudents;
