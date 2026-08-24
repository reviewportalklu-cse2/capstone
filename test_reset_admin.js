import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';

const env = process.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testReset() {
  console.log("Testing password reset for cse2admin@kluniversity.in...");
  
  // 1. Try sending OOB password reset request via REST API
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${env.VITE_FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: 'cse2admin@kluniversity.in'
      })
    });
    const data = await res.json();
    console.log("OOB Code Response:", data);
    if (data.oobCode) {
      console.log("OOB Code received! Resetting password...");
      const resetRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${env.VITE_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oobCode: data.oobCode,
          newPassword: 'cse2-2026'
        })
      });
      const resetData = await resetRes.json();
      console.log("Reset Password Response:", resetData);
    }
  } catch (err) {
    console.error("REST Error:", err);
  }

  process.exit(0);
}

testReset();
