import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { studentService } from '@/firebase/services/studentService';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, AlertCircle, Loader2 } from 'lucide-react';
import Input from '@/components/common/Input';

const StudentSearch = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchStudents(currentUser.uid);
    }
  }, [currentUser]);

  const fetchStudents = async (uid) => {
    try {
      setLoading(true);
      const data = await studentService.getByFacultyId(uid);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students for search.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.projectTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Roll Number', accessor: 'rollNumber', render: (row) => <span className="font-semibold text-gray-900">{row.rollNumber}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Project', accessor: 'projectTitle', render: (row) => (
      <div className="max-w-[200px] truncate">{row.projectTitle || '-'}</div>
    )},
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status || 'Unknown'}
        </Badge>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Search Student">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Search Student">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Search</h1>
          <p className="text-sm text-gray-500 mt-1">Global search across your assigned student batches.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card padding="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                className="pl-10"
                placeholder="Search by name, roll number, department, project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="ml-4">
              <Badge variant="primary" className="px-3 py-1">
                {filteredStudents.length} Results
              </Badge>
            </div>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={Users}
                title="No students found"
                description={searchTerm ? "No students match your search criteria." : "There are no students in the system yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={filteredStudents} />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentSearch;
