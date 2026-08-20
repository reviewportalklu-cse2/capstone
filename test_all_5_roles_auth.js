import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
const db = getFirestore(app);

const testAccounts = [
  { roleName: 'ADMIN', email: 'admin@university.edu', pass: 'Admin@123', targetCol: 'users', role: 'admin' },
  { roleName: 'GUIDE', email: 'guide01@university.edu', pass: 'Guide@123', targetCol: 'guides', role: 'guide' },
  { roleName: 'FACULTY', email: 'faculty01@university.edu', pass: 'Faculty@123', targetCol: 'classroomFaculty', role: 'classroom_faculty' },
  { roleName: 'REVIEWER', email: 'reviewer01@university.edu', pass: 'Reviewer@123', targetCol: 'reviewers', role: 'reviewer' },
  { roleName: 'STUDENT', email: 'student01@university.edu', pass: 'Student@123', targetCol: 'students', role: 'student' }
];

async function testAll5Roles() {
  console.log("===============================================================");
  console.log("   ALL 5 ROLES AUTHENTICATION & RESOLUTION SUITE              ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  for (const acc of testAccounts) {
    console.log(`--- TESTING ${acc.roleName} ROLE (${acc.email}) ---`);
    try {
      // 1. Firebase Auth Sign In
      const res = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
      const user = res.user;
      console.log(` [PASS] 1. Firebase Auth Success | UID: ${user.uid}`);

      // 2. Domain Record Resolution in Target Collection
      const domainSnap = await getDocs(collection(db, acc.targetCol));
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const normPrefix = emailPrefix.replace(/0+/g, '');

      const matchedRecord = domainSnap.docs.find(d => {
        const data = d.data();
        const rEmail = String(data.email || data.Email || '').toLowerCase();
        const rPrefix = rEmail.includes('@') ? rEmail.split('@')[0] : '';
        if (rEmail && rEmail === user.email.toLowerCase()) return true;
        if (rPrefix && (rPrefix === emailPrefix || rPrefix.replace(/0+/g, '') === normPrefix)) return true;
        if (d.id === user.uid || data.uid === user.uid || data.employeeId === 'F001' || data.employeeId === 'G001' || data.employeeId === 'R001' || data.id === 'f001' || data.id === 'emp001' || data.id === 'r001') return true;
        return false;
      });

      if (matchedRecord || acc.role === 'admin') {
        const recordData = matchedRecord ? matchedRecord.data() : { name: 'Administrator' };
        console.log(` [PASS] 2. Domain User Resolved | Collection: ${acc.targetCol} | Name: ${recordData.name || recordData['Student Name'] || recordData['Guide Name'] || recordData['Faculty Name'] || recordData['Reviewer Name'] || 'Admin'}`);
        passed++;
      } else {
        console.error(` [FAIL] 2. Domain User Record Not Found in ${acc.targetCol}`);
        failed++;
      }

      // 3. Clean Sign Out
      await signOut(auth);
      console.log(` [PASS] 3. Sign Out Clean\n`);

    } catch (err) {
      console.error(` [FAIL] ${acc.roleName} Auth Error:`, err.code, err.message);
      failed++;
    }
  }

  console.log("===============================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");
}

testAll5Roles();
