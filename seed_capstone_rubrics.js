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

const REVIEW_RUBRICS_CONFIG = [
  {
    reviewCycle: 'Review 1',
    title: 'Review 1 Evaluation Rubric',
    version: '1.0',
    status: 'Published',
    academicYear: '2026',
    semester: 'Odd',
    department: 'CSE',
    criteria: [
      { id: 'crit_r1_1', criterionId: 'r1_1', title: 'Problem Definition & Understanding', criterionName: 'Problem Definition & Understanding', description: 'Clarity of project scope, problem statement, and understanding.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 1, order: 1 },
      { id: 'crit_r1_2', criterionId: 'r1_2', title: 'Literature Survey / Existing System Analysis', criterionName: 'Literature Survey / Existing System Analysis', description: 'Analysis of existing literature, baseline papers, and current solutions.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 2, order: 2 },
      { id: 'crit_r1_3', criterionId: 'r1_3', title: 'Proposed Solution & Methodology', criterionName: 'Proposed Solution & Methodology', description: 'Novelty, clarity, and feasibility of proposed solution and technical methodology.', maximumMarks: 15, maxMarks: 15, weight: 1.0, displayOrder: 3, order: 3 },
      { id: 'crit_r1_4', criterionId: 'r1_4', title: 'Technical Implementation / Development Progress', criterionName: 'Technical Implementation / Development Progress', description: 'Technical depth, codebase progress, modules completed, and implementation quality.', maximumMarks: 25, maxMarks: 25, weight: 1.0, displayOrder: 4, order: 4 },
      { id: 'crit_r1_5', criterionId: 'r1_5', title: 'Project Architecture & Design', criterionName: 'Project Architecture & Design', description: 'System architecture, ER diagrams, data flow, component design, and tech stack selection.', maximumMarks: 15, maxMarks: 15, weight: 1.0, displayOrder: 5, order: 5 },
      { id: 'crit_r1_6', criterionId: 'r1_6', title: 'Innovation / Technical Contribution', criterionName: 'Innovation / Technical Contribution', description: 'Original contribution, technical complexity, algorithm design, or innovative approach.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 6, order: 6 },
      { id: 'crit_r1_7', criterionId: 'r1_7', title: 'Team Contribution & Collaboration', criterionName: 'Team Contribution & Collaboration', description: 'Sprint coordination, Git commits, peer collaboration, and task division.', maximumMarks: 5, maxMarks: 5, weight: 1.0, displayOrder: 7, order: 7 },
      { id: 'crit_r1_8', criterionId: 'r1_8', title: 'Documentation & Presentation', criterionName: 'Documentation & Presentation', description: 'Presentation slides, report quality, technical delivery, and response to questions.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 8, order: 8 }
    ]
  },
  {
    reviewCycle: 'Review 2',
    title: 'Review 2 Evaluation Rubric',
    version: '1.0',
    status: 'Published',
    academicYear: '2026',
    semester: 'Odd',
    department: 'CSE',
    criteria: [
      { id: 'crit_r2_1', criterionId: 'r2_1', title: 'Project Progress Since Previous Review', criterionName: 'Project Progress Since Previous Review', description: 'Progress made since Review 1, milestone completion, and feedback resolution.', maximumMarks: 15, maxMarks: 15, weight: 1.0, displayOrder: 1, order: 1 },
      { id: 'crit_r2_2', criterionId: 'r2_2', title: 'Technical Implementation', criterionName: 'Technical Implementation', description: 'Backend APIs, frontend components, database integration, and core logic completion.', maximumMarks: 25, maxMarks: 25, weight: 1.0, displayOrder: 2, order: 2 },
      { id: 'crit_r2_3', criterionId: 'r2_3', title: 'Functionality & Working Prototype', criterionName: 'Functionality & Working Prototype', description: 'Live execution, prototype working status, UI/UX interaction, and module integration.', maximumMarks: 20, maxMarks: 20, weight: 1.0, displayOrder: 3, order: 3 },
      { id: 'crit_r2_4', criterionId: 'r2_4', title: 'Testing & Validation', criterionName: 'Testing & Validation', description: 'Test cases, unit testing, performance validation, and bug fixing.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 4, order: 4 },
      { id: 'crit_r2_5', criterionId: 'r2_5', title: 'Code Quality / Architecture', criterionName: 'Code Quality / Architecture', description: 'Clean code practices, modular design, security measures, and version control hygiene.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 5, order: 5 },
      { id: 'crit_r2_6', criterionId: 'r2_6', title: 'Documentation', criterionName: 'Documentation', description: 'Interim project report, API documentation, and setup instructions.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 6, order: 6 },
      { id: 'crit_r2_7', criterionId: 'r2_7', title: 'Team Contribution', criterionName: 'Team Contribution', description: 'Individual effort distribution, task completion, and team teamwork.', maximumMarks: 5, maxMarks: 5, weight: 1.0, displayOrder: 7, order: 7 },
      { id: 'crit_r2_8', criterionId: 'r2_8', title: 'Presentation & Explanation', criterionName: 'Presentation & Explanation', description: 'Slide clarity, oral defense, and technical explanation of implemented features.', maximumMarks: 5, maxMarks: 5, weight: 1.0, displayOrder: 8, order: 8 }
    ]
  },
  {
    reviewCycle: 'Review 3',
    title: 'Review 3 / Final Defense Evaluation Rubric',
    version: '1.0',
    status: 'Published',
    academicYear: '2026',
    semester: 'Odd',
    department: 'CSE',
    criteria: [
      { id: 'crit_r3_1', criterionId: 'r3_1', title: 'Problem Understanding', criterionName: 'Problem Understanding', description: 'Overall domain understanding, problem relevance, and final solution impact.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 1, order: 1 },
      { id: 'crit_r3_2', criterionId: 'r3_2', title: 'Technical Implementation', criterionName: 'Technical Implementation', description: 'Completeness of full system implementation, technical complexity, and production readiness.', maximumMarks: 20, maxMarks: 20, weight: 1.0, displayOrder: 2, order: 2 },
      { id: 'crit_r3_3', criterionId: 'r3_3', title: 'System Functionality', criterionName: 'System Functionality', description: 'End-to-end working system demonstration, zero critical bugs, and complete user flows.', maximumMarks: 20, maxMarks: 20, weight: 1.0, displayOrder: 3, order: 3 },
      { id: 'crit_r3_4', criterionId: 'r3_4', title: 'Innovation / Technical Contribution', criterionName: 'Innovation / Technical Contribution', description: 'Research value, publication potential, algorithm novelty, or technical innovation.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 4, order: 4 },
      { id: 'crit_r3_5', criterionId: 'r3_5', title: 'Testing & Results', criterionName: 'Testing & Results', description: 'Comprehensive testing results, metric evaluations, benchmark comparisons, and graphs.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 5, order: 5 },
      { id: 'crit_r3_6', criterionId: 'r3_6', title: 'Documentation', criterionName: 'Documentation', description: 'Final comprehensive project report, IEEE paper format adherence, and user manual.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 6, order: 6 },
      { id: 'crit_r3_7', criterionId: 'r3_7', title: 'Individual Contribution', criterionName: 'Individual Contribution', description: 'Individual technical contribution, Q&A mastery, and ownership of specific modules.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 7, order: 7 },
      { id: 'crit_r3_8', criterionId: 'r3_8', title: 'Final Presentation & Viva', criterionName: 'Final Presentation & Viva', description: 'Final defense presentation, technical viva response, and evaluator Q&A handling.', maximumMarks: 10, maxMarks: 10, weight: 1.0, displayOrder: 8, order: 8 }
    ]
  }
];

async function seedCapstoneRubrics() {
  console.log("=========================================================================");
  console.log("   SEEDING / CONFIGURING FIRESTORE CAPSTONE EVALUATION RUBRICS & CRITERIA");
  console.log("=========================================================================\n");

  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const existingRubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  const existingCriteria = criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const config of REVIEW_RUBRICS_CONFIG) {
    // Check if equivalent rubric already exists for this reviewCycle
    let rubricDoc = existingRubrics.find(r => 
      String(r.reviewCycle || '').trim().toLowerCase() === config.reviewCycle.toLowerCase()
    );

    let rubricId;
    const calculatedTotalMarks = config.criteria.reduce((sum, c) => sum + c.maximumMarks, 0);

    if (rubricDoc) {
      rubricId = rubricDoc.id;
      console.log(`[FOUND] Existing Rubric for ${config.reviewCycle}: ID ${rubricId}`);
      batch.update(doc(db, 'rubrics', rubricId), {
        title: config.title,
        reviewCycle: config.reviewCycle,
        version: config.version,
        status: 'Published',
        academicYear: config.academicYear,
        semester: config.semester,
        department: config.department,
        totalMarks: calculatedTotalMarks,
        criteria: config.criteria.map(c => ({
          ...c,
          rubricId
        })),
        updatedAt: now
      });
    } else {
      const newRef = doc(collection(db, 'rubrics'));
      rubricId = newRef.id;
      console.log(`[CREATE] New Published Rubric for ${config.reviewCycle}: ID ${rubricId}`);
      batch.set(newRef, {
        id: rubricId,
        rubricId,
        title: config.title,
        reviewCycle: config.reviewCycle,
        version: config.version,
        status: 'Published',
        academicYear: config.academicYear,
        semester: config.semester,
        department: config.department,
        totalMarks: calculatedTotalMarks,
        criteria: config.criteria.map(c => ({
          ...c,
          rubricId
        })),
        createdAt: now,
        updatedAt: now
      });
    }

    // Write criteria to rubricCriteria collection
    const currentValidCritDocIds = new Set();

    config.criteria.forEach((c, idx) => {
      const critDocId = `crit_${rubricId}_${c.criterionId}`;
      currentValidCritDocIds.add(critDocId);

      const critPayload = {
        id: critDocId,
        criterionId: c.criterionId,
        rubricId: rubricId,
        criterionName: c.criterionName,
        title: c.title,
        description: c.description,
        maxMarks: c.maximumMarks,
        maximumMarks: c.maximumMarks,
        weight: c.weight || 1.0,
        weightage: c.weight || 1.0,
        order: idx + 1,
        displayOrder: idx + 1,
        status: 'Active',
        updatedAt: now
      };

      // Set createdAt if new
      const existingCrit = existingCriteria.find(ec => ec.id === critDocId);
      if (!existingCrit) {
        critPayload.createdAt = now;
      }

      batch.set(doc(db, 'rubricCriteria', critDocId), critPayload, { merge: true });
    });

    // Clean up old orphan criteria for this rubricId in rubricCriteria collection
    const oldCriteriaForRubric = existingCriteria.filter(ec => String(ec.rubricId).toLowerCase() === String(rubricId).toLowerCase());
    for (const oldCrit of oldCriteriaForRubric) {
      if (!currentValidCritDocIds.has(oldCrit.id)) {
        console.log(`[DELETE] Orphan Criterion ${oldCrit.id} for Rubric ${rubricId}`);
        batch.delete(doc(db, 'rubricCriteria', oldCrit.id));
      }
    }
  }

  await batch.commit();
  console.log("\n=========================================================================");
  console.log("   FIRESTORE CAPSTONE RUBRICS & CRITERIA SUCCESSFULLY CONFIGURED!       ");
  console.log("=========================================================================\n");
  process.exit(0);
}

seedCapstoneRubrics().catch(err => {
  console.error("Error seeding capstone rubrics:", err);
  process.exit(1);
});
