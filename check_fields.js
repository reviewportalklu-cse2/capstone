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

async function run() {
  const q1 = await getDocs(collection(db, "students"));
  console.log("Student:", q1.docs[0].id, q1.docs[0].data());
  
  const q2 = await getDocs(collection(db, "guides"));
  console.log("Guide:", q2.docs[0].id, q2.docs[0].data());
  process.exit(0);
}
run();
