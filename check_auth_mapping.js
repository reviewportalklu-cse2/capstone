import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTasks() {
  console.log("--------------------------------------------------");
  console.log("TASK 1 & 2 - Debug Authentication Mapping");
  console.log("--------------------------------------------------");

  try {
    const cred = await signInWithEmailAndPassword(auth, "guide01@university.edu", "password123");
    console.log("Firebase Auth");
    console.log("--------------");
    console.log(`currentUser.uid: ${cred.user.uid}`);
    console.log(`currentUser.email: ${cred.user.email}`);

    // Try resolving manually via userResolver logic
    let domainRecords = await getDocs(query(collection(db, "guides"), where("email", "==", cred.user.email)));
    if (domainRecords.empty) {
      domainRecords = await getDocs(query(collection(db, "guides"), where("Email", "==", cred.user.email)));
    }

    console.log("\nUser Resolver");
    console.log("--------------");
    if (domainRecords.empty) {
      console.log(`Resolved domain document: null`);
      console.log(`Resolved domainId: null`);
    } else {
      const doc = domainRecords.docs[0];
      console.log(`Resolved domain document:`, doc.data());
      console.log(`Resolved domainId: ${doc.id}`);
    }

  } catch (error) {
    console.log("Failed to login as guide01@university.edu", error.message);
  }

  console.log("\n--------------------------------------------------");
  console.log("TASK 2 - Verify Firestore Guide Records");
  console.log("--------------------------------------------------");
  
  const snap = await getDocs(collection(db, "guides"));
  snap.forEach(d => {
    const data = d.data();
    console.log(`Document ID : ${d.id}`);
    console.log(`Employee ID : ${data['Employee ID'] || data.employeeId}`);
    console.log(`Guide Name : ${data['Guide Name'] || data.name}`);
    console.log(`Email : ${data.Email || data.email}`);
    console.log(`email : ${data.email || 'N/A'}`);
    console.log('---');
  });

  process.exit(0);
}

runTasks();
