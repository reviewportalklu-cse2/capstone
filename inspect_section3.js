import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectAll() {
  console.log("=== 1. REVIEW CYCLES ===");
  const rcSnap = await getDocs(collection(db, 'reviewCycles'));
  rcSnap.forEach(d => console.log(d.id, d.data()));

  console.log("\n=== 2. RUBRICS ===");
  const rSnap = await getDocs(collection(db, 'rubrics'));
  rSnap.forEach(d => console.log(d.id, JSON.stringify(d.data(), null, 2)));

  console.log("\n=== 3. RUBRIC CRITERIA FOR REVIEW 3 / RUBRICS ===");
  const cSnap = await getDocs(collection(db, 'rubricCriteria'));
  cSnap.forEach(d => {
    const data = d.data();
    console.log(d.id, `rubricId=${data.rubricId}`, `reviewCycleId=${data.reviewCycleId}`, `name=${data.name || data.title}`, `maxMarks=${data.maxMarks || data.maximumMarks}`);
  });

  console.log("\n=== 4. EVALUATIONS ===");
  const evSnap = await getDocs(collection(db, 'evaluations'));
  console.log(`Total evaluations: ${evSnap.size}`);
  evSnap.forEach(d => {
    const data = d.data();
    console.log(d.id, {
      teamId: data.teamId,
      reviewCycleId: data.reviewCycleId || data.reviewCycle,
      rubricId: data.rubricId,
      status: data.status,
      totalScore: data.totalScore,
      evaluatorId: data.evaluatorId,
      evaluatorRole: data.evaluatorRole,
      scores: data.scores
    });
  });

  process.exit(0);
}

inspectAll().catch(e => { console.error(e); process.exit(1); });
