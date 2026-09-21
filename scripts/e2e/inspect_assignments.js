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

async function inspectAssignments() {
  const faSnap = await getDocs(collection(db, 'facultyAssignments'));
  const raSnap = await getDocs(collection(db, 'reviewerAssignments'));
  const cfSnap = await getDocs(collection(db, 'classroomFaculty'));
  const revSnap = await getDocs(collection(db, 'reviewers'));

  console.log("facultyAssignments sample (first 5):");
  faSnap.docs.slice(0, 5).forEach(d => console.log(d.id, d.data()));

  console.log("\nreviewerAssignments sample (first 5):");
  raSnap.docs.slice(0, 5).forEach(d => console.log(d.id, d.data()));

  console.log(`\nclassroomFaculty count: ${cfSnap.docs.length}`);
  console.log(`reviewers count: ${revSnap.docs.length}`);
  console.log("reviewers sample (first 3):");
  revSnap.docs.slice(0, 3).forEach(d => console.log(d.id, d.data()));
  
  process.exit(0);
}

inspectAssignments();
