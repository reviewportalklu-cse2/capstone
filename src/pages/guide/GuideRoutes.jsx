import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GuideDashboard from './GuideDashboard';
import MyStudents from './MyStudents';
import MyProjects from './MyProjects';
import GuideMarks from './GuideMarks';
import Remarks from './Remarks';
import Meetings from './Meetings';
import ProgressTracking from './ProgressTracking';
import GuideNotifications from './GuideNotifications';
import GuideReports from './GuideReports';
import GuideDownloads from './GuideDownloads';
import GuideHelp from './GuideHelp';

const GuideRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<GuideDashboard />} />
      <Route path="students" element={<MyStudents />} />
      <Route path="projects" element={<MyProjects />} />
      <Route path="marks" element={<GuideMarks />} />
      <Route path="remarks" element={<Remarks />} />
      <Route path="meetings" element={<Meetings />} />
      <Route path="progress" element={<ProgressTracking />} />
      <Route path="notifications" element={<GuideNotifications />} />
      <Route path="reports" element={<GuideReports />} />
      <Route path="downloads" element={<GuideDownloads />} />
      <Route path="help" element={<GuideHelp />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default GuideRoutes;
