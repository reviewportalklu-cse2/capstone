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

const getField = (obj, keys) => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
    }
    return '';
};

async function run() {
  try {
    const guidesAll = await getDocs(collection(db, "guides"));
    const allGuides = guidesAll.docs.map(d => ({id: d.id, ...d.data()}));
    
    console.log("All Guides mappings:");
    for (const g of allGuides) {
        console.log("Guide Doc ID:", g.id);
        const key = getField(g, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase();
        console.log("Mapped key:", key);
    }

    const facAll = await getDocs(collection(db, "classroomFaculty"));
    const allFac = facAll.docs.map(d => ({id: d.id, ...d.data()}));
    
    console.log("\nAll Faculty mappings:");
    for (const f of allFac) {
        console.log("Faculty Doc ID:", f.id);
        const key = getField(f, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase();
        console.log("Mapped key:", key);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
