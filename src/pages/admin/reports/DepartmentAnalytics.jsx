import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Layers, Download } from 'lucide-react';
import { exportToPDF } from '@/utils/ReportExporter';

const DepartmentAnalytics = () => {
  const navigationItems = useAdminNavigation();
  const { departmentAnalytics, dataLoading } = useAnalytics();

  const columns = [
    { header: 'Department', accessor: 'department', render: (row) => <span className="font-bold text-gray-900">{row.department}</span> },
    { header: 'Students', accessor: 'students' },
    { header: 'Teams', accessor: 'teams' },
    { header: 'Guides', accessor: 'guides' },
    { header: 'Faculty', accessor: 'faculty' },
    { header: 'Reviewers', accessor: 'reviewers' },
    { header: 'Avg Marks', accessor: 'averageMarks', render: (row) => <span className="font-bold text-primary-600">{row.averageMarks}</span> },
  ];

  const handleExport = () => {
    const headers = ['Department', 'Students', 'Teams', 'Guides', 'Faculty', 'Reviewers', 'Avg Marks'];
    const rows = departmentAnalytics.map(d => [d.department, d.students, d.teams, d.guides, d.faculty, d.reviewers, d.averageMarks]);
    exportToPDF('Department_Analytics', 'Department Overview', headers, rows, 'landscape');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Department Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Department Analytics</h1>
              <p className="text-sm text-gray-500">Cross-department statistics and academic benchmarking.</p>
            </div>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>

        <Card className="p-0 overflow-hidden">
          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table columns={columns} data={departmentAnalytics} />
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default DepartmentAnalytics;
