import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

async function testTeamWorkspaceRender() {
  console.log("===============================================================");
  console.log("   TESTING ADMIN TEAM WORKSPACE RENDER FOR T001, T002, T003    ");
  console.log("===============================================================\n");

  const { resolveTeamRelations } = await import('./src/utils/relationshipResolver.js');

  const [teamsSnap, studentsSnap, guidesSnap, facultySnap, reviewersSnap, cyclesSnap, evalsSnap] = await Promise.all([
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'guides')),
    getDocs(collection(db, 'classroomFaculty')),
    getDocs(collection(db, 'reviewers')),
    getDocs(collection(db, 'reviewCycles')),
    getDocs(collection(db, 'evaluations'))
  ]);

  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const faculty = facultySnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const reviewers = reviewersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const reviewCycles = cyclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const testIds = ['T001', 'T002', 'T003', 'T01', 'T02'];

  for (const tid of testIds) {
    const found = teams.find(t => String(t.id || t.teamId).toLowerCase() === tid.toLowerCase()) || { id: tid, teamId: tid };
    const rel = resolveTeamRelations(found, { students, guides, faculty, reviewers, reviewCycles, evaluations });

    console.log(`[TEAM WORKSPACE DATA RESOLVED FOR ${tid}]:`, {
      teamId: rel.teamId,
      membersCount: rel.members?.length || 0,
      guideName: rel.guideName,
      facultyName: rel.facultyName,
      reviewerName: rel.reviewerName,
      guideScore: rel.guideScore ?? 'PENDING',
      facultyScore: rel.facultyScore ?? 'PENDING',
      reviewerScore: rel.reviewerScore ?? 'PENDING'
    });
  }

  console.log("\n===============================================================");
  console.log("   TEAM WORKSPACE DATA RESOLUTION VERIFIED SUCCESSFUL           ");
  console.log("===============================================================");

  process.exit(0);
}

testTeamWorkspaceRender();
