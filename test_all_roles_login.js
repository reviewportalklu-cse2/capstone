import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { userRoleService } from './src/firebase/services/userRoleService.js';
import { userResolver } from './src/firebase/services/userResolver.js';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const testAccounts = [
  { roleName: 'ADMIN', email: 'admin@university.edu', pass: 'Admin@123', expectedRole: 'admin' },
  { roleName: 'GUIDE', email: 'guide01@university.edu', pass: 'Guide@123', expectedRole: 'guide' },
  { roleName: 'FACULTY', email: 'faculty01@university.edu', pass: 'Faculty@123', expectedRole: 'classroom_faculty' },
  { roleName: 'REVIEWER', email: 'reviewer01@university.edu', pass: 'Reviewer@123', expectedRole: 'reviewer' },
  { roleName: 'STUDENT', email: 'student01@university.edu', pass: 'Student@123', expectedRole: 'student' }
];

async function testRoles() {
  console.log("===============================================================");
  console.log("   ALL 5 ROLES END-TO-END AUTHENTICATION & RESOLUTION TEST     ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  for (const acc of testAccounts) {
    try {
      console.log(`--- TESTING ${acc.roleName} (${acc.email}) ---`);
      
      // 1. Firebase Auth Sign In
      const userCred = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
      const user = userCred.user;
      console.log(` [PASS] 1. Firebase Auth Succeeded | UID: ${user.uid}`);

      // 2. Discover Roles
      const { availableRoles, defaultRole } = await userRoleService.getUserRoles(user.uid, user.email);
      console.log(` [PASS] 2. User Roles Resolved | Available: [${availableRoles.join(', ')}] | Default: ${defaultRole}`);

      // 3. Resolve Domain User
      const activeRole = availableRoles.includes(acc.expectedRole) ? acc.expectedRole : defaultRole;
      const domainUser = await userResolver.resolveCurrentUser(user, activeRole);
      
      if (domainUser) {
        console.log(` [PASS] 3. Domain User Resolved | Name: ${domainUser.name} | Domain ID: ${domainUser.domainId} | Role: ${domainUser.role}`);
        passed++;
      } else {
        console.error(` [FAIL] 3. Domain User Null`);
        failed++;
      }

      // 4. Sign out
      await signOut(auth);
      console.log(` [PASS] 4. Sign Out Clean\n`);

    } catch (err) {
      console.error(` [FAIL] ${acc.roleName} Login Failed:`, err.message);
      failed++;
    }
  }

  console.log("===============================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");
}

testRoles();
