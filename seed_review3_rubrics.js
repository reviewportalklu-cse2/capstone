import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

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

async function seedReview3Rubrics() {
  console.log("===============================================================");
  console.log("   UPDATING REVIEW 3 EVALUATION RUBRIC & SEEDING PROTOTYPE RUBRIC");
  console.log("===============================================================\n");

  const now = new Date().toISOString();

  // 1. Check existing criteria for e8dDE2gKWbfLHZ0b0j8B and remove old criteria
  const rubricAId = "e8dDE2gKWbfLHZ0b0j8B";
  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  for (const cDoc of criteriaSnap.docs) {
    const data = cDoc.data();
    if (String(data.rubricId).toLowerCase() === rubricAId.toLowerCase()) {
      console.log(`Deleting old criterion ${cDoc.id} for Rubric A...`);
      await deleteDoc(doc(db, 'rubricCriteria', cDoc.id));
    }
  }

  // 2. Define Criteria for Rubric A
  const rubricACriteria = [
    {
      criterionId: "r3_eval_1",
      name: "Completed System Functionality",
      title: "Completed System Functionality",
      description: "End-to-end completed system functionality and operational features.",
      maxMarks: 20,
      maximumMarks: 20,
      order: 1,
      displayOrder: 1
    },
    {
      criterionId: "r3_eval_2",
      name: "Testing & Performance Evaluation",
      title: "Testing & Performance Evaluation",
      description: "Rigorous testing methodologies, benchmarking, and performance analysis.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 2,
      displayOrder: 2
    },
    {
      criterionId: "r3_eval_3",
      name: "Real-world Application & Domain Impact",
      title: "Real-world Application & Domain Impact",
      description: "Practical deployment viability, user problem solving, and domain value.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 3,
      displayOrder: 3
    },
    {
      criterionId: "r3_eval_4",
      name: "Reflection, Learning & Future Scope",
      title: "Reflection, Learning & Future Scope",
      description: "Project retrospection, engineering lessons learned, and future enhancements.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 4,
      displayOrder: 4
    }
  ];

  const rubricAPayloadCriteria = [];
  for (const c of rubricACriteria) {
    const critDocId = `crit_${rubricAId}_${c.criterionId}`;
    const critData = {
      id: critDocId,
      criterionId: c.criterionId,
      rubricId: rubricAId,
      reviewCycleId: "Review 3",
      name: c.name,
      title: c.title,
      criterionName: c.name,
      description: c.description,
      maxMarks: c.maxMarks,
      maximumMarks: c.maximumMarks,
      order: c.order,
      displayOrder: c.displayOrder,
      category: "Technical",
      weight: 1.0,
      weightage: 1.0,
      status: "Active",
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, 'rubricCriteria', critDocId), critData);
    rubricAPayloadCriteria.push(critData);
    console.log(`Saved Criterion for Rubric A: ${critDocId}`);
  }

  // Save Rubric A parent doc
  await setDoc(doc(db, 'rubrics', rubricAId), {
    id: rubricAId,
    rubricId: rubricAId,
    reviewCycleId: "Review 3",
    reviewCycle: "Review 3",
    title: "Review 3 Evaluation Rubric",
    version: "1.0",
    status: "Published",
    totalMarks: 50,
    department: "CSE",
    academicYear: "2026",
    semester: "Odd",
    criteria: rubricAPayloadCriteria,
    createdAt: now,
    updatedAt: now
  }, { merge: true });
  console.log(`Updated Rubric A (${rubricAId}) to 50 marks, 4 criteria.`);

  // 3. Define Rubric B — Prototype Rubric
  const rubricBId = "rubric_prototype_review3";

  // Check if any old criteria for rubricBId exist
  for (const cDoc of criteriaSnap.docs) {
    const data = cDoc.data();
    if (String(data.rubricId).toLowerCase() === rubricBId.toLowerCase()) {
      console.log(`Deleting old criterion ${cDoc.id} for Rubric B...`);
      await deleteDoc(doc(db, 'rubricCriteria', cDoc.id));
    }
  }

  const rubricBCriteria = [
    {
      criterionId: "r3_proto_1",
      name: "Prototype Functionality & Live Integration",
      title: "Prototype Functionality & Live Integration",
      description: "Live interactive prototype demonstration, frontend/backend integration, and feature execution.",
      maxMarks: 20,
      maximumMarks: 20,
      order: 1,
      displayOrder: 1
    },
    {
      criterionId: "r3_proto_2",
      name: "Innovation & Technical Implementation",
      title: "Innovation & Technical Implementation",
      description: "Architectural novelty, code sophistication, and technical problem-solving approach.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 2,
      displayOrder: 2
    },
    {
      criterionId: "r3_proto_3",
      name: "User Interface & Practical Utility",
      title: "User Interface & Practical Utility",
      description: "User experience design, responsiveness, intuitive workflows, and practical user utility.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 3,
      displayOrder: 3
    },
    {
      criterionId: "r3_proto_4",
      name: "Testing & Results Validation",
      title: "Testing & Results Validation",
      description: "Functional testing, user verification results, error handling, and performance metrics.",
      maxMarks: 10,
      maximumMarks: 10,
      order: 4,
      displayOrder: 4
    }
  ];

  const rubricBPayloadCriteria = [];
  for (const c of rubricBCriteria) {
    const critDocId = `crit_${rubricBId}_${c.criterionId}`;
    const critData = {
      id: critDocId,
      criterionId: c.criterionId,
      rubricId: rubricBId,
      reviewCycleId: "Review 3",
      name: c.name,
      title: c.title,
      criterionName: c.name,
      description: c.description,
      maxMarks: c.maxMarks,
      maximumMarks: c.maximumMarks,
      order: c.order,
      displayOrder: c.displayOrder,
      category: "Technical",
      weight: 1.0,
      weightage: 1.0,
      status: "Active",
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, 'rubricCriteria', critDocId), critData);
    rubricBPayloadCriteria.push(critData);
    console.log(`Saved Criterion for Rubric B: ${critDocId}`);
  }

  // Save Rubric B parent doc
  await setDoc(doc(db, 'rubrics', rubricBId), {
    id: rubricBId,
    rubricId: rubricBId,
    reviewCycleId: "Review 3",
    reviewCycle: "Review 3",
    title: "Prototype Rubric",
    version: "1.0",
    status: "Published",
    totalMarks: 50,
    department: "CSE",
    academicYear: "2026",
    semester: "Odd",
    criteria: rubricBPayloadCriteria,
    createdAt: now,
    updatedAt: now
  });
  console.log(`Created Rubric B (${rubricBId}) with 50 marks, 4 criteria.`);

  console.log("\nReview 3 Rubrics Seeding Complete!");
  process.exit(0);
}

seedReview3Rubrics().catch(err => {
  console.error("Error seeding rubrics:", err);
  process.exit(1);
});
