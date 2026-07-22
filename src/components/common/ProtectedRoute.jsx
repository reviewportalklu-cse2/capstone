import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their respective dashboard if they don't have access to this route
    const roleRoutes = {
      admin: '/admin',
      guide: '/guide',
      reviewer: '/reviewer',
      faculty: '/faculty',
      student: '/student'
    };
    return <Navigate to={roleRoutes[userRole] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
