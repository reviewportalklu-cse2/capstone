import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function inspectUser() {
  const email = 'ashrith3155@kluniversity.in';
  console.log("Inspecting user:", email);

  for (const coll of ['users', 'guides', 'classroomFaculty', 'faculty', 'reviewers', 'userRoles']) {
    const snap = await getDocs(collection(db, coll));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const matches = docs.filter(d => JSON.stringify(d).toLowerCase().includes('ashrith3155') || JSON.stringify(d).includes('2056'));
    console.log(`\nCollection: ${coll} (total ${docs.length} docs, ${matches.length} matching ashrith3155/2056):`);
    matches.forEach(m => console.log(JSON.stringify(m, null, 2)));
  }

  // Also inspect evaluations and pendingEvaluations
  const evalsSnap = await getDocs(collection(db, 'evaluations'));
  console.log(`\nTotal evaluations in Firestore: ${evalsSnap.size}`);
  evalsSnap.docs.forEach(d => console.log(d.id, "=>", JSON.stringify(d.data())));

  const pendingSnap = await getDocs(collection(db, 'pendingEvaluations'));
  console.log(`\nTotal pendingEvaluations in Firestore: ${pendingSnap.size}`);
  pendingSnap.docs.forEach(d => console.log(d.id, "=>", JSON.stringify(d.data())));

  process.exit(0);
}

inspectUser().catch(console.error);
