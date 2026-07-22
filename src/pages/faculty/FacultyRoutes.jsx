import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FacultyDashboard from './FacultyDashboard';
import MyStudents from './MyStudents';
import EnterMarks from './EnterMarks';
import BulkMarks from './BulkMarks';
import ViewSubmissions from './ViewSubmissions';
import StudentSearch from './StudentSearch';
import FacultyReports from './FacultyReports';
import FacultyNotifications from './FacultyNotifications';
import FacultyProfile from './FacultyProfile';

const FacultyRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<FacultyDashboard />} />
      <Route path="students" element={<MyStudents />} />
      <Route path="marks" element={<EnterMarks />} />
      <Route path="upload" element={<BulkMarks />} />
      <Route path="submissions" element={<ViewSubmissions />} />
      <Route path="search" element={<StudentSearch />} />
      <Route path="reports" element={<FacultyReports />} />
      <Route path="notifications" element={<FacultyNotifications />} />
      <Route path="profile" element={<FacultyProfile />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default FacultyRoutes;
