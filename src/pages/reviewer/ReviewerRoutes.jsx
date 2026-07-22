import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReviewerDashboard from './ReviewerDashboard';
import MyBatches from './MyBatches';
import AssignedStudents from './AssignedStudents';
import ReviewPage from './ReviewPage'; // We will use a unified ReviewPage and pass the review type
import ViewSubmissions from './ViewSubmissions';
import BulkUploadMarks from './BulkUploadMarks';
import ReviewerReports from './ReviewerReports';
import ExportData from './ExportData';
import ReviewerProfile from './ReviewerProfile';
import ReviewerHelp from './ReviewerHelp';

const ReviewerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ReviewerDashboard />} />
      <Route path="batches" element={<MyBatches />} />
      <Route path="students" element={<AssignedStudents />} />
      
      {/* Review workflows */}
      <Route path="review1" element={<ReviewPage reviewType="Review 1" />} />
      <Route path="review2" element={<ReviewPage reviewType="Review 2" />} />
      <Route path="review3" element={<ReviewPage reviewType="Review 3" />} />
      
      <Route path="submissions" element={<ViewSubmissions />} />
      <Route path="upload-marks" element={<BulkUploadMarks />} />
      <Route path="reports" element={<ReviewerReports />} />
      <Route path="export" element={<ExportData />} />
      <Route path="profile" element={<ReviewerProfile />} />
      <Route path="help" element={<ReviewerHelp />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default ReviewerRoutes;
