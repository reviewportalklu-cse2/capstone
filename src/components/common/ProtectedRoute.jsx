import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, IS_MFA_ENFORCEMENT_ENABLED } from '@/contexts/AuthContext';
import MandatoryMfaEnrollmentModal from '@/components/auth/MandatoryMfaEnrollmentModal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { 
    currentUser, 
    activeRole, 
    userRole, 
    availableRoles = [], 
    switchRole, 
    requiresPasswordChange, 
    mfaEnrollmentRequired, 
    completeMfaEnrollment, 
    loading 
  } = useAuth();
  
  const currentRole = activeRole || userRole;
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresPasswordChange === true) {
    return <Navigate to="/first-login-password-change" replace />;
  }

  // Mandatory MFA Enrollment Enforcement (TEMPORARILY DISABLED FOR PRODUCTION)
  // Students are exempt. Admin, Guide, Faculty, Classroom Faculty, Reviewer require MFA when enabled.
  // Gated behind IS_MFA_ENFORCEMENT_ENABLED so no modal or redirect blocks production users.
  if (IS_MFA_ENFORCEMENT_ENABLED && mfaEnrollmentRequired) {
    return (
      <div className="min-h-screen relative bg-slate-900 flex items-center justify-center p-4">
        <MandatoryMfaEnrollmentModal onSuccess={completeMfaEnrollment} />
      </div>
    );
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
