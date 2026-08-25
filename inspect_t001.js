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

async function inspectT001() {
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const studentsSnap = await getDocs(collection(db, 'students'));
  const guideAssignmentsSnap = await getDocs(collection(db, 'guideAssignments'));

  const t001 = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })).find(t => t.id === 'T001' || t.teamId === 'T001');
  const t001Students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.teamId === 'T001' || s.team === 'T001');
  const t001Assignments = guideAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.teamId === 'T001' || a.team === 'T001');

  console.log("Team T001:", t001);
  console.log("Team T001 Students:", t001Students);
  console.log("Team T001 Guide Assignments:", t001Assignments);
}

inspectT001();
