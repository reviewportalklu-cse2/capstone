import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminStatsProvider } from '@/contexts/AdminStatsContext';
import AdminDashboard from './AdminDashboard';
import StudentManagement from './StudentManagement';
import GuideManagement from './GuideManagement';
import ReviewerManagement from './ReviewerManagement';
import FacultyManagement from './FacultyManagement';
import SubmissionsManagement from './SubmissionsManagement';
import CsvSync from './CsvSync';
import AdminReports from './AdminReports';
import AdminNotifications from './AdminNotifications';
import AdminSettings from './AdminSettings';
import BackupRestore from './BackupRestore';

import EvaluationCenter from './evaluation-center/EvaluationCenter';

const AdminRoutes = () => {
  return (
    <AdminStatsProvider>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="guides" element={<GuideManagement />} />
        <Route path="reviewers" element={<ReviewerManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="submissions" element={<SubmissionsManagement />} />
        <Route path="evaluation-center/*" element={<EvaluationCenter />} />
        <Route path="sync" element={<CsvSync />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="backup" element={<BackupRestore />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminStatsProvider>
  );
};

export default AdminRoutes;
