import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useFacultyAnalytics } from '@/hooks/useFacultyAnalytics';
import { Loader2, FileBarChart, Download, FileSpreadsheet, Users, Activity, Target, CheckCircle2 } from 'lucide-react';

const FacultyReports = () => {
  const { dashboardStats, getAssignedTeams, dataLoading } = useFacultyAnalytics();
  const teams = getAssignedTeams();

  const simulateExport = (type) => {
    alert(`Generating ${type} report... (Simulated)`);
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="Evaluation Reports">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const completedProjects = teams.filter(t => t.project?.status === 'Completed').length;

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="Evaluation Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> Analytics & Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Exportable summaries of team progress and faculty performance.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => simulateExport('PDF')} className="flex items-center gap-2 bg-white">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={() => simulateExport('Excel')} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </Button>
          </div>
        </div>

        {!dashboardStats || dashboardStats.totalTeams === 0 ? (
          <Card>
            <div className="py-12">
              <EmptyState
                icon={FileBarChart}
                title="No Data Available"
                description="You do not have any assigned teams to generate reports for."
              />
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                title="Total Teams" 
                value={dashboardStats.totalTeams.toString()} 
                icon={Users} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-50" 
              />
              <StatCard 
                title="Total Students" 
                value={dashboardStats.totalStudents.toString()} 
                icon={Target} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-50" 
              />
              <StatCard 
                title="Completed Projects" 
                value={completedProjects.toString()} 
                icon={Activity} 
                colorClass="text-success" 
                bgClass="bg-success/10" 
              />
              <StatCard 
                title="Overall Attendance" 
                value={`${dashboardStats.overallAttendance}%`} 
                icon={CheckCircle2} 
                colorClass="text-emerald-600" 
                bgClass="bg-emerald-50" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Team Progress Distribution">
                <div className="space-y-4 mt-4">
                  {teams.map((t) => (
                    <div key={t.id}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-gray-700">{t.id} - {t.project?.title || 'Unknown'}</span>
                        <span className="font-semibold">{t.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${t.progressPercent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Faculty Performance Summary">
                <div className="flex flex-col justify-center h-full space-y-4 p-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg">
                  <p><strong>Faculty Load:</strong> Overseeing {dashboardStats.totalStudents} students across {dashboardStats.totalTeams} independent teams.</p>
                  <p><strong>Review Velocity:</strong> {dashboardStats.completedEvaluations} completed evaluations across all active and past review cycles.</p>
                  <p><strong>Success Rate:</strong> {((completedProjects/dashboardStats.totalTeams)*100).toFixed(1)}% of assigned teams have reached completion.</p>
                  <p><strong>Quality Index:</strong> The average score across all your team evaluations is {dashboardStats.averageTeamScore}/100.</p>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyReports;
