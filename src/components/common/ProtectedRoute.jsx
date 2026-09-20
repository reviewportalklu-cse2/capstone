import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, activeRole, userRole, availableRoles = [], switchRole, mfaRequired, mfaVerified, requiresPasswordChange, loading } = useAuth();
  const currentRole = activeRole || userRole;

  const matchingRole = React.useMemo(() => {
    if (!allowedRoles || allowedRoles.includes(currentRole)) return null;
    return allowedRoles.find(r => availableRoles.includes(r)) || null;
  }, [allowedRoles, currentRole, availableRoles]);

  React.useEffect(() => {
    if (matchingRole && typeof switchRole === 'function') {
      switchRole(matchingRole).catch(console.error);
    }
  }, [matchingRole, switchRole]);

  if (loading || matchingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordChange === true) {
    return <Navigate to="/first-login-password-change" replace />;
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
