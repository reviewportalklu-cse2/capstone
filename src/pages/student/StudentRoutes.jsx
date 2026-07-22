import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import MyProfile from './MyProfile';
import MyProject from './MyProject';
import MyGuide from './MyGuide';
import MyMarks from './MyMarks';
import ReviewRemarks from './ReviewRemarks';
import ProgressStatus from './ProgressStatus';
import StudentDownloads from './StudentDownloads';
import StudentNotifications from './StudentNotifications';
import StudentHelp from './StudentHelp';

const StudentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="profile" element={<MyProfile />} />
      <Route path="project" element={<MyProject />} />
      <Route path="guide" element={<MyGuide />} />
      <Route path="marks" element={<MyMarks />} />
      <Route path="remarks" element={<ReviewRemarks />} />
      <Route path="progress" element={<ProgressStatus />} />
      <Route path="downloads" element={<StudentDownloads />} />
      <Route path="notifications" element={<StudentNotifications />} />
      <Route path="help" element={<StudentHelp />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default StudentRoutes;
