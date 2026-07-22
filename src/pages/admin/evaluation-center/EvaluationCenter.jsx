import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { 
  Users, 
  LayoutDashboard, 
  Clock, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Download, 
  ShieldAlert 
} from 'lucide-react';

import TeamEvaluations from './TeamEvaluations';
import TeamDetails from './TeamDetails';
import StudentEvaluationDetails from './StudentEvaluationDetails';
import EvaluationDashboard from './EvaluationDashboard';
import PendingTracker from './PendingTracker';
import EvaluationAnalytics from './EvaluationAnalytics';
import EvaluationTimelineView from './EvaluationTimelineView';
import EvaluationReports from './EvaluationReports';
import EvaluationExportCenter from './EvaluationExportCenter';
import EvaluationAuditLogs from './EvaluationAuditLogs';

const tabs = [
  { name: 'Team Evaluations', href: '/admin/evaluation-center/teams', icon: Users, isDefault: true },
  { name: 'Dashboard', href: '/admin/evaluation-center/dashboard', icon: LayoutDashboard },
  { name: 'Pending Tracker', href: '/admin/evaluation-center/pending', icon: Clock },
  { name: 'Analytics', href: '/admin/evaluation-center/analytics', icon: TrendingUp },
  { name: 'Timeline', href: '/admin/evaluation-center/timeline', icon: Calendar },
  { name: 'Reports', href: '/admin/evaluation-center/reports', icon: FileText },
  { name: 'Export Center', href: '/admin/evaluation-center/export', icon: Download },
  { name: 'Audit Logs', href: '/admin/evaluation-center/audit-logs', icon: ShieldAlert }
];

const EvaluationCenter = () => {
  const location = useLocation();

  return (
    <DashboardLayout navigationItems={adminNavigation} title="KL CSE Capstone Portal - Evaluation Center">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Module Header */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-primary-50 text-primary-700 rounded-full border border-primary-100 uppercase tracking-wider">
                Master Control Center
              </span>
              <span className="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-100 uppercase tracking-wider">
                Live Sync Active
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">University Evaluation Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Single source of truth for Team & Student capstone evaluations, rubrics, weightages, and audit logs.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-xl shadow-sm px-4 pt-2">
          <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.href || (tab.isDefault && (location.pathname === '/admin/evaluation-center' || location.pathname === '/admin/evaluation-center/'));
              return (
                <NavLink
                  key={tab.name}
                  to={tab.href}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon
                    className={`mr-2.5 h-4 w-4 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sub-Route Views */}
        <div className="mt-6">
          <Routes>
            <Route path="/" element={<TeamEvaluations />} />
            <Route path="teams" element={<TeamEvaluations />} />
            <Route path="team/:teamId" element={<TeamDetails />} />
            <Route path="student/:studentId" element={<StudentEvaluationDetails />} />
            <Route path="dashboard" element={<EvaluationDashboard />} />
            <Route path="pending" element={<PendingTracker />} />
            <Route path="analytics" element={<EvaluationAnalytics />} />
            <Route path="timeline" element={<EvaluationTimelineView />} />
            <Route path="reports" element={<EvaluationReports />} />
            <Route path="export" element={<EvaluationExportCenter />} />
            <Route path="audit-logs" element={<EvaluationAuditLogs />} />
            <Route path="*" element={<Navigate to="teams" replace />} />
          </Routes>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EvaluationCenter;
