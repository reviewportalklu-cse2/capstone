import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart2, Download } from 'lucide-react';
import { exportToPDF } from '@/utils/ReportExporter';
import { TrendAreaChart } from '@/components/common/AnalyticsCharts';

const EvaluationAnalytics = () => {
  const navigationItems = useAdminNavigation();
  const { evaluationAnalytics, dataLoading } = useAnalytics();

  const columns = [
    { header: 'Review Cycle', accessor: 'cycleName', render: (row) => <span className="font-bold text-gray-900">{row.cycleName}</span> },
    { header: 'Total Evaluations', accessor: 'totalEvaluations' },
    { header: 'Average Score', accessor: 'averageScore', render: (row) => <span className="font-bold text-primary-600">{row.averageScore}</span> },
  ];

  const chartData = evaluationAnalytics.map(c => ({
    name: c.cycleName,
    Evaluations: c.totalEvaluations
  }));

  const handleExport = () => {
    const headers = ['Review Cycle', 'Total Evaluations', 'Average Score'];
    const rows = evaluationAnalytics.map(d => [d.cycleName, d.totalEvaluations, d.averageScore]);
    exportToPDF('Evaluation_Analytics', 'Evaluation Cycle Analytics', headers, rows, 'portrait');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Evaluation Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluation Analytics</h1>
              <p className="text-sm text-gray-500">Track assessment completion and score trends across cycles.</p>
            </div>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Evaluations Completed by Cycle" className="h-[350px]">
            {dataLoading ? (
               <div className="flex justify-center items-center h-full">
                 <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
               </div>
            ) : (
               <TrendAreaChart data={chartData} dataKey="Evaluations" name="Total Evaluations" color="#4f46e5" />
            )}
          </Card>
          
          <Card className="p-0 overflow-hidden" title="Cycle Summary">
            {dataLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table columns={columns} data={evaluationAnalytics} />
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EvaluationAnalytics;
