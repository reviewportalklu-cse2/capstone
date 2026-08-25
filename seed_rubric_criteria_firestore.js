import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedRubricCriteria() {
  console.log("===============================================================");
  console.log("   SEEDING FIRESTORE STANDALONE RUBRIC CRITERIA COLLECTION     ");
  console.log("===============================================================\n");

  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const rubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const defaultCriteriaTemplates = [
    { criterionId: 'c1', criterionName: 'System Architecture & Technical Design', title: 'System Architecture & Technical Design', description: 'Depth of technical architecture, design patterns, and system modularity', maxMarks: 25, maximumMarks: 25, weight: 1.0, order: 1, displayOrder: 1 },
    { criterionId: 'c2', criterionName: 'Implementation & Code Quality', title: 'Implementation & Code Quality', description: 'Quality of implementation, working code, and repository organization', maxMarks: 25, maximumMarks: 25, weight: 1.0, order: 2, displayOrder: 2 },
    { criterionId: 'c3', criterionName: 'Presentation & Demonstration', title: 'Presentation & Demonstration', description: 'Live project demo execution, slide clarity, and technical delivery', maxMarks: 25, maximumMarks: 25, weight: 1.0, order: 3, displayOrder: 3 },
    { criterionId: 'c4', criterionName: 'Viva & Defense Q&A', title: 'Viva & Defense Q&A', description: 'Handling evaluator questions, conceptual understanding, and problem solving', maxMarks: 25, maximumMarks: 25, weight: 1.0, order: 4, displayOrder: 4 }
  ];

  let criteriaWritten = 0;
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const r of rubrics) {
    const rubricId = String(r.id || r.rubricId || r.title).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const embeddedCriteria = Array.isArray(r.criteria) && r.criteria.length > 0 ? r.criteria : defaultCriteriaTemplates;

    let rubricTotal = 0;

    embeddedCriteria.forEach((c, idx) => {
      const critId = String(c.criterionId || c.id || `c${idx+1}`).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `crit-${rubricId}-${critId}`;
      const maxMarks = Number(c.maxMarks || c.maximumMarks || 25);
      rubricTotal += maxMarks;

      const critData = {
        id: docId,
        criterionId: critId,
        rubricId,
        criterionName: c.criterionName || c.title || c.name || `Criterion ${idx+1}`,
        title: c.criterionName || c.title || c.name || `Criterion ${idx+1}`,
        description: c.description || '',
        maxMarks,
        maximumMarks: maxMarks,
        weight: Number(c.weight || c.weightage || 1.0),
        weightage: Number(c.weight || c.weightage || 1.0),
        order: idx + 1,
        displayOrder: idx + 1,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'rubricCriteria', docId), critData, { merge: true });
      criteriaWritten++;
    });

    // Update parent rubric totalMarks
    batch.set(doc(db, 'rubrics', r.id), { totalMarks: rubricTotal, updatedAt: now }, { merge: true });
  }

  await batch.commit();
  console.log(`Successfully populated ${criteriaWritten} criteria documents across ${rubrics.length} rubrics in Firestore!`);
}

seedRubricCriteria();
