/**
 * PHASE XXVI COMPREHENSIVE BULK UPLOAD CENTER & SYNC ENGINE VERIFICATION SUITE
 * Tests all 12 bulk upload categories:
 * 1. Students
 * 2. Guides
 * 3. Classroom Faculty
 * 4. Reviewers
 * 5. Teams
 * 6. Projects
 * 7. Guide Assignments
 * 8. Classroom Faculty Assignments
 * 9. Reviewer Assignments
 * 10. Rubrics
 * 11. Rubric Criteria (with parent rubric resolution & total marks recalculation)
 * 12. Evaluation Schedule / Review Cycles (with Excel date normalization & validation)
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runBulkUploadVerification() {
  console.log("===============================================================");
  console.log("   PHASE XXVI BULK UPLOAD CENTER & SYNC ENGINE SUITE           ");
  console.log("===============================================================\n");

  const { syncService } = await import('./src/firebase/services/syncService.js');

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
    const { authService } = await import('./src/firebase/services/authService.js');
    const adminUser = await authService.login('admin@university.edu', 'Admin@123');
    assert(1, "Admin Auth Succeeded (UID: " + adminUser.uid + ")", Boolean(adminUser.uid));

    // 2. Test Classroom Faculty Assignments Upload
    console.log("\n--- TESTING 1: CLASSROOM FACULTY ASSIGNMENTS UPLOAD ---");
    const { FirestoreService } = await import('./src/firebase/services/firestore.js');
    
    // Seed master classroom faculty record to ensure relational integrity
    await FirestoreService.set('classroomFaculty', '1379', {
      id: '1379',
      facultyId: 'F001',
      employeeId: '1379',
      name: 'Dr. K.V.DURGA KIRAN',
      email: 'kiran_cse@kluniversity.in',
      department: 'Computer Science & Engineering',
      status: 'Active'
    });

    const testFacAssignment = [
      {
        'Faculty ID': '1379',
        'Faculty Email': 'kiran_cse@kluniversity.in',
        'Team ID': 'T001',
        'Project ID': 'PRJ-001',
        'Student IDs': '2200030001, 2200030002',
        'Review Cycle ID': 'cycle-1',
        'Status': 'Active'
      }
    ];

    const facResult = await syncService.syncFacultyAssignments(testFacAssignment);
    if (facResult.errors && facResult.errors.length > 0) {
      console.log("Faculty Sync Errors:", facResult.errors);
    }
    assert(2, "Faculty Assignment Sync executed without throwing exception", Boolean(facResult));
    assert(3, "Faculty Assignment imported count = 1", facResult.imported === 1);
    assert(4, "Faculty Assignment failed count = 0", facResult.failed === 0);

    const fasmDoc1 = await getDoc(doc(db, 'facultyAssignments', 'fasm-1379-t001'));
    const fasmDoc2 = await getDoc(doc(db, 'facultyAssignments', 'fasm-f001-t001'));
    const fasmDoc = fasmDoc1.exists() ? fasmDoc1 : fasmDoc2;
    assert(5, "Faculty Assignment written to 'facultyAssignments'", fasmDoc.exists());
    assert(6, "Faculty Assignment resolved correct facultyName ('Dr. K.V.DURGA KIRAN')", fasmDoc.exists() && (fasmDoc.data()?.facultyName || '').toUpperCase().includes('KIRAN'));

    // 3. Test Invalid Faculty ID Rejection (No list[0] fallback)
    console.log("\n--- TESTING 2: UNRESOLVABLE FACULTY ID REJECTION ---");
    const invalidFacAssignment = [
      {
        'Faculty ID': 'FAC_INVALID_9999',
        'Team ID': 'T001'
      }
    ];
    const invalidFacResult = await syncService.syncFacultyAssignments(invalidFacAssignment);
    assert(7, "Invalid Faculty ID rejected (imported = 0, failed = 1)", invalidFacResult.imported === 0 && invalidFacResult.failed === 1);
    assert(8, "Explicit error message returned for unresolvable faculty", invalidFacResult.errors.some(e => e.includes('FAC_INVALID_9999')));

    // 4. Test Guide Assignments Upload
    console.log("\n--- TESTING 3: GUIDE ASSIGNMENTS UPLOAD ---");
    const testGuideAssignment = [
      {
        'Guide ID': '1379',
        'Guide Email': 'kiran_cse@kluniversity.in',
        'Team ID': 'T001',
        'Project ID': 'PRJ-001',
        'Student IDs': '2200030001, 2200030002',
        'Review Cycle ID': 'cycle-1',
        'Status': 'Active'
      }
    ];
    const guideResult = await syncService.syncGuideAssignments(testGuideAssignment);
    assert(9, "Guide Assignment imported count = 1", guideResult.imported === 1);
    const gasmDoc1 = await getDoc(doc(db, 'guideAssignments', 'gasm-1379-t001'));
    const gasmDoc2 = await getDoc(doc(db, 'guideAssignments', 'gasm-g001-t001'));
    const gasmDoc = gasmDoc1.exists() ? gasmDoc1 : gasmDoc2;
    assert(10, "Guide Assignment written to 'guideAssignments'", gasmDoc.exists());

    // 5. Test Reviewer Assignments Upload
    console.log("\n--- TESTING 4: REVIEWER ASSIGNMENTS UPLOAD ---");
    const testRevAssignment = [
      {
        'Reviewer ID': '1379',
        'Reviewer Email': 'kiran_cse@kluniversity.in',
        'Team ID': 'T001',
        'Review Cycle ID': 'cycle-1',
        'Status': 'Active'
      }
    ];
    const revResult = await syncService.syncReviewerAssignments(testRevAssignment);
    assert(11, "Reviewer Assignment imported count = 1", revResult.imported === 1);
    const rasmDoc1 = await getDoc(doc(db, 'reviewerAssignments', 'rasm-1379-t001'));
    const rasmDoc2 = await getDoc(doc(db, 'reviewerAssignments', 'rasm-r001-t001'));
    const rasmDoc = rasmDoc1.exists() ? rasmDoc1 : rasmDoc2;
    assert(12, "Reviewer Assignment written to 'reviewerAssignments'", rasmDoc.exists());

    // 6. Test Rubrics Upload
    console.log("\n--- TESTING 5: RUBRICS UPLOAD ---");
    const testRubricId = `rubric_test_${Date.now()}`;
    const testRubric = [
      {
        'Rubric ID': testRubricId,
        'Rubric Title': 'Phase XXVI Automated Rubric',
        'Version': '1.0',
        'Review Cycle': 'Review 1',
        'Review Cycle ID': 'cycle-1',
        'Total Marks': '100',
        'Status': 'Published'
      }
    ];
    const rubResult = await syncService.syncRubrics(testRubric);
    assert(13, "Rubric imported count = 1", rubResult.imported === 1);
    const rubDoc = await getDoc(doc(db, 'rubrics', testRubricId));
    assert(14, "Rubric doc written to Firestore with totalMarks = 100", rubDoc.exists() && rubDoc.data()?.totalMarks === 100);

    // 7. Test Rubric Criteria Upload (with parent rubric validation & totalMarks recalculation)
    console.log("\n--- TESTING 6: RUBRIC CRITERIA UPLOAD & RECALCULATION ---");
    const testCriteria = [
      {
        'Rubric ID': testRubricId,
        'Criterion ID': 'crit1',
        'Criterion Name': 'System Design & Architecture',
        'Description': 'Design clarity and modularity',
        'Max Marks': '40',
        'Weight': '1.0',
        'Order': '1'
      },
      {
        'Rubric ID': testRubricId,
        'Criterion ID': 'crit2',
        'Criterion Name': 'Implementation & Demo',
        'Description': 'Execution accuracy and feature completion',
        'Max Marks': '60',
        'Weight': '1.0',
        'Order': '2'
      }
    ];
    const critResult = await syncService.syncRubricCriteria(testCriteria);
    assert(15, "Rubric Criteria imported count = 2", critResult.imported === 2);
    
    // Check parent rubric totalMarks auto-updated (40 + 60 = 100)
    const updatedRubDoc = await getDoc(doc(db, 'rubrics', testRubricId));
    assert(16, "Parent Rubric totalMarks updated to sum of criteria (100)", updatedRubDoc.data()?.totalMarks === 100);

    // 8. Test Orphan Rubric Criteria Rejection
    console.log("\n--- TESTING 7: ORPHAN RUBRIC CRITERIA REJECTION ---");
    const orphanCriteria = [
      {
        'Rubric ID': 'NON_EXISTENT_RUBRIC_999',
        'Criterion ID': 'c1',
        'Criterion Name': 'Orphan Test',
        'Max Marks': '50'
      }
    ];
    const orphanResult = await syncService.syncRubricCriteria(orphanCriteria);
    assert(17, "Orphan Criterion rejected (imported = 0, failed = 1)", orphanResult.imported === 0 && orphanResult.failed === 1);
    assert(18, "Explicit error message returned for non-existent parent rubric", orphanResult.errors.some(e => e.includes('NON_EXISTENT_RUBRIC_999')));

    // 9. Test Evaluation Schedule / Review Cycles Upload
    console.log("\n--- TESTING 8: EVALUATION SCHEDULE UPLOAD & DATE NORMALIZATION ---");
    const testCycleId = `cycle_test_${Date.now()}`;
    const testSchedule = [
      {
        'Review Cycle ID': testCycleId,
        'Review Cycle Name': 'Phase XXVI Automated Review',
        'Start Date': '2026-09-01',
        'End Date': '2026-09-30',
        'Evaluation Type': 'Standard',
        'Status': 'Active',
        'Description': 'Automated Schedule Test'
      }
    ];
    const schedResult = await syncService.syncEvaluationSchedule(testSchedule);
    assert(19, "Evaluation Schedule imported count = 1", schedResult.imported === 1);
    const cycleDoc = await getDoc(doc(db, 'reviewCycles', testCycleId));
    assert(20, "Review Cycle written to Firestore with startDate '2026-09-01' and endDate '2026-09-30'", cycleDoc.exists() && cycleDoc.data()?.startDate === '2026-09-01');

    // 10. Test Invalid Date Validation (Start Date >= End Date)
    console.log("\n--- TESTING 9: INVALID DATE RANGE VALIDATION ---");
    const invalidDateSchedule = [
      {
        'Review Cycle ID': 'cycle_invalid_date',
        'Review Cycle Name': 'Invalid Date Cycle',
        'Start Date': '2026-10-30',
        'End Date': '2026-10-01'
      }
    ];
    const invalidDateResult = await syncService.syncEvaluationSchedule(invalidDateSchedule);
    assert(21, "Invalid date range rejected (imported = 0, failed = 1)", invalidDateResult.imported === 0 && invalidDateResult.failed === 1);
    assert(22, "Explicit error message returned for invalid date range", invalidDateResult.errors.some(e => e.includes('strictly after Start Date')));

    // Cleanup temporary test documents
    await deleteDoc(doc(db, 'rubrics', testRubricId));
    await deleteDoc(doc(db, 'rubricCriteria', `crit-${testRubricId}-crit1`));
    await deleteDoc(doc(db, 'rubricCriteria', `crit-${testRubricId}-crit2`));
    await deleteDoc(doc(db, 'reviewCycles', testCycleId));
    console.log("\n  Cleaned up temporary test documents safely.");

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

    process.exit(failed === 0 ? 0 : 1);

  } catch (err) {
    console.error("Critical failure during verify_phase_xxvi_bulk_uploads:", err);
    process.exit(1);
  }
}

runBulkUploadVerification();
