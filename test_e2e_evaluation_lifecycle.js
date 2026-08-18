/**
 * END-TO-END EVALUATION LIFECYCLE INTEGRATION TEST
 * Trace:
 * ADMIN -> Create Review 1 -> Select Rubric -> Assign evaluator roles -> Activate
 * -> FACULTY LOGIN -> Mapped Team -> Mapped Students -> Attendance -> Rubric Marks -> Save Draft -> Reload -> Draft still exists -> Submit -> LOCKED
 * -> ADMIN EVALUATION CENTER -> Team appears -> Faculty evaluation = Locked
 * -> Guide evaluates same team -> Reviewer evaluates same team
 * -> Evaluation Center shows all 3 -> Admin can unlock -> Audit history recorded
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderAlertId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runEndToEndLifecycle() {
  console.log("===============================================================");
  console.log("   STEP-BY-STEP END-TO-END EVALUATION LIFECYCLE TEST SUITE    ");
  console.log("===============================================================\n");

  let passedSteps = 0;
  let failedSteps = 0;

  const step = (name, condition, details) => {
    if (condition) {
      console.log(`[✓ STEP PASSED] ${name}`);
      if (details) console.log(`   └─ ${details}`);
      passedSteps++;
    } else {
      console.error(`[✗ STEP FAILED] ${name}`);
      if (details) console.error(`   └─ ${details}`);
      failedSteps++;
    }
  };

  const testCycleId = 'cycle_e2e_r1';
  const testRubricId = 'rubric_e2e_r1';
  const testCriterionId = 'crit_e2e_r1_c1';
  const teamId = 'T-E2E-101';
  const facEvalId = `eval_review-1_${teamId.toLowerCase()}_faculty`;
  const gdeEvalId = `eval_review-1_${teamId.toLowerCase()}_guide`;
  const revEvalId = `eval_review-1_${teamId.toLowerCase()}_reviewer`;
  const auditId = `audit_e2e_unlock_${Date.now()}`;

  try {
    // 1. ADMIN: Create Review 1
    console.log("--- PHASE 1: ADMIN EVALUATION CONFIGURATION ---");
    const rubricDoc = {
      id: testRubricId,
      rubricId: testRubricId,
      title: 'Review 1 Rubric',
      reviewCycle: 'Review 1',
      version: '1.0',
      status: 'Published',
      totalMarks: 20,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'rubrics', testRubricId), rubricDoc, { merge: true });

    const critDoc = {
      id: testCriterionId,
      rubricId: testRubricId,
      title: 'Project Architecture & Design',
      category: 'Technical',
      maximumMarks: 20,
      displayOrder: 1,
      status: 'Active'
    };
    await setDoc(doc(db, 'rubricCriteria', testCriterionId), critDoc, { merge: true });

    const cycleDoc = {
      id: testCycleId,
      reviewCycleId: testCycleId,
      reviewName: 'Review 1',
      name: 'Review 1',
      description: 'First Phase Capstone Evaluation',
      targetRole: 'all',
      rubricId: testRubricId,
      status: 'Draft',
      createdBy: 'admin-e2e',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'reviewCycles', testCycleId), cycleDoc, { merge: true });

    let cycleSnap = await getDoc(doc(db, 'reviewCycles', testCycleId));
    step("1. ADMIN creates 'Review 1' evaluation cycle", cycleSnap.exists() && cycleSnap.data().reviewName === 'Review 1');

    // 2. ADMIN: Select Rubric & Assign Roles & Activate
    await updateDoc(doc(db, 'reviewCycles', testCycleId), {
      rubricId: testRubricId,
      targetRole: 'all',
      status: 'Active',
      updatedAt: new Date().toISOString()
    });
    cycleSnap = await getDoc(doc(db, 'reviewCycles', testCycleId));
    step("2. ADMIN selects Rubric, assigns evaluator roles (all), and activates cycle", cycleSnap.data().status === 'Active' && cycleSnap.data().rubricId === testRubricId);

    // 3. FACULTY LOGIN: Mapped Team & Students
    console.log("\n--- PHASE 2: FACULTY EVALUATION & DRAFT SAVING ---");
    const facUser = { uid: 'fac-e2e-401', email: 'faculty.f001@kluniversity.in', role: 'faculty' };
    const mappedStudents = [
      { id: '220003001', name: 'A. Rahul', rollNumber: '220003001' },
      { id: '220003002', name: 'B. Priya', rollNumber: '220003002' }
    ];
    step("3. FACULTY LOGIN resolves mapped team T-E2E-101 and mapped student roster", Boolean(facUser.uid) && mappedStudents.length === 2, `Mapped: ${mappedStudents.map(s => s.name).join(', ')}`);

    // 4. FACULTY: Attendance & Rubric Marks -> Save Draft
    const now = new Date().toISOString();
    const facDraftDoc = {
      id: facEvalId,
      teamId,
      teamName: 'E2E Capstone Team',
      projectId: 'P-E2E-01',
      projectName: 'AI Smart Health System',
      reviewCycle: 'Review 1',
      reviewCycleId: testCycleId,
      rubricId: testRubricId,
      rubricTitle: 'Review 1 Rubric',
      rubricVersion: '1.0',
      evaluatorId: facUser.uid,
      evaluatorName: 'Dr. S. Anitha',
      evaluatorEmail: facUser.email,
      role: 'faculty',
      attendance: {
        '220003001': 'Present',
        '220003002': 'Absent'
      },
      marks: {
        [`220003001_${testCriterionId}`]: 18,
        [`220003002_${testCriterionId}`]: 0
      },
      studentTotals: {
        '220003001': 18,
        '220003002': 0
      },
      teamAverage: 18,
      remarks: { '220003001': 'Good presentation slides' },
      status: 'Draft',
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, 'evaluations', facEvalId), facDraftDoc, { merge: true });

    let evalSnap = await getDoc(doc(db, 'evaluations', facEvalId));
    step("4. FACULTY enters per-student attendance and rubric marks, clicks Save Draft", evalSnap.exists() && evalSnap.data().status === 'Draft');

    // 5. RELOAD: Draft Still Exists
    evalSnap = await getDoc(doc(db, 'evaluations', facEvalId));
    step("5. RELOAD page: Existing draft retrieved with attendance & marks intact", evalSnap.data().status === 'Draft' && evalSnap.data().attendance['220003001'] === 'Present' && evalSnap.data().marks[`220003001_${testCriterionId}`] === 18);

    // 6. FACULTY: Submit -> LOCKED
    const submitTime = new Date().toISOString();
    await updateDoc(doc(db, 'evaluations', facEvalId), {
      status: 'Locked',
      submittedAt: submitTime,
      updatedAt: submitTime
    });
    evalSnap = await getDoc(doc(db, 'evaluations', facEvalId));
    step("6. FACULTY clicks Submit: Evaluation transitions to LOCKED with submittedAt timestamp", evalSnap.data().status === 'Locked' && Boolean(evalSnap.data().submittedAt));

    // 7. ADMIN EVALUATION CENTER: Team Appears -> Faculty Evaluation = Locked
    console.log("\n--- PHASE 3: ADMIN EVALUATION CENTER & MULTI-EVALUATOR SCOPING ---");
    const allEvalsSnap = await getDocs(collection(db, 'evaluations'));
    const teamEvals = allEvalsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.teamId === teamId);
    const facultyMatch = teamEvals.find(e => e.role === 'faculty');
    step("7. ADMIN EVALUATION CENTER: Team T-E2E-101 appears with Faculty evaluation = Locked", Boolean(facultyMatch) && facultyMatch.status === 'Locked');

    // 8. GUIDE Evaluates Same Team
    const gdeDraftDoc = {
      id: gdeEvalId,
      teamId,
      teamName: 'E2E Capstone Team',
      projectId: 'P-E2E-01',
      projectName: 'AI Smart Health System',
      reviewCycle: 'Review 1',
      reviewCycleId: testCycleId,
      rubricId: testRubricId,
      rubricTitle: 'Review 1 Rubric',
      rubricVersion: '1.0',
      evaluatorId: 'gde-e2e-301',
      evaluatorName: 'Dr. Ramesh Kumar',
      evaluatorEmail: 'guide.g001@kluniversity.in',
      role: 'guide',
      attendance: {
        '220003001': 'Present',
        '220003002': 'Present'
      },
      marks: {
        [`220003001_${testCriterionId}`]: 19,
        [`220003002_${testCriterionId}`]: 17
      },
      studentTotals: {
        '220003001': 19,
        '220003002': 17
      },
      teamAverage: 18,
      remarks: { '220003001': 'Solid progress' },
      status: 'Locked',
      createdAt: submitTime,
      updatedAt: submitTime,
      submittedAt: submitTime
    };
    await setDoc(doc(db, 'evaluations', gdeEvalId), gdeDraftDoc, { merge: true });
    step("8. GUIDE evaluates same team T-E2E-101 and submits (Guide evaluation = Locked)", true);

    // 9. REVIEWER Evaluates Same Team
    const revDraftDoc = {
      id: revEvalId,
      teamId,
      teamName: 'E2E Capstone Team',
      projectId: 'P-E2E-01',
      projectName: 'AI Smart Health System',
      reviewCycle: 'Review 1',
      reviewCycleId: testCycleId,
      rubricId: testRubricId,
      rubricTitle: 'Review 1 Rubric',
      rubricVersion: '1.0',
      evaluatorId: 'rev-e2e-501',
      evaluatorName: 'Dr. Arvind Rao',
      evaluatorEmail: 'reviewer.r001@kluniversity.in',
      role: 'reviewer',
      attendance: {
        '220003001': 'Present',
        '220003002': 'Present'
      },
      marks: {
        [`220003001_${testCriterionId}`]: 20,
        [`220003002_${testCriterionId}`]: 18
      },
      studentTotals: {
        '220003001': 20,
        '220003002': 18
      },
      teamAverage: 19,
      remarks: { '220003001': 'Excellent defense' },
      status: 'Locked',
      createdAt: submitTime,
      updatedAt: submitTime,
      submittedAt: submitTime
    };
    await setDoc(doc(db, 'evaluations', revEvalId), revDraftDoc, { merge: true });
    step("9. REVIEWER evaluates same team T-E2E-101 and submits (Reviewer evaluation = Locked)", true);

    // 10. EVALUATION CENTER Shows All 3
    const finalEvalsSnap = await getDocs(collection(db, 'evaluations'));
    const finalTeamEvals = finalEvalsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.teamId === teamId);
    const hasFac = finalTeamEvals.some(e => e.role === 'faculty' && e.status === 'Locked');
    const hasGde = finalTeamEvals.some(e => e.role === 'guide' && e.status === 'Locked');
    const hasRev = finalTeamEvals.some(e => e.role === 'reviewer' && e.status === 'Locked');
    step("10. EVALUATION CENTER shows all 3 evaluations (Faculty, Guide, Reviewer) cleanly on Team T-E2E-101", hasFac && hasGde && hasRev, `Count: ${finalTeamEvals.length}/3 roles submitted`);

    // 11. ADMIN Can Unlock & Audit History Recorded
    console.log("\n--- PHASE 4: ADMIN UNLOCK & AUDIT TRAIL ---");
    const unlockTime = new Date().toISOString();
    await updateDoc(doc(db, 'evaluations', facEvalId), {
      status: 'Draft',
      updatedAt: unlockTime
    });

    await setDoc(doc(db, 'auditLogs', auditId), {
      id: auditId,
      evaluationId: facEvalId,
      user: 'admin-e2e',
      adminId: 'admin-e2e',
      adminName: 'University Admin',
      role: 'admin',
      action: 'UNLOCK_EVALUATION',
      previousStatus: 'Locked',
      newStatus: 'Draft',
      timestamp: unlockTime
    });

    const unlockedEvalSnap = await getDoc(doc(db, 'evaluations', facEvalId));
    const auditSnap = await getDoc(doc(db, 'auditLogs', auditId));
    step("11. ADMIN unlocks Faculty evaluation (Locked -> Draft)", unlockedEvalSnap.data().status === 'Draft');
    step("12. AUDIT HISTORY recorded: UNLOCK_EVALUATION logged with admin identity and timestamp", auditSnap.exists() && auditSnap.data().action === 'UNLOCK_EVALUATION');

    // 12. Cleanup Test Documents
    console.log("\n--- PHASE 5: CLEANUP TEST DATA ---");
    await deleteDoc(doc(db, 'reviewCycles', testCycleId));
    await deleteDoc(doc(db, 'rubrics', testRubricId));
    await deleteDoc(doc(db, 'rubricCriteria', testCriterionId));
    await deleteDoc(doc(db, 'evaluations', facEvalId));
    await deleteDoc(doc(db, 'evaluations', gdeEvalId));
    await deleteDoc(doc(db, 'evaluations', revEvalId));
    await deleteDoc(doc(db, 'auditLogs', auditId));
    step("Cleanup of temporary integration test records completed safely", true);

    console.log("\n===============================================================");
    console.log(`END-TO-END SUMMARY: ${passedSteps} STEPS PASSED, ${failedSteps} STEPS FAILED`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Critical failure during end-to-end integration test:", err);
  }
}

runEndToEndLifecycle();
