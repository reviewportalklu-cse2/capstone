import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import KpiCard from '@/components/common/KpiCard';
import Card from '@/components/common/Card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Users, ShieldCheck, CheckCircle, Clock, BookOpen, UserCog, UserCheck, Activity, Target, BarChart2 } from 'lucide-react';
import { MarksDistributionChart, TrendAreaChart } from '@/components/common/AnalyticsCharts';
import Button from '@/components/common/Button';
import { exportToPDF } from '@/utils/ReportExporter';
import { Download } from 'lucide-react';

const EnterpriseDashboard = () => {
  const navigationItems = useAdminNavigation();
  const { executiveAnalytics, teamAnalytics, evaluationAnalytics, dataLoading } = useAnalytics();

  if (dataLoading || !executiveAnalytics) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Enterprise Analytics Dashboard">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const marksDist = [
    { range: '< 50', count: teamAnalytics.filter(t => t.averageMarks < 50).length },
    { range: '50-69', count: teamAnalytics.filter(t => t.averageMarks >= 50 && t.averageMarks < 70).length },
    { range: '70-84', count: teamAnalytics.filter(t => t.averageMarks >= 70 && t.averageMarks < 85).length },
    { range: '85-100', count: teamAnalytics.filter(t => t.averageMarks >= 85).length },
  ];

  const trendData = evaluationAnalytics.map(c => ({
    name: c.cycleName,
    Average: c.averageScore
  }));

  const handleExport = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Students', executiveAnalytics.totalStudents],
      ['Total Teams', executiveAnalytics.totalTeams],
      ['Active Projects', executiveAnalytics.activeProjects],
      ['Guides', executiveAnalytics.activeGuides],
      ['Faculty', executiveAnalytics.activeFaculty],
      ['Reviewers', executiveAnalytics.activeReviewers],
      ['Active Review Cycle', executiveAnalytics.activeCycle],
      ['Completed Reviews', executiveAnalytics.completedReviews],
      ['Pending Reviews', executiveAnalytics.pendingReviews],
      ['Pending Evaluations', executiveAnalytics.pendingEvaluations],
      ['Attendance %', executiveAnalytics.attendancePercentage + '%'],
      ['Overall Average', executiveAnalytics.overallAverage],
      ['Highest Score', executiveAnalytics.highestScore],
      ['Lowest Score', executiveAnalytics.lowestScore],
    ];

    exportToPDF('Enterprise_Analytics_Dashboard', 'Enterprise Analytics Executive Summary', headers, rows, 'portrait');
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Enterprise Analytics Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-primary-900 to-primary-700 p-6 rounded-xl shadow-lg text-white gap-4">
          <div>
            <h1 className="text-3xl font-bold">Executive Analytics Dashboard</h1>
            <p className="text-primary-100 mt-1 text-lg">Realtime insights and academic performance KPIs.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Top KPIs - Academic Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Students" value={executiveAnalytics.totalStudents} icon={Users} color="primary" />
          <KpiCard title="Total Teams" value={executiveAnalytics.totalTeams} icon={ShieldCheck} color="purple" />
          <KpiCard title="Active Projects" value={executiveAnalytics.activeProjects} icon={BookOpen} color="info" />
          <KpiCard title="Overall Attendance" value={`${executiveAnalytics.attendancePercentage}%`} icon={Activity} color={executiveAnalytics.attendancePercentage >= 75 ? 'success' : 'warning'} />
        </div>

        {/* Middle KPIs - Staff */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="Active Guides" value={executiveAnalytics.activeGuides} icon={UserCheck} color="success" />
          <KpiCard title="Active Faculty" value={executiveAnalytics.activeFaculty} icon={Users} color="success" />
          <KpiCard title="Active Reviewers" value={executiveAnalytics.activeReviewers} icon={UserCog} color="success" />
        </div>

        {/* Lower KPIs - Evaluations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Active Review Cycle" 
            value={executiveAnalytics.activeCycle} 
            icon={Target} 
            color={executiveAnalytics.activeCycle !== 'None' ? 'primary' : 'warning'} 
          />
          <KpiCard title="Completed Reviews" value={executiveAnalytics.completedReviews} icon={CheckCircle} color="success" />
          <KpiCard title="Pending Reviews" value={executiveAnalytics.pendingReviews} icon={Clock} color="warning" />
          <KpiCard title="Overall Average Marks" value={executiveAnalytics.overallAverage} icon={BarChart2} color="primary" subtitle={`Highest: ${executiveAnalytics.highestScore} | Lowest: ${executiveAnalytics.lowestScore}`} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Marks Distribution (Teams)" className="h-[350px]">
            <MarksDistributionChart data={marksDist} />
          </Card>
          
          <Card title="Average Score Trend by Review Cycle" className="h-[350px]">
            <TrendAreaChart data={trendData} dataKey="Average" name="Average Marks" color="#10b981" />
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
