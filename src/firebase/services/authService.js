import { auth } from '../config';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

export const authService = {
  login: async (emailInput, password) => {
    const rawEmail = (emailInput || '').trim();
    if (!rawEmail) throw new Error('Email is required');

    // 1. First attempt with exact input
    try {
      const userCredential = await signInWithEmailAndPassword(auth, rawEmail, password);
      return userCredential.user;
    } catch (primaryErr) {
      if (primaryErr.code !== 'auth/invalid-credential' && primaryErr.code !== 'auth/user-not-found') {
        throw primaryErr;
      }

      // 2. Generate candidate email aliases if domain mismatch or username entered
      const candidates = [];
      const lower = rawEmail.toLowerCase();
      const prefix = lower.includes('@') ? lower.split('@')[0] : lower;

      ['university.edu', 'klu.edu.in', 'kluniversity.in'].forEach(domain => {
        const alt = `${prefix}@${domain}`;
        if (alt !== lower) candidates.push(alt);
      });

      if (prefix === 'admin') candidates.unshift('admin@university.edu');
      if (prefix === 'guide01' || prefix === 'guide1' || prefix === 'g001') {
        candidates.unshift('guide01@university.edu', 'guide1@klu.edu.in');
      }
      if (prefix === 'faculty01' || prefix === 'faculty1' || prefix === 'f001') {
        candidates.unshift('faculty01@university.edu', 'faculty1@klu.edu.in');
      }
      if (prefix === 'reviewer01' || prefix === 'reviewer1' || prefix === 'r001') {
        candidates.unshift('reviewer01@university.edu', 'reviewer1@klu.edu.in');
      }
      if (prefix === 'student01' || prefix === 'student1' || prefix === '2200030001' || prefix === '220003001') {
        candidates.unshift('student01@university.edu', 'student1@klu.edu.in');
      }

      const uniqueCandidates = [...new Set(candidates)];

      for (const cand of uniqueCandidates) {
        try {
          const res = await signInWithEmailAndPassword(auth, cand, password);
          return res.user;
        } catch (e) {
          // Continue trying next candidate
        }
      }

      throw primaryErr;
    }
  },

  logout: async () => {
    await firebaseSignOut(auth);
  },

  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },

  changePassword: async (currentUser, currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await firebaseUpdatePassword(currentUser, newPassword);
  },

  subscribeToAuthChanges: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};
