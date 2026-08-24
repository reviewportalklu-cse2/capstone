import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const env = process.env;

console.log("===============================================================");
console.log("   ADMIN AUTHENTICATION & CONFIGURATION DIAGNOSTIC SUITE       ");
console.log("===============================================================\n");

console.log("1. FIREBASE ENVIRONMENT CONFIGURATION:");
console.log("   - VITE_FIREBASE_PROJECT_ID:", env.VITE_FIREBASE_PROJECT_ID);
console.log("   - VITE_FIREBASE_AUTH_DOMAIN:", env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("   - Connected to target Firebase project:", env.VITE_FIREBASE_PROJECT_ID);

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
const db = getFirestore(app);

async function runDiagnostic() {
  const { authService } = await import('./src/firebase/services/authService.js');

  console.log("\n2. FIRESTORE USER ROLES COLLECTION AUDIT:");
  const userRolesSnap = await getDocs(collection(db, 'userRoles'));
  console.log(`   - Total documents in 'userRoles' collection: ${userRolesSnap.docs.length}`);

  userRolesSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.email === 'cse2admin@kluniversity.in' || data.email === 'admin@university.edu' || (data.availableRoles && data.availableRoles.includes('admin'))) {
      console.log(`   - Found Admin Document in 'userRoles' [Doc ID: ${docSnap.id}]:`, {
        uid: data.uid,
        email: data.email,
        availableRoles: data.availableRoles,
        defaultRole: data.defaultRole,
        requiresPasswordChange: data.requiresPasswordChange
      });
    }
  });

  console.log("\n3. FIRESTORE USERS COLLECTION AUDIT:");
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.email === 'cse2admin@kluniversity.in' || data.email === 'admin@university.edu' || data.role === 'admin') {
      console.log(`   - Found User Document in 'users' [Doc ID: ${docSnap.id}]:`, {
        uid: data.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        requiresPasswordChange: data.requiresPasswordChange
      });
    }
  });

  console.log("\n4. AUTHENTICATION ATTEMPTS (VIA AUTH SERVICE):");

  const testCases = [
    { email: 'cse2admin@kluniversity.in', pass: 'cse2-2026' },
    { email: 'cse2admin@kluniversity.in', pass: 'case2-2026' },
    { email: 'admin@university.edu', pass: 'Admin@123' },
    { email: 'admin', pass: 'Admin@123' }
  ];

  for (const tc of testCases) {
    try {
      const user = await authService.login(tc.email, tc.pass);
      const roleDoc = await getDoc(doc(db, 'userRoles', user.uid));
      const roleData = roleDoc.exists() ? roleDoc.data() : {};
      console.log(`   - [PASS] Login('${tc.email}', '${tc.pass}') -> SUCCESS! Logged in as UID: ${user.uid} (${user.email}), Active Role: ${roleData.defaultRole || 'admin'}, ReqPassChange: ${roleData.requiresPasswordChange}`);
    } catch (e) {
      console.log(`   - [FAIL] Login('${tc.email}', '${tc.pass}') -> Error: ${e.message}`);
    }
  }

  process.exit(0);
}

runDiagnostic();
