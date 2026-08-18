import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import EnterpriseDashboard from './EnterpriseDashboard';
import TeamPerformanceReport from './TeamPerformanceReport';
import StudentPerformanceReport from './StudentPerformanceReport';
import StaffPerformanceReports from './StaffPerformanceReports';
import DepartmentAnalytics from './DepartmentAnalytics';
import EvaluationAnalytics from './EvaluationAnalytics';
import { LayoutDashboard, Users, ShieldCheck, UserCheck, Layers, BarChart2 } from 'lucide-react';

const ReportsIndex = () => {
  const navigationItems = useAdminNavigation();
  const navigate = useNavigate();

  const reportModules = [
    { title: 'Executive Dashboard', description: 'High-level academic KPIs and realtime analytics.', icon: LayoutDashboard, path: 'executive', color: 'text-primary-600', bg: 'bg-primary-50' },
    { title: 'Team Performance', description: 'Analyze marks, attendance, and progress per team.', icon: ShieldCheck, path: 'teams', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Student Analytics', description: 'Deep dive into individual student metrics.', icon: Users, path: 'students', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Staff Workload', description: 'Performance and assignment metrics for Guides, Faculty, and Reviewers.', icon: UserCheck, path: 'staff', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Department Analytics', description: 'Cross-department comparison and statistics.', icon: Layers, path: 'department', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Evaluation Analytics', description: 'Assessment completion and scoring trends.', icon: BarChart2, path: 'evaluations', color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <DashboardLayout navigationItems={navigationItems} title="Enterprise Reports Hub">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-xl shadow-lg text-white">
          <h1 className="text-3xl font-bold mb-2">Enterprise Reports Hub</h1>
          <p className="text-gray-300 text-lg">Centralized access to all academic analytics, performance insights, and custom exports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {reportModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <button key={idx} onClick={() => navigate(mod.path)} className="text-left group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl">
                <Card className="h-full hover:shadow-md transition-all border-gray-200 group-hover:border-primary-300">
                  <div className={`p-3 inline-block rounded-lg ${mod.bg} ${mod.color} mb-4`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{mod.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{mod.description}</p>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

const ReportsHub = () => {
  return (
    <Routes>
      <Route path="/" element={<ReportsIndex />} />
      <Route path="executive" element={<EnterpriseDashboard />} />
      <Route path="teams" element={<TeamPerformanceReport />} />
      <Route path="students" element={<StudentPerformanceReport />} />
      <Route path="staff" element={<StaffPerformanceReports />} />
      <Route path="department" element={<DepartmentAnalytics />} />
      <Route path="evaluations" element={<EvaluationAnalytics />} />
    </Routes>
  );
};

export default ReportsHub;
