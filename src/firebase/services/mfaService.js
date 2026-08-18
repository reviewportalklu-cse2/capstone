import { FirestoreService } from './firestore';

const DEVICE_TOKEN_KEY = 'capstone-device-token';

const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(DEVICE_TOKEN_KEY, deviceId);
  }
  return deviceId;
};

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
  else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
  else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
  else if (userAgent.indexOf("MSIE") > -1 || !!document.documentMode) browser = "IE";

  if (userAgent.indexOf("Win") > -1) os = "Windows";
  else if (userAgent.indexOf("Mac") > -1) os = "MacOS";
  else if (userAgent.indexOf("Linux") > -1) os = "Linux";
  else if (userAgent.indexOf("Android") > -1) os = "Android";
  else if (userAgent.indexOf("like Mac") > -1) os = "iOS";

  return `${browser} on ${os}`;
};

export const mfaService = {
  getDeviceId: getOrCreateDeviceId,
  getBrowserInfo,

  /**
   * Check if current user's device is trusted and unexpired
   */
  isTrustedDevice: async (uid) => {
    if (!uid) return false;
    try {
      const deviceId = getOrCreateDeviceId();
      const records = await FirestoreService.query('trustedDevices', [
        { field: 'uid', operator: '==', value: uid },
        { field: 'deviceId', operator: '==', value: deviceId }
      ]);

      if (records.length === 0) return false;

      const device = records[0];
      if (device.revoked) return false;

      const expiresAt = new Date(device.expiresAt).getTime();
      if (Date.now() > expiresAt) return false;

      // Update last used timestamp
      await FirestoreService.update('trustedDevices', device.id, {
        lastUsed: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.warn("Error checking trusted device:", err);
      return false;
    }
  },

  /**
   * Register current device as trusted for 30 days
   */
  rememberDevice: async (uid, durationDays = 30) => {
    if (!uid) return;
    try {
      const deviceId = getOrCreateDeviceId();
      const browser = getBrowserInfo();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const existing = await FirestoreService.query('trustedDevices', [
        { field: 'uid', operator: '==', value: uid },
        { field: 'deviceId', operator: '==', value: deviceId }
      ]);

      const payload = {
        uid,
        deviceId,
        browser,
        operatingSystem: navigator.platform || 'Desktop',
        trustedAt: now.toISOString(),
        expiresAt,
        lastUsed: now.toISOString(),
        revoked: false
      };

      if (existing.length > 0) {
        await FirestoreService.update('trustedDevices', existing[0].id, payload);
      } else {
        await FirestoreService.create('trustedDevices', payload);
      }

      await FirestoreService.create('auditLogs', {
        user: uid,
        action: 'TRUSTED_DEVICE_ADDED',
        deviceId,
        browser,
        timestamp: now.toISOString()
      });
    } catch (err) {
      console.error("Error saving trusted device:", err);
    }
  },

  /**
   * Revoke a trusted device
   */
  removeTrustedDevice: async (id, uid) => {
    try {
      await FirestoreService.update('trustedDevices', id, { revoked: true });
      await FirestoreService.create('auditLogs', {
        user: uid,
        action: 'TRUSTED_DEVICE_REMOVED',
        deviceId: id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error removing trusted device:", err);
    }
  },

  /**
   * Fetch user's trusted devices
   */
  getTrustedDevices: async (uid) => {
    if (!uid) return [];
    try {
      const devices = await FirestoreService.query('trustedDevices', [
        { field: 'uid', operator: '==', value: uid }
      ]);
      return devices.filter(d => !d.revoked);
    } catch (err) {
      console.error("Error fetching trusted devices:", err);
      return [];
    }
  },

  /**
   * Generate and send 6-digit Email OTP
   */
  requestMFA: async (uid, email) => {
    if (!uid) throw new Error("User ID required for MFA request");

    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const payload = {
      uid,
      email: email ? email.toLowerCase() : '',
      otp,
      createdAt: now.toISOString(),
      expiresAt,
      attempts: 0,
      verified: false,
      device: getBrowserInfo()
    };

    const docId = await FirestoreService.create('otpSessions', payload);

    await FirestoreService.create('auditLogs', {
      user: uid,
      email,
      action: 'MFA_OTP_REQUESTED',
      sessionId: docId,
      timestamp: now.toISOString()
    });

    // Also send an in-app notification for quick local testing/preview
    await FirestoreService.create('notifications', {
      title: 'MFA Security Verification Code',
      message: `Your Capstone System security code is: ${otp} (Expires in 5 minutes).`,
      recipientType: 'individual',
      recipientIds: [uid],
      category: 'System',
      priority: 'Critical',
      createdAt: now.toISOString()
    });

    return { sessionId: docId, otp };
  },

  /**
   * Verify entered 6-digit OTP code
   */
  verifyMFA: async (uid, otpCode, rememberDevice = false) => {
    if (!uid || !otpCode) throw new Error("OTP code is required.");

    const sessions = await FirestoreService.query('otpSessions', [
      { field: 'uid', operator: '==', value: uid },
      { field: 'verified', operator: '==', value: false }
    ]);

    if (sessions.length === 0) {
      throw new Error("No active OTP session found. Please request a new code.");
    }

    // Sort newest first
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const activeSession = sessions[0];

    // Check expiry
    if (new Date() > new Date(activeSession.expiresAt)) {
      throw new Error("OTP security code has expired. Please click 'Resend Code'.");
    }

    // Check attempts limit (max 5)
    const currentAttempts = (activeSession.attempts || 0) + 1;
    await FirestoreService.update('otpSessions', activeSession.id, { attempts: currentAttempts });

    if (currentAttempts > 5) {
      await FirestoreService.create('auditLogs', {
        user: uid,
        action: 'MFA_MAX_ATTEMPTS_EXCEEDED',
        timestamp: new Date().toISOString()
      });
      throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
    }

    if (activeSession.otp !== otpCode.trim()) {
      const remaining = 5 - currentAttempts;
      await FirestoreService.create('auditLogs', {
        user: uid,
        action: 'MFA_OTP_FAILED',
        attempts: currentAttempts,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // Mark verified
    await FirestoreService.update('otpSessions', activeSession.id, { verified: true });

    if (rememberDevice) {
      await mfaService.rememberDevice(uid, 30);
    }

    await FirestoreService.create('auditLogs', {
      user: uid,
      action: 'MFA_OTP_VERIFIED',
      timestamp: new Date().toISOString()
    });

    return { success: true };
  },

  /**
   * Record login history event
   */
  recordLogin: async (uid, email, success, failureReason = null) => {
    try {
      const payload = {
        uid,
        email: email ? email.toLowerCase() : '',
        loginTime: new Date().toISOString(),
        browser: getBrowserInfo(),
        success,
        failureReason: failureReason || null
      };
      await FirestoreService.create('loginHistory', payload);

      await FirestoreService.create('auditLogs', {
        user: uid,
        email,
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        reason: failureReason || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error recording login history:", err);
    }
  },

  /**
   * Record logout event
   */
  recordLogout: async (uid, email) => {
    try {
      await FirestoreService.create('loginHistory', {
        uid,
        email: email ? email.toLowerCase() : '',
        logoutTime: new Date().toISOString(),
        action: 'LOGOUT',
        browser: getBrowserInfo()
      });

      await FirestoreService.create('auditLogs', {
        user: uid,
        email,
        action: 'LOGOUT',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error recording logout history:", err);
    }
  },

  /**
   * Fetch login history for a user
   */
  getLoginHistory: async (uid) => {
    if (!uid) return [];
    try {
      const history = await FirestoreService.query('loginHistory', [
        { field: 'uid', operator: '==', value: uid }
      ]);
      return history.sort((a, b) => new Date(b.loginTime || b.logoutTime) - new Date(a.loginTime || a.logoutTime));
    } catch (err) {
      console.error("Error fetching login history:", err);
      return [];
    }
  }
};
