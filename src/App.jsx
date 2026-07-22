import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import AdminRoutes from '@/pages/admin/AdminRoutes';
import GuideRoutes from '@/pages/guide/GuideRoutes';
import ReviewerRoutes from '@/pages/reviewer/ReviewerRoutes';
import FacultyRoutes from '@/pages/faculty/FacultyRoutes';
import StudentRoutes from '@/pages/student/StudentRoutes';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const RootRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  const roleRoutes = {
    admin: '/admin',
    guide: '/guide',
    reviewer: '/reviewer',
    faculty: '/faculty',
    student: '/student'
  };
  
  return <Navigate to={roleRoutes[userRole] || '/login'} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRoutes />
          </ProtectedRoute>
        } />

        <Route path="/guide/*" element={
          <ProtectedRoute allowedRoles={['guide']}>
            <GuideRoutes />
          </ProtectedRoute>
        } />
        
        <Route path="/reviewer/*" element={
          <ProtectedRoute allowedRoles={['reviewer']}>
            <ReviewerRoutes />
          </ProtectedRoute>
        } />
        
        <Route path="/faculty/*" element={
          <ProtectedRoute allowedRoles={['classroom_faculty']}>
            <FacultyRoutes />
          </ProtectedRoute>
        } />
        
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentRoutes />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
