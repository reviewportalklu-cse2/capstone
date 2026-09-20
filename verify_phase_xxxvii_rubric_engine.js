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

async function verifyRubricEngine() {
  console.log("=========================================================================");
  console.log("   AUTOMATED VERIFICATION — PHASE XXXVII CAPSTONE RUBRIC ENGINE          ");
  console.log("=========================================================================\n");

  const results = [];
  const addResult = (testName, passed, details) => {
    results.push({ testName, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${details}`);
  };

  try {
    const rubricsSnap = await getDocs(collection(db, 'rubrics'));
    const rubrics = rubricsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

    const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
    const criteria = criteriaSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

    const evaluationsSnap = await getDocs(collection(db, 'evaluations'));
    const evaluations = evaluationsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

    // 1. Rubrics Count
    addResult(
      "1. Rubrics Count",
      rubrics.length >= 3,
      `Found ${rubrics.length} rubric document(s)`
    );

    // 2. Review 1 Rubric Configuration
    const r1Rubric = rubrics.find(r => String(r.reviewCycle).trim().toLowerCase() === 'review 1' && (r.status === 'Published' || r.status === 'Active'));
    const r1Criteria = r1Rubric ? criteria.filter(c => String(c.rubricId).toLowerCase() === String(r1Rubric._id || r1Rubric.id).toLowerCase()) : [];
    const r1Valid = r1Rubric && r1Rubric.totalMarks === 100 && (r1Criteria.length === 8 || (r1Rubric.criteria && r1Rubric.criteria.length === 8));
    addResult(
      "2. Review 1 Rubric Configuration",
      Boolean(r1Valid),
      r1Valid 
        ? `Review 1 rubric found (ID "${r1Rubric._id}", 100 Marks, 8 Criteria)` 
        : `Review 1 rubric invalid: ${r1Rubric ? `${r1Rubric.totalMarks} marks, ${r1Criteria.length} criteria` : 'Not found'}`
    );

    // 3. Review 2 Rubric Configuration
    const r2Rubric = rubrics.find(r => String(r.reviewCycle).trim().toLowerCase() === 'review 2' && (r.status === 'Published' || r.status === 'Active'));
    const r2Criteria = r2Rubric ? criteria.filter(c => String(c.rubricId).toLowerCase() === String(r2Rubric._id || r2Rubric.id).toLowerCase()) : [];
    const r2Valid = r2Rubric && r2Rubric.totalMarks === 100 && (r2Criteria.length === 8 || (r2Rubric.criteria && r2Rubric.criteria.length === 8));
    addResult(
      "3. Review 2 Rubric Configuration",
      Boolean(r2Valid),
      r2Valid 
        ? `Review 2 rubric found (ID "${r2Rubric._id}", 100 Marks, 8 Criteria)` 
        : `Review 2 rubric invalid: ${r2Rubric ? `${r2Rubric.totalMarks} marks, ${r2Criteria.length} criteria` : 'Not found'}`
    );

    // 4. Review 3 Rubric Configuration
    const r3Rubric = rubrics.find(r => String(r.reviewCycle).trim().toLowerCase() === 'review 3' && (r.status === 'Published' || r.status === 'Active'));
    const r3Criteria = r3Rubric ? criteria.filter(c => String(c.rubricId).toLowerCase() === String(r3Rubric._id || r3Rubric.id).toLowerCase()) : [];
    const r3Valid = r3Rubric && r3Rubric.totalMarks === 100 && (r3Criteria.length === 8 || (r3Rubric.criteria && r3Rubric.criteria.length === 8));
    addResult(
      "4. Review 3 / Final Defense Rubric Configuration",
      Boolean(r3Valid),
      r3Valid 
        ? `Review 3 rubric found (ID "${r3Rubric._id}", 100 Marks, 8 Criteria)` 
        : `Review 3 rubric invalid: ${r3Rubric ? `${r3Rubric.totalMarks} marks, ${r3Criteria.length} criteria` : 'Not found'}`
    );

    // 5. Each Totals Exactly 100
    const allTotalsHundred = [r1Rubric, r2Rubric, r3Rubric].every(r => r && r.totalMarks === 100);
    addResult(
      "5. All Canonical Rubrics Total Exactly 100",
      allTotalsHundred,
      allTotalsHundred ? "Review 1, 2, and 3 rubrics each total exactly 100 marks" : "Discrepancy in rubric total marks"
    );

    // 6. Criterion Rubric References
    const rubricIds = new Set();
    rubrics.forEach(r => {
      if (r._id) rubricIds.add(String(r._id).toLowerCase());
      if (r.id) rubricIds.add(String(r.id).toLowerCase());
      if (r.rubricId) rubricIds.add(String(r.rubricId).toLowerCase());
    });

    const validReferences = criteria.every(c => c.rubricId && rubricIds.has(String(c.rubricId).toLowerCase()));
    addResult(
      "6. Every rubricCriteria References a Valid Parent rubricId",
      validReferences,
      validReferences ? "All criteria reference valid parent rubric IDs" : "Found criteria referencing non-existent rubrics"
    );

    // 7. No Orphan Criteria
    const orphanCriteria = criteria.filter(c => !c.rubricId || !rubricIds.has(String(c.rubricId).toLowerCase()));
    addResult(
      "7. No Orphan Criteria",
      orphanCriteria.length === 0,
      orphanCriteria.length === 0 ? "Zero orphan criteria found" : `Found ${orphanCriteria.length} orphan criteria`
    );

    // 8. No Duplicate Rubrics per Review Cycle
    const cyclesCount = {};
    rubrics.filter(r => r.status === 'Published' || r.status === 'Active').forEach(r => {
      const cName = String(r.reviewCycle).trim().toLowerCase();
      cyclesCount[cName] = (cyclesCount[cName] || 0) + 1;
    });

    const noDuplicatePublishedRubrics = Object.values(cyclesCount).every(count => count === 1);
    addResult(
      "8. No Duplicate Published Rubrics per Cycle",
      noDuplicatePublishedRubrics,
      noDuplicatePublishedRubrics ? "Exactly 1 published rubric per review cycle" : "Found duplicate published rubrics for a review cycle"
    );

    // 9. No Undefined IDs
    const invalidRubricIds = rubrics.filter(r => !r._id);
    const invalidCriteriaIds = criteria.filter(c => !c._id);
    const noUndefinedIds = invalidRubricIds.length === 0 && invalidCriteriaIds.length === 0;
    addResult(
      "9. No Undefined Document IDs",
      noUndefinedIds,
      noUndefinedIds ? "All rubrics and criteria have defined document IDs" : "Found documents with undefined IDs"
    );

    // 10. No NaN maxMarks
    const invalidMarks = criteria.filter(c => {
      const m = Number(c.maximumMarks || c.maxMarks);
      return isNaN(m) || m < 0;
    });
    addResult(
      "10. No NaN or Negative maxMarks",
      invalidMarks.length === 0,
      invalidMarks.length === 0 ? "All maximumMarks are valid non-negative numbers" : `Found ${invalidMarks.length} invalid criteria marks`
    );

    const allPassed = results.every(r => r.passed);
    console.log("\n=========================================================================");
    console.log(`   SUMMARY: ${results.filter(r => r.passed).length} / ${results.length} CHECKS PASSED`);
    console.log("=========================================================================\n");

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error("Error verifying rubric engine:", err);
    process.exit(1);
  }
}

verifyRubricEngine();
