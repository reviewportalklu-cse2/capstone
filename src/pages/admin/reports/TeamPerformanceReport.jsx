import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Search, Download, ShieldCheck, Filter } from 'lucide-react';
import { exportToPDF, exportToCSV, exportToExcel } from '@/utils/ReportExporter';

const TeamPerformanceReport = () => {
  const navigationItems = useAdminNavigation();
  const { teamAnalytics, dataLoading } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery) return teamAnalytics;
    const q = searchQuery.toLowerCase();
    return teamAnalytics.filter(t => 
      t.id?.toLowerCase().includes(q) ||
      t.projectName?.toLowerCase().includes(q) ||
      t.guideName?.toLowerCase().includes(q) ||
      t.currentReviewerName?.toLowerCase().includes(q)
    );
  }, [teamAnalytics, searchQuery]);

  const columns = [
    { header: 'Rank', accessor: 'rank', render: (row) => <span className="font-bold text-gray-900">#{row.rank}</span> },
    { header: 'Team ID', accessor: 'id', render: (row) => <span className="font-semibold text-primary-600">{row.id}</span> },
    { header: 'Project', accessor: 'projectName', render: (row) => <div className="max-w-[200px] truncate" title={row.projectName}>{row.projectName}</div> },
    { header: 'Guide', accessor: 'guideName' },
    { header: 'Current Reviewer', accessor: 'currentReviewerName' },
    { header: 'Progress', accessor: 'progress', render: (row) => `${row.progress}%` },
    { header: 'Attendance', accessor: 'attendance', render: (row) => `${row.attendance}%` },
    { header: 'Avg Marks', accessor: 'averageMarks', render: (row) => <span className="font-bold text-gray-900">{row.averageMarks}</span> },
    { 
      header: 'Pending Reviews', 
      accessor: 'pendingReviews', 
      render: (row) => (
        <Badge variant={row.pendingReviews > 0 ? 'warning' : 'success'}>
          {row.pendingReviews > 0 ? `${row.pendingReviews} Pending` : 'Completed'}
        </Badge>
      ) 
    }
  ];

  const handleExportPDF = () => {
    const headers = ['Rank', 'Team ID', 'Project', 'Guide', 'Current Reviewer', 'Progress', 'Attendance', 'Avg Marks'];
    const rows = filteredData.map(t => [
      t.rank, t.id, t.projectName, t.guideName, t.currentReviewerName, 
      `${t.progress}%`, `${t.attendance}%`, t.averageMarks
    ]);
    exportToPDF('Team_Performance_Report', 'Team Performance & Analytics Report', headers, rows, 'landscape');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Team Performance Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Performance Report</h1>
              <p className="text-sm text-gray-500">Comprehensive analytics across all capstone teams.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV('Team_Performance_Report', filteredData)}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportToExcel('Team_Performance_Report', filteredData)}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-t-0">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                className="pl-9" 
                placeholder="Search by Team ID, Project, Guide or Reviewer..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" /> Filter
            </Button>
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

export default TeamPerformanceReport;
