import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, activeRole, userRole, mfaRequired, mfaVerified, loading } = useAuth();
  const currentRole = activeRole || userRole;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Enforce MFA verification before granting portal access
  if (mfaRequired && !mfaVerified) {
    return <Navigate to="/mfa-verification" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    const roleRoutes = {
      admin: '/admin',
      guide: '/guide',
      reviewer: '/reviewer',
      classroom_faculty: '/faculty',
      faculty: '/faculty',
      student: '/student'
    };
    return <Navigate to={roleRoutes[currentRole] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
