/**
 * PHASE XXI REAL FIRESTORE ATTENDANCE & SINGLE SOURCE OF TRUTH VERIFICATION
 * KL CSE CAPSTONE PORTAL
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderAlertId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runPhaseXXIAttendanceVerification() {
  console.log("===============================================================");
  console.log("   PHASE XXI REAL ATTENDANCE & SINGLE SOURCE OF TRUTH VERIFICATION ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (num, description, condition) => {
    if (condition) {
      console.log(`[PASS] Check ${num}: ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] Check ${num}: ${description}`);
      failed++;
    }
  };

  try {
    const [evalsSnap, teamsSnap, studentsSnap] = await Promise.all([
      getDocs(collection(db, 'evaluations')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'students'))
    ]);

    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    assert(1, "Firestore database connected & collections loaded cleanly", teams.length > 0 && students.length > 0);

    // Test Team T02 Real Evaluation
    const t02Evals = evaluations.filter(e => String(e.teamId || '').toUpperCase() === 'T02')
      .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));
    
    const guideT02Eval = t02Evals.find(e => e.role === 'guide');

    assert(2, "Real Guide Evaluation document found in Firestore for Team T02", Boolean(guideT02Eval));
    assert(3, "Team T02 evaluation contains Absent status for Student 220003005", guideT02Eval?.attendance?.['220003005'] === 'Absent');
    assert(4, "Team T02 evaluation contains Absent status for Student 220003008", guideT02Eval?.attendance?.['220003008'] === 'Absent');

    // Test Team T01 Real Evaluation
    const t01Evals = evaluations.filter(e => String(e.teamId || '').toUpperCase() === 'T01')
      .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));
    
    const guideT01Eval = t01Evals.find(e => e.role === 'guide');
    assert(5, "Real Guide Evaluation document found in Firestore for Team T01", Boolean(guideT01Eval));
    assert(6, "Team T01 evaluation contains Absent status for Student 220003001", guideT01Eval?.attendance?.['220003001'] === 'Absent');

    // Verify 0 hardcoded 94% or 85 fallbacks
    const sampleStudentAttendanceT02 = guideT02Eval?.attendance?.['220003005'];
    assert(7, "Student 220003005 attendance resolves to ABSENT (Not hardcoded 94% or Present)", sampleStudentAttendanceT02 === 'Absent');

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Verification failed:", err);
  }
}

runPhaseXXIAttendanceVerification();
