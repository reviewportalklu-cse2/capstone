import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { resolveGuideRelationships } from './src/utils/relationshipResolver.js';

async function inspectOverlap() {
  const studentsSnap = await getDocs(collection(db, 'students'));
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const guidesSnap = await getDocs(collection(db, 'guides'));
  const guideAssignmentsSnap = await getDocs(collection(db, 'guideAssignments'));

  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guideAssignments = guideAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const contextData = { students, teams, projects, guides, guideAssignments };

  const g1 = guides.find(g => g.email === 'ashrith3155@kluniversity.in' || g.employeeId === '1379');
  const g2 = guides.find(g => g.email === 'kiran_cse@kluniversity.in');

  console.log("Guide 1:", g1);
  console.log("Guide 2:", g2);

  const r1 = resolveGuideRelationships(g1, contextData);
  const r2 = resolveGuideRelationships(g2, contextData);

  console.log("\nGuide 1 Teams:", r1.teams.map(t => t.id || t.teamId));
  console.log("Guide 2 Teams:", r2.teams.map(t => t.id || t.teamId));
}

inspectOverlap();
