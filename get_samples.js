import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit } from "firebase/firestore";

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

async function run() {
  const facs = await getDocs(collection(db, "classroomFaculty"));
  if (!facs.empty) console.log("Faculty doc:", facs.docs[0].data());

  const revs = await getDocs(collection(db, "reviewers"));
  if (!revs.empty) console.log("Reviewer doc:", revs.docs[0].data());

  process.exit(0);
}
run();
