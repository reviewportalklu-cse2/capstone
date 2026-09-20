import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function inspectRubricsAndCriteria() {
  console.log("===============================================================");
  console.log("   INSPECTING ALL RUBRICS & RUBRIC CRITERIA IN FIRESTORE       ");
  console.log("===============================================================\n");

  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const rubrics = rubricsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  const criteria = criteriaSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

  console.log(`--- RUBRICS COLLECTION (${rubrics.length} docs) ---`);
  rubrics.forEach(r => {
    const critCount = Array.isArray(r.criteria) ? r.criteria.length : 0;
    const standaloneCrit = criteria.filter(c => 
      String(c.rubricId).toLowerCase() === String(r._id).toLowerCase() ||
      String(c.rubricId).toLowerCase() === String(r.id).toLowerCase() ||
      String(c.rubricId).toLowerCase() === String(r.rubricId).toLowerCase()
    ).length;

    console.log(`Doc ID: "${r._id}" | r.id: "${r.id}" | r.rubricId: "${r.rubricId}" | Title: "${r.title}" | Cycle: "${r.reviewCycle}" | Status: "${r.status}" | TotalMarks: ${r.totalMarks} | EmbeddedCrit: ${critCount} | StandaloneCrit: ${standaloneCrit}`);
  });

  console.log("\n--- CRITERIA DOCUMENTS SAMPLE ---");
  criteria.slice(0, 15).forEach(c => {
    console.log(`Crit Doc ID: "${c._id}" | rubricId: "${c.rubricId}" | criterionId: "${c.criterionId}" | Title: "${c.title || c.criterionName}" | MaxMarks: ${c.maximumMarks || c.maxMarks} | Order: ${c.displayOrder || c.order}`);
  });

  process.exit(0);
}

inspectRubricsAndCriteria().catch(err => {
  console.error("Error inspecting rubrics:", err);
  process.exit(1);
});
