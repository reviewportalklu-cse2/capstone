import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Download, Users } from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/utils/ReportExporter';

const StaffPerformanceReports = () => {
  const navigationItems = useAdminNavigation();
  const { guideAnalytics, facultyAnalytics, reviewerAnalytics, dataLoading } = useAnalytics();
  const [activeTab, setActiveTab] = useState('guide');

  const tabs = [
    { id: 'guide', label: 'Guide Performance' },
    { id: 'faculty', label: 'Faculty Performance' },
    { id: 'reviewer', label: 'Reviewer Workload' }
  ];

  const guideColumns = [
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-900">{row.name}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Assigned Teams', accessor: 'assignedTeamsCount' },
    { header: 'Assigned Students', accessor: 'assignedStudentsCount' },
    { header: 'Avg Team Score', accessor: 'averageTeamScore' },
    { header: 'Avg Attendance', accessor: 'averageAttendance', render: (row) => `${row.averageAttendance}%` },
    { header: 'Completed Reviews', accessor: 'completedReviews' }
  ];

  const facultyColumns = [
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-900">{row.name}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Assigned Teams', accessor: 'assignedTeamsCount' },
    { header: 'Assigned Students', accessor: 'assignedStudentsCount' },
    { header: 'Avg Marks Awarded', accessor: 'averageMarksAwarded' },
    { header: 'Completed Reviews', accessor: 'completedReviews' }
  ];

  const reviewerColumns = [
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-900">{row.name}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Review Cycles', accessor: 'reviewCyclesParticipated' },
    { header: 'Teams Reviewed', accessor: 'teamsReviewed' },
    { header: 'Completed', accessor: 'completedReviews' },
    { header: 'Pending', accessor: 'pendingReviews', render: (row) => (
      <Badge variant={row.pendingReviews > 0 ? 'warning' : 'success'}>
        {row.pendingReviews > 0 ? row.pendingReviews : '0'}
      </Badge>
    )},
    { header: 'Avg Marks Awarded', accessor: 'averageMarksAwarded' }
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'guide': return guideAnalytics;
      case 'faculty': return facultyAnalytics;
      case 'reviewer': return reviewerAnalytics;
      default: return [];
    }
  };

  const getActiveColumns = () => {
    switch (activeTab) {
      case 'guide': return guideColumns;
      case 'faculty': return facultyColumns;
      case 'reviewer': return reviewerColumns;
      default: return [];
    }
  };

  const handleExportPDF = () => {
    const data = getActiveData();
    const columns = getActiveColumns();
    const headers = columns.map(c => c.header);
    const rows = data.map(item => columns.map(col => {
      // Very basic data extraction, since render functions aren't easily stringified for jspdf
      if (col.accessor === 'averageAttendance') return `${item[col.accessor]}%`;
      return item[col.accessor] || '0';
    }));
    
    exportToPDF(`${activeTab}_performance_report`, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Performance Analytics`, headers, rows, 'landscape');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Staff Performance Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Workload & Performance</h1>
              <p className="text-sm text-gray-500">Track and analyze staff involvement in capstone projects.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(`${activeTab}_performance`, getActiveData())}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-0">
            {dataLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table columns={getActiveColumns()} data={getActiveData()} />
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffPerformanceReports;
