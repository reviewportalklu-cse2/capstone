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
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
