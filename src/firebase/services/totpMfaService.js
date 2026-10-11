import { multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';

/**
 * Native Firebase TOTP MFA Service
 * Leverages Firebase Authentication's native Multi-Factor APIs.
 * Zero plaintext secrets or OTP codes are ever stored in Firestore or localStorage.
 */
export const totpMfaService = {
  /**
   * Determine if a Firebase user has at least one enrolled TOTP factor
   * @param {import('firebase/auth').User} user
   * @returns {boolean}
   */
  isMfaEnrolled: (user) => {
    if (!user) return false;
    try {
      const mfUser = multiFactor(user);
      const factors = mfUser?.enrolledFactors || [];
      return factors.some(
        (f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID || f.factorId === 'totp'
      );
    } catch (err) {
      console.warn('[TOTP_MFA] Error checking enrolled factors:', err);
      return false;
    }
  },

  /**
   * Retrieve all enrolled MFA factors for the user
   * @param {import('firebase/auth').User} user
   * @returns {Array}
   */
  getEnrolledFactors: (user) => {
    if (!user) return [];
    try {
      return multiFactor(user)?.enrolledFactors || [];
    } catch (err) {
      console.warn('[TOTP_MFA] Error getting enrolled factors:', err);
      return [];
    }
  },

  /**
   * Initialize a native TOTP enrollment session
   * @param {import('firebase/auth').User} user
   * @returns {Promise<{ mfaSession: any, totpSecret: any, qrCodeUri: string, manualKey: string }>}
   */
  startEnrollment: async (user) => {
    if (!user) {
      throw new Error('An active authenticated session is required to initiate MFA enrollment.');
    }

    try {
      const mfaSession = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(mfaSession);

      const accountName = user.email || 'user';
      const issuer = 'KL CSE Capstone Portal';
      const qrCodeUri = totpSecret.generateQrCodeUrl(accountName, issuer);
      const manualKey = totpSecret.secretKey;

      return {
        mfaSession,
        totpSecret,
        qrCodeUri,
        manualKey
      };
    } catch (error) {
      console.error('[TOTP_MFA] Error starting enrollment session:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Firebase Authentication with Identity Platform / TOTP MFA must be enabled for this project. (auth/operation-not-allowed)'
        );
      }
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('For security reasons, please log out and log in again before setting up MFA.');
      }
      throw new Error(error.message || 'Unable to generate MFA enrollment session. Please try again.');
    }
  },

  /**
   * Verify entered 6-digit TOTP code and finalize enrollment
   * @param {import('firebase/auth').User} user
   * @param {any} totpSecret
   * @param {string} verificationCode
   * @param {string} displayName
   * @returns {Promise<boolean>}
   */
  completeEnrollment: async (user, totpSecret, verificationCode, displayName = 'Authenticator App') => {
    if (!user) throw new Error('User session not active.');
    if (!totpSecret) throw new Error('Active TOTP setup session not found.');
    const code = (verificationCode || '').trim();
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code);
      await multiFactor(user).enroll(assertion, displayName);

      // Reload user to ensure client state updates
      try {
        await user.reload();
      } catch (reloadErr) {
        console.warn('[TOTP_MFA] Notice reloading user after enrollment:', reloadErr);
      }

      return true;
    } catch (error) {
      console.error('[TOTP_MFA] Verification error during enrollment:', error);
      if (
        error.code === 'auth/invalid-verification-code' ||
        error.code === 'auth/invalid-verification-id'
      ) {
        throw new Error('Invalid verification code. Please enter the current 6-digit code from your authenticator app.');
      }
      if (error.code === 'auth/code-expired') {
        throw new Error('The verification code has expired. Please enter the latest 6-digit code.');
      }
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Recent authentication required. Please log out and sign in again.');
      }
      throw new Error(error.message || 'Unable to complete MFA setup. Please check your verification code.');
    }
  },

  /**
   * Remove an enrolled factor
   * @param {import('firebase/auth').User} user
   * @param {string} factorUid
   */
  unenrollFactor: async (user, factorUid) => {
    if (!user) throw new Error('User session not active.');
    const factors = multiFactor(user)?.enrolledFactors || [];
    const targetFactor = factors.find((f) => f.uid === factorUid);
    if (!targetFactor) throw new Error('Selected MFA factor not found.');

    try {
      await multiFactor(user).unenroll(targetFactor);
      try {
        await user.reload();
      } catch (e) {
        // Ignore reload glitch
      }
      return true;
    } catch (error) {
      console.error('[TOTP_MFA] Error unenrolling factor:', error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Recent login required before disabling MFA. Please re-authenticate.');
      }
      throw new Error(error.message || 'Failed to remove MFA factor.');
    }
  }
};
