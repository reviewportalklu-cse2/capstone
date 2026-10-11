import { FirestoreService } from './firestore.js';

const COLLECTION_NAME = 'auditLogs';

const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') return "Server Environment";
  const userAgent = navigator.userAgent || '';
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

export const auditService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  
  log: async (userId, action, entity, previousValue = null, updatedValue = null) => {
    try {
      await FirestoreService.create(COLLECTION_NAME, {
        userId,
        action,
        entity,
        previousValue,
        updatedValue,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  },

  getBrowserInfo,

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

      await FirestoreService.create(COLLECTION_NAME, {
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

  recordLogout: async (uid, email) => {
    try {
      await FirestoreService.create('loginHistory', {
        uid,
        email: email ? email.toLowerCase() : '',
        logoutTime: new Date().toISOString(),
        action: 'LOGOUT',
        browser: getBrowserInfo()
      });

      await FirestoreService.create(COLLECTION_NAME, {
        user: uid,
        email,
        action: 'LOGOUT',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error recording logout history:", err);
    }
  },

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
