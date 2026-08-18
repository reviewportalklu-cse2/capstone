import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useReviewerAnalytics } from '@/hooks/useReviewerAnalytics';
import { exportToCsv } from '@/utils/csvExport';
import { Loader2, FileBarChart, Download, FileSpreadsheet, Users, Activity, Target, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ReviewerReports = () => {
  const { reviewer, dashboardStats, getAssignedTeams, getReviewHistory, dataLoading } = useReviewerAnalytics();
  const activeTeams = getAssignedTeams();
  const historyTeams = getReviewHistory();

  // Marks Distribution Data for Charts
  const marksDistribution = useMemo(() => {
    const bins = { '90-100 (O)': 0, '80-89 (A+)': 0, '70-79 (A)': 0, '60-69 (B+)': 0, 'Below 60 (Pass/Fail)': 0 };
    historyTeams.forEach(t => {
      const score = t.totalScore || 0;
      if (score >= 90) bins['90-100 (O)']++;
      else if (score >= 80) bins['80-89 (A+)']++;
      else if (score >= 70) bins['70-79 (A)']++;
      else if (score >= 60) bins['60-69 (B+)']++;
      else bins['Below 60 (Pass/Fail)']++;
    });
    return Object.keys(bins).map(key => ({ grade: key, count: bins[key] }));
  }, [historyTeams]);

  // Status breakdown data
  const statusBreakdown = useMemo(() => {
    const map = { Pending: 0, Draft: 0, Locked: 0, Published: 0 };
    activeTeams.forEach(t => {
      const status = t.evaluationStatus || 'Pending';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.keys(map).map(status => ({ status, count: map[status] }));
  }, [activeTeams]);

  const handleExportCsv = () => {
    const exportData = activeTeams.map(t => ({
      'Team ID': t.id,
      'Project Title': t.project?.title || 'N/A',
      'Domain': t.project?.domain || 'N/A',
      'Cycle': t.reviewCycleName,
      'Evaluation Status': t.evaluationStatus,
      'Reviewer': reviewer?.name || 'Reviewer'
    }));

    exportToCsv(`Reviewer_Assigned_Teams_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const handleExportPdf = () => {
    alert("Exporting PDF Summary Report...");
    handleExportCsv();
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="Evaluation Reports">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="Evaluation Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> Reviewer Analytics & Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Exportable summaries of evaluation completion rates, marks distribution, and student progress.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportPdf} className="flex items-center gap-2 bg-white">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={handleExportCsv} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export CSV / Excel
            </Button>
          </div>
        </div>

        {!dashboardStats || dashboardStats.activeAssignedTeams === 0 ? (
          <Card>
            <div className="py-12">
              <EmptyState
                icon={FileBarChart}
                title="No Evaluation Data Available"
                description="Assigned teams and historical evaluation reports will appear here once assigned."
              />
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                title="Assigned Teams (Active)" 
                value={dashboardStats.activeAssignedTeams.toString()} 
                icon={Users} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-50" 
              />
              <StatCard 
                title="Historical Teams (Past)" 
                value={dashboardStats.historicalTeams.toString()} 
                icon={Target} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-50" 
              />
              <StatCard 
                title="Total Locked Evaluations" 
                value={dashboardStats.lockedEvaluations.toString()} 
                icon={Activity} 
                colorClass="text-emerald-600" 
                bgClass="bg-emerald-50" 
              />
              <StatCard 
                title="Average Marks Awarded" 
                value={`${dashboardStats.averageMarksAwarded} / 100`} 
                icon={CheckCircle2} 
                colorClass="text-amber-600" 
                bgClass="bg-amber-50" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Marks Distribution Bar Chart */}
              <Card title="Marks Distribution Breakdown">
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marksDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Evaluation Status Breakdown */}
              <Card title="Active Cycle Evaluation Status">
                <div className="space-y-4 mt-4">
                  {activeTeams.map((t) => (
                    <div key={t.id} className="p-3 border rounded-lg bg-gray-50/50">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-bold text-gray-800">{t.id} - {t.project?.title || 'Capstone Team'}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          t.evaluationStatus === 'Locked' || t.evaluationStatus === 'Published' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.evaluationStatus}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${t.evaluationStatus === 'Locked' || t.evaluationStatus === 'Published' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: t.evaluationStatus === 'Locked' || t.evaluationStatus === 'Published' ? '100%' : '40%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Performance Summary Card */}
            <Card title="Reviewer Summary & Insights">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary-50/30 border border-primary-100 rounded-xl text-sm">
                <div>
                  <p className="font-bold text-gray-900">Workload Index</p>
                  <p className="text-gray-600 mt-1">Evaluating {dashboardStats.activeAssignedTeams} active capstone teams in review cycle '{dashboardStats.activeCycle}'.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Completion Velocity</p>
                  <p className="text-gray-600 mt-1">{dashboardStats.lockedEvaluations} locked evaluations archived across all review cycles.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Scoring Quality Index</p>
                  <p className="text-gray-600 mt-1">Average score awarded across submitted evaluations is {dashboardStats.averageMarksAwarded}/100.</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewerReports;
