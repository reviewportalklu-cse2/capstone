import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

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

async function verifyDatabaseIntegrity() {
  console.log("===============================================================");
  console.log("   PHASE XXX — FIRESTORE DATABASE INTEGRITY AUDIT              ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (num, description, condition) => {
    if (condition) {
      console.log(`[PASS] Check ${num}: ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] Check ${num}: ${description}`);
      failed++;
    }
  };

  const [
    studentsSnap, teamsSnap, projectsSnap, guidesSnap, facultySnap, reviewersSnap,
    cyclesSnap, rubricsSnap, criteriaSnap, evalsSnap, userRolesSnap, usersSnap
  ] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'projects')),
    getDocs(collection(db, 'guides')),
    getDocs(collection(db, 'classroomFaculty')),
    getDocs(collection(db, 'reviewers')),
    getDocs(collection(db, 'reviewCycles')),
    getDocs(collection(db, 'rubrics')),
    getDocs(collection(db, 'rubricCriteria')),
    getDocs(collection(db, 'evaluations')),
    getDocs(collection(db, 'userRoles')),
    getDocs(collection(db, 'users'))
  ]);

  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const rubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const criteria = criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const evals = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const userRoles = userRolesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 1. Undefined IDs check
  let hasUndefinedId = false;
  evals.forEach(e => {
    if (!e.id || e.id === 'undefined' || e.teamId === 'undefined' || e.evaluatorId === 'undefined') {
      hasUndefinedId = true;
    }
  });
  assert(1, "No undefined IDs in evaluation documents", !hasUndefinedId);

  // 2. NaN check in evaluations
  let hasNaN = false;
  evals.forEach(e => {
    if (isNaN(Number(e.totalMarks || 0)) || isNaN(Number(e.score || 0))) {
      hasNaN = true;
    }
  });
  assert(2, "No NaN scores or marks in evaluations", !hasNaN);

  // 3. Orphan evaluations check
  const teamIds = new Set(teams.map(t => t.id));
  let orphanEvalCount = 0;
  evals.forEach(e => {
    if (e.teamId && !teamIds.has(e.teamId) && !teamIds.has('T' + e.teamId)) {
      orphanEvalCount++;
    }
  });
  assert(3, "No orphan evaluation documents referencing missing teams", orphanEvalCount === 0);

  // 4. Orphan rubric criteria check
  const rubricIds = new Set(rubrics.map(r => r.id));
  let orphanCriteriaCount = 0;
  criteria.forEach(c => {
    if (c.rubricId && !rubricIds.has(c.rubricId)) {
      orphanCriteriaCount++;
    }
  });
  assert(4, "No orphan criteria referencing missing rubrics", orphanCriteriaCount === 0);

  // 5. Duplicate evaluation documents check (same team + same role + same cycle)
  const evalKeys = new Set();
  let duplicateCount = 0;
  evals.forEach(e => {
    const key = `${e.teamId}_${e.role}_${e.reviewCycleId || e.cycleId}`;
    if (evalKeys.has(key)) {
      duplicateCount++;
    } else {
      evalKeys.add(key);
    }
  });
  assert(5, "No duplicate evaluation documents for same team, role, and review cycle", duplicateCount === 0);

  // 6. Timestamps validity check
  let invalidTimestampCount = 0;
  evals.forEach(e => {
    const ts = e.createdAt || e.updatedAt || e.submittedAt;
    if (ts && isNaN(Date.parse(ts))) {
      invalidTimestampCount++;
    }
  });
  assert(6, "All evaluation timestamps are valid ISO strings", invalidTimestampCount === 0);

  // 7. Role correctness check
  const validRoles = new Set(['guide', 'classroom_faculty', 'faculty', 'reviewer', 'admin']);
  let invalidRoleCount = 0;
  evals.forEach(e => {
    if (!validRoles.has(e.role)) {
      invalidRoleCount++;
    }
  });
  assert(7, "All evaluation documents have valid role property", invalidRoleCount === 0);

  // 8. Evaluator ID check
  let missingEvaluatorId = 0;
  evals.forEach(e => {
    if (!e.evaluatorId) missingEvaluatorId++;
  });
  assert(8, "All evaluation documents contain valid evaluatorId", missingEvaluatorId === 0);

  // 9. Team ID check
  let missingTeamId = 0;
  evals.forEach(e => {
    if (!e.teamId) missingTeamId++;
  });
  assert(9, "All evaluation documents contain valid teamId", missingTeamId === 0);

  // 10. Review Cycle ID check
  let missingCycleId = 0;
  evals.forEach(e => {
    if (!e.reviewCycleId && !e.reviewCycle && !e.cycleId) missingCycleId++;
  });
  assert(10, "All evaluation documents contain valid review cycle reference", missingCycleId === 0);

  console.log(`\n===============================================================`);
  console.log(` INTEGRITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  return { passed, failed };
}

verifyDatabaseIntegrity();
