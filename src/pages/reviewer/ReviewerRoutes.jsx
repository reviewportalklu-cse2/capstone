import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReviewerDashboard from './ReviewerDashboard';
import ReviewerAssignedTeams from './ReviewerAssignedTeams';
import ReviewerEvaluations from './ReviewerEvaluations';
import ReviewerReports from './ReviewerReports';
import ReviewerNotifications from './ReviewerNotifications';
import ReviewerProfile from './ReviewerProfile';
import EvaluationWorkspace from '@/pages/common/evaluation/EvaluationWorkspace';

const ReviewerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/reviewer/dashboard" replace />} />
      <Route path="dashboard" element={<ReviewerDashboard />} />
      <Route path="teams" element={<ReviewerAssignedTeams />} />
      <Route path="evaluations" element={<ReviewerEvaluations />} />
      <Route path="evaluate" element={<EvaluationWorkspace />} />
      <Route path="evaluate/:teamId" element={<EvaluationWorkspace />} />
      <Route path="reports" element={<ReviewerReports />} />
      <Route path="notifications" element={<ReviewerNotifications />} />
      <Route path="profile" element={<ReviewerProfile />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/reviewer/dashboard" replace />} />
    </Routes>
  );
};

export default ReviewerRoutes;
