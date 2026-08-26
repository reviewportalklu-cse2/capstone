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

async function inspectProjects() {
  console.log("=== INSPECTING PROJECTS COLLECTION ===");
  const snap = await getDocs(collection(db, "projects"));
  console.log(`Found ${snap.docs.length} documents in 'projects' collection:`);
  snap.docs.forEach((doc, idx) => {
    console.log(`\nDoc ${idx + 1} ID [${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
  });

  console.log("\n=== INSPECTING TEAMS COLLECTION (Sample 5) ===");
  const teamSnap = await getDocs(collection(db, "teams"));
  console.log(`Found ${teamSnap.docs.length} documents in 'teams' collection:`);
  teamSnap.docs.slice(0, 5).forEach((doc, idx) => {
    console.log(`Team Doc ${idx + 1} ID [${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
  });

  process.exit(0);
}

inspectProjects().catch(err => {
  console.error("Error inspecting projects:", err);
  process.exit(1);
});
