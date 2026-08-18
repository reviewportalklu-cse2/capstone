import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GuideDashboard from './GuideDashboard';
import TeamSupervision from './TeamSupervision';
import GuideMarks from './GuideMarks';
import Remarks from './Remarks';
import Meetings from './Meetings';
import ProgressTracking from './ProgressTracking';
import GuideNotifications from './GuideNotifications';
import GuideReports from './GuideReports';
import GuideDownloads from './GuideDownloads';
import GuideHelp from './GuideHelp';
import GuideProfile from './GuideProfile';
import EvaluationWorkspace from '@/pages/common/evaluation/EvaluationWorkspace';

const GuideRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/guide/dashboard" replace />} />
      <Route path="dashboard" element={<GuideDashboard />} />
      <Route path="teams" element={<TeamSupervision />} />
      <Route path="marks" element={<GuideMarks />} />
      <Route path="evaluate" element={<EvaluationWorkspace />} />
      <Route path="evaluate/:teamId" element={<EvaluationWorkspace />} />
      <Route path="remarks" element={<Remarks />} />
      <Route path="meetings" element={<Meetings />} />
      <Route path="progress" element={<ProgressTracking />} />
      <Route path="notifications" element={<GuideNotifications />} />
      <Route path="reports" element={<GuideReports />} />
      <Route path="downloads" element={<GuideDownloads />} />
      <Route path="help" element={<GuideHelp />} />
      <Route path="profile" element={<GuideProfile />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/guide/dashboard" replace />} />
    </Routes>
  );
};

export default GuideRoutes;
