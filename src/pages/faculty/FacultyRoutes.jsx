import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FacultyDashboard from './FacultyDashboard';
import FacultyTeamTracking from './FacultyTeamTracking';
import FacultyEvaluations from './FacultyEvaluations';
import FacultyReports from './FacultyReports';
import FacultyNotifications from './FacultyNotifications';
import FacultyProfile from './FacultyProfile';
import EvaluationWorkspace from '@/pages/common/evaluation/EvaluationWorkspace';

const FacultyRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/faculty/dashboard" replace />} />
      <Route path="dashboard" element={<FacultyDashboard />} />
      <Route path="teams" element={<FacultyTeamTracking />} />
      <Route path="evaluations" element={<FacultyEvaluations />} />
      <Route path="evaluate" element={<EvaluationWorkspace />} />
      <Route path="evaluate/:teamId" element={<EvaluationWorkspace />} />
      <Route path="reports" element={<FacultyReports />} />
      <Route path="notifications" element={<FacultyNotifications />} />
      <Route path="profile" element={<FacultyProfile />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/faculty/dashboard" replace />} />
    </Routes>
  );
};

export default FacultyRoutes;
