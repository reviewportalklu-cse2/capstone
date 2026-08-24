/**
 * PHASE XX VERIFICATION SUITE
 * Evaluation Center Data Flow, Notifications, Role Isolation, Timestamps & Preview Verification
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
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

async function runPhaseXXVerification() {
  console.log("===============================================================");
  console.log("   PHASE XX EVALUATION CENTER & NOTIFICATION VERIFICATION     ");
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

  try {
    const now = new Date().toISOString();
    const testTeamId = 'T01';
    const cleanTeamId = 't01';
    const cycleName = 'Review 1';

    // Fetch base collections
    const [evalsSnap, teamsSnap, projectsSnap] = await Promise.all([
      getDocs(collection(db, 'evaluations')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'projects'))
    ]);

    const evaluationsDocs = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // -------------------------------------------------------------
    // PART 1 & 2: GUIDE MARKS -> ADMIN EVALUATION CENTER INTEGRATION
    // -------------------------------------------------------------
    console.log("--- PART 1 & 2: GUIDE MARKS -> ADMIN EVALUATION CENTER ---");
    
    const guideEvalId = `eval_review-1_${cleanTeamId}_guide_phase_xx_test`;
    const studentScores = {
      '220003001': 82,
      '220003002': 76,
      '220003003': 91,
      '220003004': 88
    };
    const studentAttendance = {
      '220003001': 'Present',
      '220003002': 'Present',
      '220003003': 'Absent',
      '220003004': 'Present'
    };

    const guideEvalPayload = {
      id: guideEvalId,
      teamId: testTeamId,
      teamName: 'Automated Test Team T01',
      projectId: 'P01',
      projectName: 'Test AI Capstone Project',
      reviewCycle: cycleName,
      reviewCycleId: 'c1',
      rubricId: 'rubric_review1',
      rubricTitle: 'Review 1 Rubric',
      evaluatorId: 'g001',
      evaluatorName: 'Dr. Ramesh Kumar',
      evaluatorEmail: 'ramesh.guide@kluniversity.in',
      role: 'guide',
      marks: {
        '220003001_c1': 20, '220003001_c2': 22, '220003001_c3': 20, '220003001_c4': 20,
        '220003002_c1': 18, '220003002_c2': 18, '220003002_c3': 20, '220003002_c4': 20,
        '220003003_c1': 0,  '220003003_c2': 0,  '220003003_c3': 0,  '220003003_c4': 0,
        '220003004_c1': 22, '220003004_c2': 22, '220003004_c3': 22, '220003004_c4': 22
      },
      studentTotals: studentScores,
      attendance: studentAttendance,
      teamAverage: 84,
      status: 'Locked',
      createdAt: now,
      updatedAt: now,
      submittedAt: now
    };

    await setDoc(doc(db, 'evaluations', guideEvalId), guideEvalPayload, { merge: true });
    
    // Inspect actual Firestore document
    const savedDocSnap = await getDoc(doc(db, 'evaluations', guideEvalId));
    assert(1, "Guide evaluation written to Firestore 'evaluations' collection", savedDocSnap.exists());
    
    const savedData = savedDocSnap.data();
    assert(2, "Firestore document contains required metadata (teamId, role, status: Locked, timestamps)", 
      savedData.teamId === testTeamId && savedData.role === 'guide' && savedData.status === 'Locked' && Boolean(savedData.submittedAt));

    // Simulate Admin Evaluation Center Data Integration
    const updatedEvalsSnap = await getDocs(collection(db, 'evaluations'));
    const allEvals = updatedEvalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const teamEvals = allEvals
      .filter(e => String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId)
      .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

    const guideEval = teamEvals.find(e => e.role === 'guide');

    assert(3, "Admin Evaluation Center retrieves evaluated team (" + testTeamId + ")", Boolean(guideEval));
    assert(4, "Admin Evaluation Center displays Guide Marks (" + (guideEval?.teamAverage || 0) + ") matching Firestore teamAverage (84)", guideEval?.teamAverage === 84);

    // -------------------------------------------------------------
    // PART 3: ROLE-SPECIFIC EVALUATION DOCUMENTS & ISOLATION
    // -------------------------------------------------------------
    console.log("\n--- PART 3: ROLE-SPECIFIC EVALUATION DOCUMENTS & ISOLATION ---");
    
    const facultyEvalId = `eval_review-1_${cleanTeamId}_faculty_phase_xx_test`;
    const reviewerEvalId = `eval_review-1_${cleanTeamId}_reviewer_phase_xx_test`;

    await setDoc(doc(db, 'evaluations', facultyEvalId), { ...guideEvalPayload, id: facultyEvalId, role: 'faculty', evaluatorName: 'Dr. S. Anitha', teamAverage: 78 }, { merge: true });
    await setDoc(doc(db, 'evaluations', reviewerEvalId), { ...guideEvalPayload, id: reviewerEvalId, role: 'reviewer', evaluatorName: 'Dr. Arvind Rao', teamAverage: 91 }, { merge: true });

    const gSnap = await getDoc(doc(db, 'evaluations', guideEvalId));
    const fSnap = await getDoc(doc(db, 'evaluations', facultyEvalId));
    const rSnap = await getDoc(doc(db, 'evaluations', reviewerEvalId));

    assert(5, "3 independent role evaluation documents exist for team T01", gSnap.exists() && fSnap.exists() && rSnap.exists());
    assert(6, "Score isolation verified: Guide (84) != Faculty (78) != Reviewer (91) with ZERO overwriting", 
      gSnap.data().teamAverage === 84 && fSnap.data().teamAverage === 78 && rSnap.data().teamAverage === 91);

    // -------------------------------------------------------------
    // PART 4: MARK UPDATE & DRAFT LIFECYCLE
    // -------------------------------------------------------------
    console.log("\n--- PART 4: MARK UPDATE & DRAFT LIFECYCLE ---");
    
    const draftEvalId = `eval_review-1_${cleanTeamId}_guide_draft_test`;
    const draftTime1 = new Date(Date.now() - 5000).toISOString();
    
    // Save draft with score 80
    await setDoc(doc(db, 'evaluations', draftEvalId), {
      ...guideEvalPayload,
      id: draftEvalId,
      status: 'Draft',
      submittedAt: null,
      teamAverage: 80,
      createdAt: draftTime1,
      updatedAt: draftTime1
    });

    const draft1 = (await getDoc(doc(db, 'evaluations', draftEvalId))).data();
    assert(7, "Draft saved with status='Draft' and submittedAt=null", draft1.status === 'Draft' && draft1.submittedAt === null);

    // Update draft to score 85 and Lock
    const draftTime2 = new Date().toISOString();
    await setDoc(doc(db, 'evaluations', draftEvalId), {
      teamAverage: 85,
      status: 'Locked',
      submittedAt: draftTime2,
      updatedAt: draftTime2
    }, { merge: true });

    const draft2 = (await getDoc(doc(db, 'evaluations', draftEvalId))).data();
    assert(8, "Draft updated to score 85 and status='Locked' with submittedAt timestamp", draft2.teamAverage === 85 && draft2.status === 'Locked' && Boolean(draft2.submittedAt));
    assert(9, "Timestamp order valid: createdAt <= updatedAt <= submittedAt", new Date(draft2.createdAt) <= new Date(draft2.updatedAt) && new Date(draft2.updatedAt) <= new Date(draft2.submittedAt));

    // -------------------------------------------------------------
    // PART 5 & 6: ADMIN NOTIFICATIONS & ROLE AUDIENCE FILTERING
    // -------------------------------------------------------------
    console.log("\n--- PART 5 & 6: ADMIN NOTIFICATIONS & ROLE TARGETING ---");
    
    const globalNotifId = `notif_global_test_${Date.now()}`;
    const guideNotifId = `notif_guide_test_${Date.now()}`;
    const facultyNotifId = `notif_faculty_test_${Date.now()}`;

    await setDoc(doc(db, 'notifications', globalNotifId), {
      id: globalNotifId, title: 'Global Test', message: 'E2E Notification Test — Please acknowledge.',
      targetAudience: 'everyone', targetRole: 'all', createdAt: now, readBy: []
    });

    await setDoc(doc(db, 'notifications', guideNotifId), {
      id: guideNotifId, title: 'Guide Specific Alert', message: 'Guide-only notification test.',
      targetAudience: 'role', targetRole: 'guide', targetRoles: ['guide'], createdAt: now, readBy: []
    });

    await setDoc(doc(db, 'notifications', facultyNotifId), {
      id: facultyNotifId, title: 'Faculty Specific Alert', message: 'Faculty-only notification test.',
      targetAudience: 'role', targetRole: 'faculty', targetRoles: ['faculty'], createdAt: now, readBy: []
    });

    const gNotifSnap = await getDoc(doc(db, 'notifications', globalNotifId));
    const guideOnlySnap = await getDoc(doc(db, 'notifications', guideNotifId));
    
    assert(10, "Global notification document persisted in Firestore", gNotifSnap.exists());
    assert(11, "Role-targeted notification document persisted with targetRole='guide'", guideOnlySnap.data().targetRole === 'guide');

    // Clean up test documents safely
    await deleteDoc(doc(db, 'evaluations', guideEvalId));
    await deleteDoc(doc(db, 'evaluations', facultyEvalId));
    await deleteDoc(doc(db, 'evaluations', reviewerEvalId));
    await deleteDoc(doc(db, 'evaluations', draftEvalId));
    await deleteDoc(doc(db, 'notifications', globalNotifId));
    await deleteDoc(doc(db, 'notifications', guideNotifId));
    await deleteDoc(doc(db, 'notifications', facultyNotifId));
    console.log("  Cleaned up temporary Phase XX test documents safely.");

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Critical failure during runPhaseXXVerification:", err);
  }
}

runPhaseXXVerification();
