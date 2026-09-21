import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function checkCollections() {
  const colls = [
    'teams',
    'projects',
    'students',
    'guides',
    'classroomFaculty',
    'reviewers',
    'guideAssignments',
    'facultyAssignments',
    'reviewerAssignments',
    'evaluations'
  ];

  for (const c of colls) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection [${c}]: count = ${snap.docs.length}`);
      if (snap.docs.length > 0) {
        console.log(`  First doc in [${c}] ID: ${snap.docs[0].id}`);
        console.log(`  First doc sample:`, JSON.stringify(snap.docs[0].data()).slice(0, 300));
      }
    } catch (e) {
      console.error(`Collection [${c}] error:`, e.message);
    }
  }
}

checkCollections().then(() => process.exit(0));
