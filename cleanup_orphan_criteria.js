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

async function cleanupOrphanCriteria() {
  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const rubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const rubricIds = new Set(rubrics.map(r => String(r.id || r.rubricId).toLowerCase()));

  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  const criteria = criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Total Rubrics: ${rubrics.length}`);
  console.log(`Total Criteria: ${criteria.length}`);

  let deletedCount = 0;
  const batch = writeBatch(db);

  criteria.forEach(c => {
    const cRubricId = String(c.rubricId || '').toLowerCase();
    if (!cRubricId || !rubricIds.has(cRubricId)) {
      console.log(`Deleting orphan criterion: ${c.id} (referenced rubricId: "${c.rubricId}")`);
      batch.delete(doc(db, 'rubricCriteria', c.id));
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`Successfully purged ${deletedCount} orphan criteria from Firestore!`);
  } else {
    console.log("No orphan criteria found.");
  }
}

cleanupOrphanCriteria();
