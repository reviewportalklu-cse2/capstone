import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from './AdminDashboard';
import StudentManagement from './StudentManagement';
import GuideManagement from './GuideManagement';
import ReviewerManagement from './ReviewerManagement';
import FacultyManagement from './FacultyManagement';
import SubmissionsManagement from './SubmissionsManagement';
import ProjectManagement from './ProjectManagement';
import TeamManagement from './team-management/TeamManagement';
import TeamDetails from './team-management/TeamDetails';
import CsvSync from './CsvSync';
import ReportsHub from './reports/ReportsHub';
import AdminNotificationCenter from './AdminNotificationCenter';
import AdminSettings from './AdminSettings';
import SecuritySettings from './security/SecuritySettings';
import BackupRestore from './BackupRestore';

import EvaluationCenter from './evaluation-center/EvaluationCenter';
import SemesterResults from './results/SemesterResults';
import RubricsManagement from './rubrics/RubricsManagement';
import RubricBuilder from './rubrics/RubricBuilder';
import ReviewCycles from './reviewer-rotation/ReviewCycles';
import ReviewerAssignmentImport from './reviewer-rotation/ReviewerAssignmentImport';

const AdminRoutes = () => {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* User Management */}
        <Route path="students" element={<StudentManagement />} />
        <Route path="guides" element={<GuideManagement />} />
        <Route path="reviewers" element={<ReviewerManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="classroom-faculty" element={<FacultyManagement />} />
        
        {/* Core Operations */}
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="teams" element={<TeamManagement />} />
        <Route path="teams/:teamId" element={<TeamDetails />} />
        <Route path="groups" element={<TeamManagement />} />
        <Route path="groups/:teamId" element={<TeamDetails />} />
        <Route path="submissions" element={<SubmissionsManagement />} />
        
        {/* Academic Settings */}
        <Route path="rubrics" element={<RubricsManagement />} />
        <Route path="rubrics/build/:id?" element={<RubricBuilder />} />
        <Route path="rubrics/builder/:id?" element={<RubricBuilder />} />
        <Route path="rubrics/build/:rubricId?" element={<RubricBuilder />} />
        <Route path="rubrics/builder/:rubricId?" element={<RubricBuilder />} />
        <Route path="review-cycles" element={<ReviewCycles />} />
        <Route path="reviewer-assignments" element={<ReviewerAssignmentImport />} />
        
        {/* Evaluation & Results */}
        <Route path="evaluation-center/*" element={<EvaluationCenter />} />
        <Route path="semester-results" element={<SemesterResults />} />
        
        {/* System & Utilities */}
        <Route path="sync" element={<CsvSync />} />
        <Route path="reports/*" element={<ReportsHub />} />
        <Route path="notifications" element={<AdminNotificationCenter />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="backup" element={<BackupRestore />} />
        
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
