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

async function inspectFirestore() {
  console.log("==================================================");
  console.log("[GUIDE_RUNTIME_DEBUG] INSPECTING FIRESTORE DATA");
  console.log("==================================================\n");

  const getColl = async (name) => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch (e) {
      console.warn(`Could not load ${name}:`, e.message);
      return [];
    }
  };

  const guides = await getColl('guides');
  const reviewCycles = await getColl('reviewCycles');
  const rubrics = await getColl('rubrics');
  const guideAssignments = await getColl('guideAssignments');
  const facultyAssignments = await getColl('facultyAssignments');
  const reviewerAssignments = await getColl('reviewerAssignments');

  console.log("--- GUIDES COLLECTION ---");
  console.log(JSON.stringify(guides, null, 2));

  console.log("\n--- REVIEW CYCLES COLLECTION ---");
  console.log(JSON.stringify(reviewCycles, null, 2));

  console.log("\n--- RUBRICS COLLECTION ---");
  console.log(JSON.stringify(rubrics, null, 2));

  console.log("\n--- GUIDE ASSIGNMENTS COLLECTION (first 5) ---");
  console.log(JSON.stringify(guideAssignments.slice(0, 5), null, 2));

  process.exit(0);
}

inspectFirestore();
