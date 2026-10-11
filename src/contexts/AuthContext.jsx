import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/firebase/services/authService';
import { userService } from '@/firebase/services/userService';
import { userRoleService } from '@/firebase/services/userRoleService';
import { userResolver } from '@/firebase/services/userResolver';
import { auditService } from '@/firebase/services/auditService';
import { totpMfaService } from '@/firebase/services/totpMfaService';
import { FirestoreService } from '@/firebase/services/firestore';
import Logo from '@/components/common/Logo';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

const STORAGE_KEY_ACTIVE_ROLE = 'capstone-active-role';

/**
 * MFA FEATURE TOGGLE
 * Set to false temporarily for production because Firebase project has MFA globally disabled
 * and Authentication is not yet upgraded to Identity Platform (preventing auth/operation-not-allowed).
 * When Identity Platform and TOTP MFA are enabled in Firebase Console, set this flag back to true.
 */
export const IS_MFA_ENFORCEMENT_ENABLED = false;

const ROLE_PATH_MAP = {
  admin: '/admin/dashboard',
  guide: '/guide/dashboard',
  classroom_faculty: '/faculty/dashboard',
  faculty: '/faculty/dashboard',
  reviewer: '/reviewer/dashboard',
  student: '/student/dashboard'
};

const isStudentRole = (role) => {
  if (!role) return false;
  return String(role).toLowerCase().trim() === 'student';
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [activeRole, setActiveRoleState] = useState(null);
  const [domainUser, setDomainUser] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  
  // Native Firebase MFA states (Preserved for when IS_MFA_ENFORCEMENT_ENABLED is restored)
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(false);
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (user) => {
      console.log("[AUTH_RUNTIME] Auth state changed:", user?.email || "UNAUTHENTICATED");
      if (user) {
        setLoading(true);
        try {
          // 1. Fetch available roles & password change requirement from userRoleService
          const { availableRoles: roles, defaultRole, requiresPasswordChange: reqPass } = await userRoleService.getUserRoles(user.uid, user.email);
          setRequiresPasswordChange(reqPass === true);
          
          let finalRoles = roles;
          if (finalRoles.length === 0 || (finalRoles.length === 1 && finalRoles[0] === 'student')) {
            const singleRole = await userService.getUserRole(user.uid);
            if (singleRole && !finalRoles.includes(singleRole)) {
              finalRoles = [singleRole, ...finalRoles];
            }
          }

          setAvailableRoles(finalRoles);

          // 2. Resolve active role from localStorage or default
          const storedRole = localStorage.getItem(STORAGE_KEY_ACTIVE_ROLE);
          let initialRole = defaultRole;
          if (storedRole && finalRoles.includes(storedRole)) {
            initialRole = storedRole;
          } else if (finalRoles.length > 0) {
            initialRole = finalRoles[0];
          }

          setActiveRoleState(initialRole);
          localStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, initialRole);

          // 3. Resolve domain user for active role
          if (initialRole) {
            const resolvedUser = await userResolver.resolveCurrentUser(user, initialRole);
            setDomainUser(resolvedUser);
          } else {
            setDomainUser(null);
          }

          // 4. Evaluate Native MFA Requirement for Non-Student Users (DISABLED FOR PRODUCTION)
          // Students are exempt. When re-enabled, Admin, Guide, Faculty, Classroom Faculty, Reviewer require MFA.
          const enrolled = IS_MFA_ENFORCEMENT_ENABLED ? totpMfaService.isMfaEnrolled(user) : false;
          setIsMfaEnrolled(enrolled);

          const isSolelyStudent = finalRoles.length > 0 
            ? finalRoles.every(r => isStudentRole(r)) 
            : isStudentRole(initialRole);

          const needsMfa = IS_MFA_ENFORCEMENT_ENABLED && !isSolelyStudent && !enrolled;
          setMfaEnrollmentRequired(needsMfa);

          setCurrentUser(user);
          console.log("[AUTH_RUNTIME] Auth resolved:", user.email, "| Role:", initialRole, "| MFA Enrolled:", enrolled, "| MFA Required:", needsMfa, "| MFA Enforcement Active:", IS_MFA_ENFORCEMENT_ENABLED);
        } catch (error) {
          console.error("[AUTH_RUNTIME] Error resolving auth state:", error);
          setCurrentUser(user);
          setAvailableRoles(['student']);
          setActiveRoleState('student');
          setDomainUser(null);
          setRequiresPasswordChange(false);
          setIsMfaEnrolled(false);
          setMfaEnrollmentRequired(false);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setAvailableRoles([]);
        setActiveRoleState(null);
        setDomainUser(null);
        setRequiresPasswordChange(false);
        setIsMfaEnrolled(false);
        setMfaEnrollmentRequired(false);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
        setLoading(false);
        console.log("[AUTH_RUNTIME] Auth state reset to UNAUTHENTICATED.");
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Switch active operational role
   */
  const switchRole = useCallback(async (newRole) => {
    if (!currentUser) return null;
    
    if (!availableRoles.includes(newRole)) {
      try {
        await FirestoreService.create('auditLogs', {
          user: currentUser.uid,
          email: currentUser.email,
          action: 'UNAUTHORIZED_ROLE_SWITCH_ATTEMPT',
          attemptedRole: newRole,
          availableRoles,
          timestamp: new Date().toISOString(),
          status: 'BLOCKED'
        });
      } catch (e) {
        console.error("Audit log error:", e);
      }
      throw new Error(`Unauthorized role access attempt: ${newRole}`);
    }

    setLoading(true);
    try {
      const prevRole = activeRole;
      setActiveRoleState(newRole);
      localStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, newRole);

      // Re-resolve domain user for new role
      const resolvedUser = await userResolver.resolveCurrentUser(currentUser, newRole);
      setDomainUser(resolvedUser);

      // MFA applies to the USER ACCOUNT, not each role separately.
      // Re-evaluate MFA requirement without forcing multiple enrollments (DISABLED FOR PRODUCTION)
      const enrolled = IS_MFA_ENFORCEMENT_ENABLED ? totpMfaService.isMfaEnrolled(currentUser) : false;
      setIsMfaEnrolled(enrolled);
      const isSolelyStudent = availableRoles.every(r => isStudentRole(r));
      const needsMfa = IS_MFA_ENFORCEMENT_ENABLED && !isSolelyStudent && !enrolled;
      setMfaEnrollmentRequired(needsMfa);

      // Log successful role switch in audit log
      try {
        await FirestoreService.create('auditLogs', {
          user: currentUser.uid,
          email: currentUser.email,
          action: 'ROLE_SWITCH',
          previousRole: prevRole,
          newRole,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS'
        });
      } catch (e) {
        console.error("Audit log error:", e);
      }

      setLoading(false);
      return ROLE_PATH_MAP[newRole] || '/login';
    } catch (err) {
      console.error(`Error switching role to ${newRole}:`, err);
      setLoading(false);
      throw err;
    }
  }, [currentUser, activeRole, availableRoles]);

  const isRoleAvailable = useCallback((role) => {
    return availableRoles.includes(role);
  }, [availableRoles]);

  /**
   * Complete MFA enrollment in state
   */
  const completeMfaEnrollment = useCallback(() => {
    setIsMfaEnrolled(true);
    setMfaEnrollmentRequired(false);
  }, []);

  /**
   * Refresh native MFA status from Firebase User
   */
  const refreshMfaStatus = useCallback(async () => {
    if (!currentUser) return false;
    try {
      await currentUser.reload();
    } catch (e) {
      console.warn("[AUTH_RUNTIME] Reload notice:", e);
    }
    const enrolled = IS_MFA_ENFORCEMENT_ENABLED ? totpMfaService.isMfaEnrolled(currentUser) : false;
    setIsMfaEnrolled(enrolled);
    const isSolelyStudent = availableRoles.length > 0 
      ? availableRoles.every(r => isStudentRole(r)) 
      : isStudentRole(activeRole);
    const needsMfa = IS_MFA_ENFORCEMENT_ENABLED && !isSolelyStudent && !enrolled;
    setMfaEnrollmentRequired(needsMfa);
    return enrolled;
  }, [currentUser, availableRoles, activeRole]);

  const logout = async () => {
    if (currentUser) {
      await auditService.recordLogout(currentUser.uid, currentUser.email);
    }
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
    setIsMfaEnrolled(false);
    setMfaEnrollmentRequired(false);
    await authService.logout();
  };

  const completePasswordChange = useCallback(async () => {
    if (!currentUser) return;
    try {
      await FirestoreService.set('userRoles', currentUser.uid, {
        requiresPasswordChange: false,
        passwordChangedAt: new Date().toISOString()
      }, { merge: true });

      await FirestoreService.set('users', currentUser.uid, {
        requiresPasswordChange: false,
        passwordChangedAt: new Date().toISOString()
      }, { merge: true });

      setRequiresPasswordChange(false);
    } catch (e) {
      console.error("Error updating requiresPasswordChange in Firestore:", e);
      setRequiresPasswordChange(false);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    userRole: activeRole, // Mapped for backward compatibility
    activeRole,
    availableRoles,
    domainUser,
    requiresPasswordChange,
    completePasswordChange,
    isMfaEnrolled,
    mfaEnrollmentRequired,
    completeMfaEnrollment,
    refreshMfaStatus,
    switchRole,
    isRoleAvailable,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
