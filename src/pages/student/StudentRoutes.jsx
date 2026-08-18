import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import MyProfile from './MyProfile';
import MyEvaluations from './MyEvaluations';
import EvaluationDetails from './EvaluationDetails';
import AcademicTimeline from './AcademicTimeline';
import ProgressTracker from './ProgressTracker';
import MyAttendance from './MyAttendance';
import ReviewerHistory from './ReviewerHistory';
import StudentDownloads from './StudentDownloads';
import StudentNotifications from './StudentNotifications';
import FinalResult from './FinalResult';

const StudentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="profile" element={<MyProfile />} />
      <Route path="progress" element={<ProgressTracker />} />
      <Route path="evaluations" element={<MyEvaluations />} />
      <Route path="evaluations/:id" element={<EvaluationDetails />} />
      <Route path="attendance" element={<MyAttendance />} />
      <Route path="reviewers" element={<ReviewerHistory />} />
      <Route path="timeline" element={<AcademicTimeline />} />
      <Route path="downloads" element={<StudentDownloads />} />
      <Route path="notifications" element={<StudentNotifications />} />
      <Route path="result" element={<FinalResult />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
    </Routes>
  );
};

export default StudentRoutes;
