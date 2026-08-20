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

async function inspect() {
  const studentsSnap = await getDocs(collection(db, 'students'));
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log("Total teams:", teams.length);
  console.log("Team IDs:", teams.map(t => t.id).slice(0, 10));
  
  const sampleStudent = students[0];
  console.log("Sample Student 0 keys:", Object.keys(sampleStudent));
  console.log("Sample Student 0 teamId/team/teamName:", sampleStudent.teamId, sampleStudent.team, sampleStudent.teamName);

  // Group students by teamId
  const teamMap = {};
  students.forEach(s => {
    const tId = s.teamId || s.team || 'unassigned';
    teamMap[tId] = (teamMap[tId] || 0) + 1;
  });
  console.log("Student team distribution:", teamMap);
}

inspect();
