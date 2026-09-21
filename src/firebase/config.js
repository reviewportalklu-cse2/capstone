import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "final-year-project-erp.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "final-year-project-erp",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "final-year-project-erp.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1094425001784",
  appId: env.VITE_FIREBASE_APP_ID || "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("[AUTH_RUNTIME] Persistence configuration notice:", err);
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
