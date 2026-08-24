/**
 * PHASE XXII — CROSS-EVALUATOR MARK ISOLATION & ACCURACY TEST
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

async function runPhaseXXIIVerification() {
  console.log("===============================================================");
  console.log("   PHASE XXII CROSS-EVALUATOR MARK ISOLATION VERIFICATION     ");
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
    const [evalsSnap, teamsSnap] = await Promise.all([
      getDocs(collection(db, 'evaluations')),
      getDocs(collection(db, 'teams'))
    ]);

    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const t02Evals = evaluations.filter(e => String(e.teamId || e.team || '').toUpperCase() === 'T02');
    
    const guideEval = t02Evals.find(e => e.role === 'guide');
    const facultyEval = t02Evals.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
    const reviewerEval = t02Evals.find(e => e.role === 'reviewer');

    assert(1, "Guide Evaluation for T02 exists in Firestore with score 31", guideEval?.teamAverage === 31);
    assert(2, "Faculty Evaluation for T02 DOES NOT exist in Firestore (Not Submitted)", facultyEval === undefined);
    assert(3, "Reviewer Evaluation for T02 DOES NOT exist in Firestore (Not Submitted)", reviewerEval === undefined);

    // Score isolation calculation
    const guideScore = guideEval ? guideEval.teamAverage : null;
    const facultyScore = facultyEval ? facultyEval.teamAverage : null;
    const reviewerScore = reviewerEval ? reviewerEval.teamAverage : null;

    const validScores = [guideScore, facultyScore, reviewerScore].filter(s => s !== null && s !== undefined);
    const overallTotal = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;

    assert(4, "Guide Score evaluates to 31", guideScore === 31);
    assert(5, "Faculty Score evaluates to NULL (Renders 'Not Submitted', NOT 82)", facultyScore === null);
    assert(6, "Reviewer Score evaluates to NULL (Renders 'Not Submitted', NOT 88)", reviewerScore === null);
    assert(7, "Overall Total evaluates to 31 (Only submitted Guide score)", overallTotal === 31);

    // Attendance verification
    assert(8, "Student 220003005 attendance is ABSENT", guideEval?.attendance?.['220003005'] === 'Absent');
    assert(9, "Student 220003008 attendance is ABSENT", guideEval?.attendance?.['220003008'] === 'Absent');

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Verification failed:", err);
  }
}

runPhaseXXIIVerification();
