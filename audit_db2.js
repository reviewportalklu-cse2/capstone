import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

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
  try {
    const sDoc = await getDoc(doc(db, "students", "22cse001"));
    if (sDoc.exists()) {
        console.log("--- Student Document 22cse001 ---");
        console.log(sDoc.data());
    } else {
        console.log("Student 22cse001 not found.");
    }

    const guides = await getDocs(collection(db, "guides"));
    console.log(`\nTotal Guides in DB: ${guides.size}`);
    if (guides.size > 0) {
        console.log("Sample Guide:");
        console.log(guides.docs[0].id, guides.docs[0].data());
    }

    const facs = await getDocs(collection(db, "classroomFaculty"));
    console.log(`\nTotal Faculty in DB: ${facs.size}`);
    
    const revs = await getDocs(collection(db, "reviewers"));
    console.log(`\nTotal Reviewers in DB: ${revs.size}`);
    
    const teams = await getDocs(collection(db, "teams"));
    console.log(`\nTotal Teams in DB: ${teams.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
