/**
 * PHASE XXVI THREE MISSING BULK UPLOADS VERIFICATION SUITE
 * Tests the 3 missing upload categories:
 * 1. Rubrics Upload & Firestore Sync
 * 2. Rubric Criteria Upload, Parent Rubric Validation & Recalculation
 * 3. Evaluation Schedule Upload, Date Normalization & Range Validation
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';

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

async function runThreeUploadsVerification() {
  console.log("===============================================================");
  console.log("   PHASE XXVI - THREE MISSING BULK UPLOADS VERIFICATION SUITE  ");
  console.log("===============================================================\n");

  const { syncService } = await import('./src/firebase/services/syncService.js');
  const { authService } = await import('./src/firebase/services/authService.js');

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

  try {
    // 1. Admin Auth
    const adminUser = await authService.login('admin@university.edu', 'Admin@123');
    assert(1, "Admin Auth Succeeded (UID: " + adminUser.uid + ")", Boolean(adminUser.uid));

    // 2. Test Rubrics Upload & Sync
    console.log("\n--- 1. TESTING RUBRICS UPLOAD ---");
    const testRubricId = `rubric_test_${Date.now()}`;
    const rubricRecords = [
      {
        rubricId: testRubricId,
        name: 'Evaluation 1 Master Rubric',
        version: '1.0',
        reviewCycle: 'Review 1',
        reviewCycleId: 'cycle-1',
        status: 'Published',
        totalMarks: '100',
        description: 'First evaluation rubric for Phase 1'
      }
    ];

    const rubRes = await syncService.syncRubrics(rubricRecords);
    assert(2, "syncRubrics executed without throwing exception", Boolean(rubRes));
    assert(3, "syncRubrics imported count = 1", rubRes.imported === 1);
    assert(4, "syncRubrics failed count = 0", rubRes.failed === 0);

    const rubDoc = await getDoc(doc(db, 'rubrics', testRubricId));
    assert(5, "Rubric document written to 'rubrics/" + testRubricId + "'", rubDoc.exists());
    assert(6, "Rubric document contains correct title and totalMarks (100)", rubDoc.exists() && rubDoc.data()?.totalMarks === 100 && !isNaN(rubDoc.data()?.totalMarks));
    assert(7, "Rubric document has NO undefined or NaN values", rubDoc.exists() && rubDoc.data()?.id !== 'undefined' && !isNaN(rubDoc.data()?.totalMarks));

    // 3. Test Rubric Criteria Upload, Parent Validation & Recalculation
    console.log("\n--- 2. TESTING RUBRIC CRITERIA UPLOAD & PARENT RECALCULATION ---");
    const criteriaRecords = [
      {
        rubricId: testRubricId,
        criterionId: 'C001',
        criterionName: 'Technical Implementation',
        description: 'Quality of implementation and architecture',
        maxMarks: '40',
        weight: '1.0',
        order: '1'
      },
      {
        rubricId: testRubricId,
        criterionId: 'C002',
        criterionName: 'System Demonstration',
        description: 'Working software demonstration and testing',
        maxMarks: '60',
        weight: '1.0',
        order: '2'
      }
    ];

    const critRes = await syncService.syncRubricCriteria(criteriaRecords);
    assert(8, "syncRubricCriteria executed without throwing exception", Boolean(critRes));
    assert(9, "syncRubricCriteria imported count = 2", critRes.imported === 2);
    assert(10, "syncRubricCriteria failed count = 0", critRes.failed === 0);

    const crit1Doc = await getDoc(doc(db, 'rubricCriteria', `crit-${testRubricId}-c001`));
    assert(11, "Criterion C001 written to 'rubricCriteria/crit-" + testRubricId + "-c001'", crit1Doc.exists());
    assert(12, "Criterion C001 maxMarks is numeric 40 (no NaN)", crit1Doc.exists() && crit1Doc.data()?.maxMarks === 40 && !isNaN(crit1Doc.data()?.maxMarks));

    // Verify parent rubric totalMarks recalculated to 40 + 60 = 100
    const updatedRubDoc = await getDoc(doc(db, 'rubrics', testRubricId));
    assert(13, "Parent Rubric totalMarks auto-recalculated to sum of criteria (100)", updatedRubDoc.exists() && updatedRubDoc.data()?.totalMarks === 100);

    // 4. Test Orphan Rubric Criteria Rejection
    console.log("\n--- 3. TESTING ORPHAN CRITERIA REJECTION ---");
    const orphanRecords = [
      {
        rubricId: 'RUBRIC_NON_EXISTENT_9999',
        criterionId: 'C999',
        criterionName: 'Orphan Criterion',
        description: 'Test orphan rejection',
        maxMarks: '50',
        weight: '1.0',
        order: '1'
      }
    ];

    const orphanRes = await syncService.syncRubricCriteria(orphanRecords);
    assert(14, "Orphan criterion rejected (imported = 0, failed = 1)", orphanRes.imported === 0 && orphanRes.failed === 1);
    assert(15, "Explicit error message returned for non-existent parent rubric", orphanRes.errors.some(e => e.includes('RUBRIC_NON_EXISTENT_9999')));

    // 5. Test Evaluation Schedule Upload & Date Validation
    console.log("\n--- 4. TESTING EVALUATION SCHEDULE UPLOAD & DATE VALIDATION ---");
    const testCycleId = `cycle_test_${Date.now()}`;
    const scheduleRecords = [
      {
        reviewCycleId: testCycleId,
        reviewCycle: 'Review 1',
        name: 'Evaluation 1',
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        status: 'Active',
        evaluationType: 'Project Review',
        description: 'First evaluation schedule test'
      }
    ];

    const schedRes = await syncService.syncEvaluationSchedule(scheduleRecords);
    assert(16, "syncEvaluationSchedule executed without throwing exception", Boolean(schedRes));
    assert(17, "syncEvaluationSchedule imported count = 1", schedRes.imported === 1);
    assert(18, "syncEvaluationSchedule failed count = 0", schedRes.failed === 0);

    const cycleDoc = await getDoc(doc(db, 'reviewCycles', testCycleId));
    assert(19, "Review cycle document written to 'reviewCycles/" + testCycleId + "'", cycleDoc.exists());
    assert(20, "Review cycle contains correct startDate ('2026-09-01') and endDate ('2026-09-07')", cycleDoc.exists() && cycleDoc.data()?.startDate === '2026-09-01' && cycleDoc.data()?.endDate === '2026-09-07');

    // 6. Test Invalid Date Range Rejection (Start Date >= End Date)
    console.log("\n--- 5. TESTING INVALID DATE RANGE REJECTION ---");
    const invalidScheduleRecords = [
      {
        reviewCycleId: 'cycle_invalid_dates',
        reviewCycle: 'Review Invalid',
        name: 'Invalid Schedule',
        startDate: '2026-09-20',
        endDate: '2026-09-10',
        status: 'Active'
      }
    ];

    const invalidSchedRes = await syncService.syncEvaluationSchedule(invalidScheduleRecords);
    assert(21, "Invalid date range rejected (imported = 0, failed = 1)", invalidSchedRes.imported === 0 && invalidSchedRes.failed === 1);
    assert(22, "Explicit error message returned for start date after end date", invalidSchedRes.errors.some(e => e.includes('Start Date')));

    // Cleanup test documents safely
    await deleteDoc(doc(db, 'rubrics', testRubricId));
    await deleteDoc(doc(db, 'rubricCriteria', `crit-${testRubricId}-c001`));
    await deleteDoc(doc(db, 'rubricCriteria', `crit-${testRubricId}-c002`));
    await deleteDoc(doc(db, 'reviewCycles', testCycleId));
    console.log("\n  Cleaned up temporary test documents safely.");

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

    process.exit(failed === 0 ? 0 : 1);

  } catch (err) {
    console.error("Critical failure during verify_phase_xxvi_three_missing_uploads:", err);
    process.exit(1);
  }
}

runThreeUploadsVerification();
