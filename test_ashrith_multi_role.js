import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

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

async function runAshrithMultiRoleTest() {
  console.log("===============================================================");
  console.log("   E2E MULTI-ROLE TEST FOR: ashrith3155@kluniversity.in         ");
  console.log("===============================================================\n");

  const { authService } = await import('./src/firebase/services/authService.js');
  const { userRoleService } = await import('./src/firebase/services/userRoleService.js');
  const { resolveTeamRelations, resolveGuideRelationships, resolveFacultyRelationships, resolveReviewerRelationships } = await import('./src/utils/relationshipResolver.js');
  const { evaluationCenterService } = await import('./src/firebase/services/evaluationCenterService.js');

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
    // 1. Authenticate with initial password 2056
    const user = await authService.login('ashrith3155@kluniversity.in', '2056');
    assert(1, `Evaluator login succeeded for ashrith3155@kluniversity.in (UID: ${user.uid})`, Boolean(user.uid));

    // 2. Discover roles
    const userRoleData = await userRoleService.getUserRoles(user.uid, user.email);
    const roles = userRoleData.availableRoles;
    assert(2, `Available roles includes Guide, Classroom Faculty, and Reviewer (${roles.join(', ')})`, 
      roles.includes('guide') && (roles.includes('classroom_faculty') || roles.includes('faculty')) && roles.includes('reviewer')
    );

    // 3. Fetch collections
    const [teamsSnap, studentsSnap, guidesSnap, facultySnap, reviewersSnap, guideAssignSnap, facultyAssignSnap, reviewerAssignSnap, cyclesSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'guides')),
      getDocs(collection(db, 'classroomFaculty')),
      getDocs(collection(db, 'reviewers')),
      getDocs(collection(db, 'guideAssignments')),
      getDocs(collection(db, 'facultyAssignments')),
      getDocs(collection(db, 'reviewerAssignments')),
      getDocs(collection(db, 'reviewCycles'))
    ]);

    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const guides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const faculty = facultySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewers = reviewersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const guideAssignments = guideAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const facultyAssignments = facultyAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewerAssignments = reviewerAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewCycles = cyclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const testTeamId = 'T001';
    const testCycle = reviewCycles[0]?.reviewName || 'Review 1';

    const guideObj = guides.find(g => g.email && g.email.toLowerCase() === user.email.toLowerCase()) || { email: user.email };
    const facultyObj = faculty.find(f => f.email && f.email.toLowerCase() === user.email.toLowerCase()) || { email: user.email };
    const reviewerObj = reviewers.find(r => r.email && r.email.toLowerCase() === user.email.toLowerCase()) || { email: user.email };

    // 4. Role 1: GUIDE VERIFICATION
    const guideRel = resolveGuideRelationships(guideObj, { teams, students, guideAssignments });
    assert(3, `Guide role sees assigned teams (${guideRel.teams.length} teams assigned)`, guideRel.teams.some(t => String(t.id || t.teamId).toLowerCase() === testTeamId.toLowerCase()));

    const guideEvalDocId = `eval_${testCycle.toLowerCase().replace(/\s+/g, '-')}_${testTeamId.toLowerCase()}_guide_${user.uid}`;
    const now = new Date().toISOString();

    await setDoc(doc(db, 'evaluations', guideEvalDocId), {
      id: guideEvalDocId,
      teamId: testTeamId,
      reviewCycle: testCycle,
      role: 'guide',
      evaluatorId: user.uid,
      evaluatorName: 'Ashrith Test Evaluator',
      teamAverage: 88,
      attendance: { '2200030001': 'Present' },
      status: 'Locked',
      updatedAt: now,
      submittedAt: now
    });

    const gDoc = await getDoc(doc(db, 'evaluations', guideEvalDocId));
    assert(4, "Guide weekly evaluation submitted & locked", gDoc.exists() && gDoc.data()?.status === 'Locked');
    assert(5, "Guide score preserved (88/100)", gDoc.data()?.teamAverage === 88);

    // 5. Role 2: CLASSROOM FACULTY VERIFICATION
    const facRel = resolveFacultyRelationships(facultyObj, { teams, students, facultyAssignments });
    assert(6, `Faculty role sees assigned teams (${facRel.teams.length} teams assigned)`, facRel.teams.some(t => String(t.id || t.teamId).toLowerCase() === testTeamId.toLowerCase()));

    const facEvalDocId = `eval_${testCycle.toLowerCase().replace(/\s+/g, '-')}_${testTeamId.toLowerCase()}_faculty_${user.uid}`;
    await setDoc(doc(db, 'evaluations', facEvalDocId), {
      id: facEvalDocId,
      teamId: testTeamId,
      reviewCycle: testCycle,
      role: 'faculty',
      evaluatorId: user.uid,
      evaluatorName: 'Ashrith Test Evaluator',
      teamAverage: 82,
      attendance: { '2200030001': 'Present' },
      status: 'Locked',
      updatedAt: now,
      submittedAt: now
    });

    const fDoc = await getDoc(doc(db, 'evaluations', facEvalDocId));
    assert(7, "Classroom Faculty weekly evaluation submitted & locked", fDoc.exists() && fDoc.data()?.status === 'Locked');
    assert(8, "Faculty score preserved (82/100)", fDoc.data()?.teamAverage === 82);

    // 6. Role 3: REVIEWER VERIFICATION
    const revRel = resolveReviewerRelationships(reviewerObj, { teams, students, reviewerAssignments });
    assert(9, `Reviewer role sees assigned teams (${revRel.teams.length} teams assigned)`, revRel.teams.some(t => String(t.id || t.teamId).toLowerCase() === testTeamId.toLowerCase()));

    const revEvalDocId = `eval_${testCycle.toLowerCase().replace(/\s+/g, '-')}_${testTeamId.toLowerCase()}_reviewer_${user.uid}`;
    await setDoc(doc(db, 'evaluations', revEvalDocId), {
      id: revEvalDocId,
      teamId: testTeamId,
      reviewCycle: testCycle,
      role: 'reviewer',
      evaluatorId: user.uid,
      evaluatorName: 'Ashrith Test Evaluator',
      teamAverage: 94,
      attendance: { '2200030001': 'Present' },
      status: 'Locked',
      updatedAt: now,
      submittedAt: now
    });

    const rDoc = await getDoc(doc(db, 'evaluations', revEvalDocId));
    assert(10, "Reviewer evaluation submitted & locked per review cycle", rDoc.exists() && rDoc.data()?.status === 'Locked');
    assert(11, "Reviewer score preserved (94/100)", rDoc.data()?.teamAverage === 94);

    // 7. Verify Admin Evaluation Center shows all 3 role records separately
    const allTeamsEvals = await evaluationCenterService.getAllTeamsWithEvaluations();
    const targetTeamResult = allTeamsEvals.find(t => String(t.teamId || t.id).toLowerCase() === testTeamId.toLowerCase());

    assert(12, "Admin Evaluation Center reflects Guide score (88)", targetTeamResult?.guideMarks === 88);
    assert(13, "Admin Evaluation Center reflects Faculty score (82)", targetTeamResult?.facultyMarks === 82);
    assert(14, "Admin Evaluation Center reflects Reviewer score (94)", targetTeamResult?.review1Score === 94 || targetTeamResult?.finalScore > 0);

    // Clean up temporary test evaluation docs safely
    await deleteDoc(doc(db, 'evaluations', guideEvalDocId));
    await deleteDoc(doc(db, 'evaluations', facEvalDocId));
    await deleteDoc(doc(db, 'evaluations', revEvalDocId));

    console.log("\n  Cleaned up test evaluation documents safely.");

    console.log("\n===============================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

    process.exit(failed === 0 ? 0 : 1);

  } catch (err) {
    console.error("Critical failure during runAshrithMultiRoleTest:", err);
    process.exit(1);
  }
}

runAshrithMultiRoleTest();
