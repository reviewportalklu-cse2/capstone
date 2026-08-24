/**
 * PHASE XXII — TEAM T02 EVALUATION FORENSICS SCRIPT
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

async function runForensics() {
  console.log("===============================================================");
  console.log("   PHASE XXII TEAM T02 REAL FIRESTORE EVALUATION FORENSICS      ");
  console.log("===============================================================\n");

  try {
    const [evalsSnap, teamsSnap, reviewCyclesSnap] = await Promise.all([
      getDocs(collection(db, 'evaluations')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'reviewCycles'))
    ]);

    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewCycles = reviewCyclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Total Evaluations in Firestore: ${evaluations.length}`);
    console.log(`Active Review Cycles: ${reviewCycles.length}\n`);

    const t02Evals = evaluations.filter(e => {
      const cleanTId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanTId === 't02';
    });

    console.log(`--- EVALUATIONS MATCHING TEAM T02 (${t02Evals.length} documents) ---`);
    t02Evals.forEach((ev, idx) => {
      console.log(`Document #${idx + 1}: ID=${ev.id}`);
      console.log(`  TeamID: ${ev.teamId || ev.team}`);
      console.log(`  Role: ${ev.role}`);
      console.log(`  ReviewCycleID: ${ev.reviewCycleId || ev.reviewCycle}`);
      console.log(`  EvaluatorID: ${ev.evaluatorId || ev.evaluatorEmail}`);
      console.log(`  TeamAverage: ${ev.teamAverage || ev.totalScore}`);
      console.log(`  Status: ${ev.status}`);
      console.log(`  SubmittedAt: ${ev.submittedAt || ev.updatedAt || ev.createdAt}`);
      console.log(`  Attendance: ${JSON.stringify(ev.attendance || {})}`);
      console.log(`  StudentTotals: ${JSON.stringify(ev.studentTotals || {})}\n`);
    });

    const t02TeamDoc = teams.find(t => String(t.teamId || t.id || '').toLowerCase() === 't02');
    console.log(`--- RAW FIRESTORE TEAMS DOC FOR T02 ---`);
    console.log(t02TeamDoc);

  } catch (err) {
    console.error("Forensics failed:", err);
  }
}

runForensics();
