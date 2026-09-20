import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';

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

async function cleanDuplicateAndEmptyRubrics() {
  console.log("=========================================================================");
  console.log("   CLEANING EMPTY DRAFT RUBRICS & RECONCILING PRODUCTION RUBRICS         ");
  console.log("=========================================================================\n");

  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const rubrics = rubricsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  const criteria = criteriaSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

  const canonicalReview1Id = "4DMaA7V8X1FkWgzdP2NF";
  const canonicalReview2Id = "mqb9hanow94qIOWCrItY";
  const canonicalReview3Id = "e8dDE2gKWbfLHZ0b0j8B";

  const canonicalIds = new Set([canonicalReview1Id, canonicalReview2Id, canonicalReview3Id]);

  let deletedRubricsCount = 0;
  let deletedCriteriaCount = 0;
  const batch = writeBatch(db);

  for (const r of rubrics) {
    const isCanonical = canonicalIds.has(r._id) || canonicalIds.has(r.id);
    const embeddedCount = Array.isArray(r.criteria) ? r.criteria.length : 0;
    const standaloneCount = criteria.filter(c => 
      String(c.rubricId).toLowerCase() === String(r._id).toLowerCase()
    ).length;

    // Delete empty draft rubrics created by test clicks
    if (!isCanonical && r.status === 'Draft' && r.title === 'New Evaluation Rubric') {
      console.log(`[DELETE DRAFT RUBRIC] ID: ${r._id} (Title: "${r.title}")`);
      batch.delete(doc(db, 'rubrics', r._id));
      deletedRubricsCount++;
    }
  }

  // Also clean any criteria that do not belong to the canonical published rubrics
  for (const c of criteria) {
    const cRubricId = String(c.rubricId || '');
    const isMatchingCanonical = canonicalIds.has(cRubricId) || 
      Array.from(canonicalIds).some(id => id.toLowerCase() === cRubricId.toLowerCase());

    if (!isMatchingCanonical) {
      console.log(`[DELETE NON-CANONICAL CRITERION] ID: ${c._id} (rubricId: "${c.rubricId}")`);
      batch.delete(doc(db, 'rubricCriteria', c._id));
      deletedCriteriaCount++;
    }
  }

  if (deletedRubricsCount > 0 || deletedCriteriaCount > 0) {
    await batch.commit();
    console.log(`\nSuccessfully deleted ${deletedRubricsCount} empty draft rubrics and ${deletedCriteriaCount} obsolete criteria.`);
  } else {
    console.log("\nNo empty draft rubrics or obsolete criteria to clean.");
  }

  process.exit(0);
}

cleanDuplicateAndEmptyRubrics().catch(err => {
  console.error("Error cleaning rubrics:", err);
  process.exit(1);
});
