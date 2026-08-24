/**
 * PHASE XXI DIAGNOSTIC SCRIPT
 * Inspect real Firestore database collections: evaluations, students, teams, projects, guides, faculty, reviewers, rubrics, cycles, notifications.
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

async function inspectRealFirestoreData() {
  console.log("===============================================================");
  console.log("   PHASE XXI REAL FIRESTORE DATABASE DIAGNOSTIC AUDIT           ");
  console.log("===============================================================\n");

  try {
    const [evalsSnap, teamsSnap, studentsSnap, guidesSnap, facultySnap, reviewersSnap, cyclesSnap, rubricsSnap] = await Promise.all([
      getDocs(collection(db, 'evaluations')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'guides')),
      getDocs(collection(db, 'classroomFaculty')),
      getDocs(collection(db, 'reviewers')),
      getDocs(collection(db, 'reviewCycles')),
      getDocs(collection(db, 'rubrics'))
    ]);

    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Summary Counts: ${teams.length} Teams, ${students.length} Students, ${evaluations.length} Evaluations`);

    console.log("\n--- REAL FIRESTORE EVALUATIONS ---");
    if (evaluations.length === 0) {
      console.log("No evaluation documents found in Firestore 'evaluations' collection.");
    } else {
      evaluations.forEach((ev, idx) => {
        console.log(`\nEvaluation #${idx + 1}: ID=${ev.id}`);
        console.log(`  Team: ${ev.teamId} (${ev.teamName || 'N/A'}) | Review Cycle: ${ev.reviewCycle || ev.reviewCycleId}`);
        console.log(`  Role: ${ev.role} | Evaluator: ${ev.evaluatorName} (${ev.evaluatorId})`);
        console.log(`  Status: ${ev.status} | Team Average: ${ev.teamAverage}`);
        console.log(`  Attendance:`, JSON.stringify(ev.attendance || {}));
        console.log(`  Student Totals:`, JSON.stringify(ev.studentTotals || {}));
        console.log(`  SubmittedAt: ${ev.submittedAt || 'N/A'} | UpdatedAt: ${ev.updatedAt || 'N/A'}`);
      });
    }

    console.log("\n===============================================================");
  } catch (err) {
    console.error("Diagnostic inspection failed:", err);
  }
}

inspectRealFirestoreData();
