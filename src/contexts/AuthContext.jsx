import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/firebase/services/authService';
import { userService } from '@/firebase/services/userService';
import { userRoleService } from '@/firebase/services/userRoleService';
import { userResolver } from '@/firebase/services/userResolver';
import { mfaService } from '@/firebase/services/mfaService';
import { FirestoreService } from '@/firebase/services/firestore';
import Logo from '@/components/common/Logo';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

const STORAGE_KEY_ACTIVE_ROLE = 'capstone-active-role';
const SESSION_KEY_MFA_VERIFIED = 'capstone-mfa-verified';

const ROLE_PATH_MAP = {
  admin: '/admin/dashboard',
  guide: '/guide/dashboard',
  classroom_faculty: '/faculty/dashboard',
  faculty: '/faculty/dashboard',
  reviewer: '/reviewer/dashboard',
  student: '/student/dashboard'
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [activeRole, setActiveRoleState] = useState(null);
  const [domainUser, setDomainUser] = useState(null);
  
  // MFA States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (user) => {
      console.log("[AUTH_RUNTIME] Auth state changed:", user?.email || "UNAUTHENTICATED");
      if (user) {
        setLoading(true);
        try {
          // 1. Fetch available roles from userRoleService (or auto-discover)
          const { availableRoles: roles, defaultRole } = await userRoleService.getUserRoles(user.uid, user.email);
          
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

          // 4. MFA & Identity Protection Evaluation (only require if explicitly enabled in Firestore)
          const trusted = await mfaService.isTrustedDevice(user.uid);
          setIsTrustedDevice(trusted);

          const secDoc = await FirestoreService.getById('settings', 'security');
          const mfaEnabled = secDoc ? secDoc.mfaEnabled === true : false;
          const mandatoryRoles = secDoc?.mandatoryRoles || [];

          const requiresMfa = mfaEnabled && mandatoryRoles.includes(initialRole);
          setMfaRequired(requiresMfa);

          const sessionVerified = sessionStorage.getItem(SESSION_KEY_MFA_VERIFIED) === 'true';

          if (requiresMfa && !trusted && !sessionVerified) {
            setMfaVerified(false);
          } else {
            setMfaVerified(true);
          }

          setCurrentUser(user);
          console.log("[AUTH_RUNTIME] Auth resolved:", user.email, "| Role:", initialRole);
        } catch (error) {
          console.error("[AUTH_RUNTIME] Error resolving auth state:", error);
          setCurrentUser(user);
          setAvailableRoles(['student']);
          setActiveRoleState('student');
          setDomainUser(null);
          setMfaVerified(true);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setAvailableRoles([]);
        setActiveRoleState(null);
        setDomainUser(null);
        setMfaRequired(false);
        setMfaVerified(false);
        setIsTrustedDevice(false);
        setLastGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
        sessionStorage.removeItem(SESSION_KEY_MFA_VERIFIED);
        setLoading(false);
        console.log("[AUTH_RUNTIME] Auth state reset to UNAUTHENTICATED.");
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Request a new OTP verification code
   */
  const requestMfaOTP = useCallback(async () => {
    if (!currentUser) return;
    const res = await mfaService.requestMFA(currentUser.uid, currentUser.email);
    if (res?.otp) setLastGeneratedOtp(res.otp);
    return res;
  }, [currentUser]);

  /**
   * Verify entered OTP code and complete MFA login step
   */
  const verifyMfaOTP = useCallback(async (otpCode, rememberDevice = false) => {
    if (!currentUser) throw new Error("User not authenticated.");
    
    await mfaService.verifyMFA(currentUser.uid, otpCode, rememberDevice);
    setMfaVerified(true);
    sessionStorage.setItem(SESSION_KEY_MFA_VERIFIED, 'true');

    if (rememberDevice) {
      setIsTrustedDevice(true);
    }

    return ROLE_PATH_MAP[activeRole] || '/';
  }, [currentUser, activeRole]);

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

      // Re-evaluate MFA for switched role
      const secDoc = await FirestoreService.getById('settings', 'security');
      const mfaEnabled = secDoc ? secDoc.mfaEnabled !== false : true;
      const mandatoryRoles = secDoc?.mandatoryRoles || ['admin', 'guide', 'classroom_faculty', 'faculty', 'reviewer'];
      const requiresMfa = mfaEnabled && mandatoryRoles.includes(newRole);

      const trusted = await mfaService.isTrustedDevice(currentUser.uid);
      const sessionVerified = sessionStorage.getItem(SESSION_KEY_MFA_VERIFIED) === 'true';

      if (requiresMfa && !trusted && !sessionVerified) {
        setMfaRequired(true);
        setMfaVerified(false);
        await requestMfaOTP();
      } else {
        setMfaVerified(true);
      }

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
  }, [currentUser, activeRole, availableRoles, requestMfaOTP]);

  const isRoleAvailable = useCallback((role) => {
    return availableRoles.includes(role);
  }, [availableRoles]);

  const logout = async () => {
    if (currentUser) {
      await mfaService.recordLogout(currentUser.uid, currentUser.email);
    }
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
    sessionStorage.removeItem(SESSION_KEY_MFA_VERIFIED);
    await authService.logout();
  };

  const value = {
    currentUser,
    userRole: activeRole, // Mapped for backward compatibility
    activeRole,
    availableRoles,
    domainUser,
    mfaRequired,
    mfaVerified,
    isTrustedDevice,
    lastGeneratedOtp,
    requestMfaOTP,
    verifyMfaOTP,
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
