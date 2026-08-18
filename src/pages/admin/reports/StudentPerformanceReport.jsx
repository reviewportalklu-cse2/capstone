import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Search, Download, GraduationCap } from 'lucide-react';
import { exportToPDF, exportToCSV, exportToExcel } from '@/utils/ReportExporter';

const StudentPerformanceReport = () => {
  const navigationItems = useAdminNavigation();
  const { studentAnalytics, dataLoading } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery) return studentAnalytics;
    const q = searchQuery.toLowerCase();
    return studentAnalytics.filter(s => 
      s.rollNo?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.teamName?.toLowerCase().includes(q) ||
      s.guideName?.toLowerCase().includes(q)
    );
  }, [studentAnalytics, searchQuery]);

  const columns = [
    { header: 'Roll No', accessor: 'rollNo', render: (row) => <span className="font-semibold text-gray-900">{row.rollNo || row.rollNumber || 'N/A'}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Team', accessor: 'teamName', render: (row) => <span className="text-primary-600 font-medium">{row.teamName}</span> },
    { header: 'Guide', accessor: 'guideName' },
    { header: 'Reviewer', accessor: 'reviewerName' },
    { header: 'Attendance', accessor: 'attendancePercentage', render: (row) => `${row.attendancePercentage}%` },
    { header: 'Avg Marks', accessor: 'averageMarks', render: (row) => <span className="font-bold">{row.averageMarks}</span> },
    { 
      header: 'Performance', 
      render: (row) => {
        const variant = 
          row.averageMarks >= 85 ? 'success' : 
          row.averageMarks >= 70 ? 'primary' : 
          row.averageMarks >= 50 ? 'warning' : 'danger';
        const label = 
          row.averageMarks >= 85 ? 'Excellent' : 
          row.averageMarks >= 70 ? 'Good' : 
          row.averageMarks >= 50 ? 'Average' : 'Needs Focus';
        return <Badge variant={variant}>{label}</Badge>;
      }
    }
  ];

  const handleExportPDF = () => {
    const headers = ['Roll No', 'Name', 'Team', 'Guide', 'Reviewer', 'Attendance', 'Avg Marks'];
    const rows = filteredData.map(s => [
      s.rollNo || s.rollNumber || 'N/A', s.name, s.teamName, s.guideName, s.reviewerName, 
      `${s.attendancePercentage}%`, s.averageMarks
    ]);
    exportToPDF('Student_Performance_Report', 'Student Performance Analytics', headers, rows, 'portrait');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Student Performance Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Analytics Report</h1>
              <p className="text-sm text-gray-500">Individual student tracking and academic metrics.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV('Student_Performance_Report', filteredData)}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportToExcel('Student_Performance_Report', filteredData)}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-t-0">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                className="pl-9" 
                placeholder="Search by Roll No, Name, Team or Guide..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={filteredData} />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentPerformanceReport;
