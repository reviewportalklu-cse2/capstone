/**
 * PHASE XXI.1 — TEAMS & GROUPS RUNTIME & FIRESTORE AUDIT SCRIPT
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

async function auditTeamsAndGroupsPipeline() {
  console.log("===============================================================");
  console.log("   PHASE XXI.1 TEAMS & GROUPS RUNTIME & FIRESTORE AUDIT         ");
  console.log("===============================================================\n");

  try {
    const [teamsSnap, studentsSnap, evalsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'evaluations'))
    ]);

    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log("Sample Student #1 document keys & data:");
    console.log(students[0]);

    console.log("\nSample Team #1 document keys & data:");
    console.log(teams[0]);

    // Let's test team mapping logic
    const studentTeamIds = students.map(s => s.teamId || s.team || s['Team ID'] || s.TeamID);
    console.log("\nSample student team IDs:", [...new Set(studentTeamIds)].slice(0, 10));

  } catch (err) {
    console.error("Audit script error:", err);
  }
}

auditTeamsAndGroupsPipeline();
