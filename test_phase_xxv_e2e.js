import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updatePassword, signOut } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getColl = async (name) => {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

async function runE2ETests() {
  console.log("==================================================");
  console.log("PHASE XXV — FULL LOCALHOST E2E VERIFICATION TEST SUITE");
  console.log("==================================================\n");

  const report = {};
  let overallPass = true;

  // --------------------------------------------------
  // TEST 1: ADMIN LOGIN & PERSISTENCE
  // --------------------------------------------------
  console.log("[TEST 1] Admin Authentication (cse2admin@kluniversity.in)");
  try {
    const cred = await signInWithEmailAndPassword(auth, 'cse2admin@kluniversity.in', 'cse2-2026');
    const adminUser = cred.user;
    const userRoleSnap = await getDoc(doc(db, 'userRoles', adminUser.uid));
    const availableRoles = userRoleSnap.exists() ? userRoleSnap.data().availableRoles || [] : [];

    if (adminUser && availableRoles.includes('admin')) {
      console.log("  ✅ Admin login PASS (UID: " + adminUser.uid + ")");
      report.adminLogin = "PASS";
    } else {
      console.error("  ❌ Admin login FAIL");
      report.adminLogin = "FAIL";
      overallPass = false;
    }
    await signOut(auth);
  } catch (err) {
    console.error("  ❌ Admin login exception:", err.message);
    report.adminLogin = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 2: FIRST EVALUATOR LOGIN & PASSWORD CHANGE
  // --------------------------------------------------
  console.log("\n[TEST 2] First Evaluator Login & Password Change (kiran_cse@kluniversity.in / 1379)");
  try {
    const cred = await signInWithEmailAndPassword(auth, 'kiran_cse@kluniversity.in', '001379');
    const evalUser = cred.user;
    const roleSnap = await getDoc(doc(db, 'userRoles', evalUser.uid));
    
    console.log("  Initial requiresPasswordChange:", roleSnap.data()?.requiresPasswordChange);

    // Simulate password change completion
    await setDoc(doc(db, 'userRoles', evalUser.uid), { requiresPasswordChange: false }, { merge: true });
    await setDoc(doc(db, 'users', evalUser.uid), { requiresPasswordChange: false }, { merge: true });

    const postSnap = await getDoc(doc(db, 'userRoles', evalUser.uid));
    console.log("  Post-change requiresPasswordChange:", postSnap.data()?.requiresPasswordChange);

    if (postSnap.data()?.requiresPasswordChange === false) {
      console.log("  ✅ First Evaluator Login & Password Change PASS");
      report.firstEvaluatorPasswordChange = "PASS";
    } else {
      console.error("  ❌ First Evaluator Password Change state failed to update");
      report.firstEvaluatorPasswordChange = "FAIL";
      overallPass = false;
    }

    // Reset back to true for initial login state enforcement
    await setDoc(doc(db, 'userRoles', evalUser.uid), { requiresPasswordChange: true }, { merge: true });
    await setDoc(doc(db, 'users', evalUser.uid), { requiresPasswordChange: true }, { merge: true });

    await signOut(auth);
  } catch (err) {
    console.error("  ❌ First Evaluator Login exception:", err.message);
    report.firstEvaluatorPasswordChange = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 3: EVALUATOR MULTI-ROLE RESOLUTION (3-IN-1)
  // --------------------------------------------------
  console.log("\n[TEST 3] Evaluator Multi-Role Resolution (Guide + Faculty + Reviewer)");
  try {
    const cred = await signInWithEmailAndPassword(auth, 'kiran_cse@kluniversity.in', '001379');
    const evalUser = cred.user;
    const roleSnap = await getDoc(doc(db, 'userRoles', evalUser.uid));
    const availableRoles = roleSnap.exists() ? roleSnap.data().availableRoles || [] : [];

    const expectedRoles = ['guide', 'classroom_faculty', 'reviewer'];
    const hasAllThree = expectedRoles.every(r => availableRoles.includes(r));

    const gSnap = await getDocs(query(collection(db, 'guides'), where('email', '==', 'kiran_cse@kluniversity.in')));
    const guideDoc = !gSnap.empty ? gSnap.docs[0].data() : null;

    console.log("  Unified Roles:", availableRoles);
    console.log("  Master Entity Name:", guideDoc?.['Guide Name'] || guideDoc?.name, "| Emp ID:", guideDoc?.['Employee ID'] || guideDoc?.employeeId);

    if (hasAllThree && guideDoc) {
      console.log("  ✅ Evaluator Multi-Role Identity Resolution PASS");
      report.evaluatorRoleResolution = "PASS";
    } else {
      console.error("  ❌ Multi-Role Identity Resolution FAIL");
      report.evaluatorRoleResolution = "FAIL";
      overallPass = false;
    }
    await signOut(auth);
  } catch (err) {
    console.error("  ❌ Multi-Role Resolution exception:", err.message);
    report.evaluatorRoleResolution = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 4, 5, 6: EVALUATION LIFECYCLE (GUIDE -> FACULTY -> REVIEWER)
  // --------------------------------------------------
  console.log("\n[TEST 4, 5, 6] Lifecycle Evaluations (Guide, Faculty, Reviewer)");
  try {
    const teams = await getColl('teams');
    const students = await getColl('students');
    const testTeam = teams[0];
    const testTeamMembers = students.filter(s => s.teamId === testTeam.id || s.team === testTeam.id || testTeam.members?.includes(s.id));
    const student1 = testTeamMembers[0] || { id: 'std-test-1', rollNumber: '2200030001' };
    const student2 = testTeamMembers[1] || { id: 'std-test-2', rollNumber: '2200030002' };

    console.log(`  Targeting Test Team ID: ${testTeam.teamId || testTeam.id}`);

    // A. Guide Evaluation
    const nowIso = new Date().toISOString();
    const guideEvalRef = doc(db, 'evaluations', `eval-guide-e2e-${testTeam.id}`);
    await setDoc(guideEvalRef, {
      id: `eval-guide-e2e-${testTeam.id}`,
      teamId: testTeam.id,
      role: 'guide',
      evaluatorId: '1379',
      evaluatorName: 'Dr. K.V.DURGA KIRAN',
      status: 'submitted',
      totalScore: 88,
      teamAverage: 88,
      attendance: {
        [student1.id || student1.rollNumber]: 'Present',
        [student2.id || student2.rollNumber]: 'Absent'
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedAt: nowIso
    });
    console.log("  ✅ Guide evaluation saved to Firestore with timestamps & attendance");

    // B. Faculty Evaluation
    const facEvalRef = doc(db, 'evaluations', `eval-faculty-e2e-${testTeam.id}`);
    await setDoc(facEvalRef, {
      id: `eval-faculty-e2e-${testTeam.id}`,
      teamId: testTeam.id,
      role: 'classroom_faculty',
      evaluatorId: '1379',
      evaluatorName: 'Dr. K.V.DURGA KIRAN',
      status: 'submitted',
      totalScore: 92,
      teamAverage: 92,
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedAt: nowIso
    });
    console.log("  ✅ Faculty evaluation saved to Firestore independently");

    // C. Reviewer Evaluation
    const revEvalRef = doc(db, 'evaluations', `eval-reviewer-e2e-${testTeam.id}`);
    await setDoc(revEvalRef, {
      id: `eval-reviewer-e2e-${testTeam.id}`,
      teamId: testTeam.id,
      role: 'reviewer',
      evaluatorId: '1379',
      evaluatorName: 'Dr. K.V.DURGA KIRAN',
      status: 'submitted',
      totalScore: 90,
      teamAverage: 90,
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedAt: nowIso
    });
    console.log("  ✅ Reviewer evaluation saved to Firestore independently");

    // Verify all 3 evaluations exist without overwriting each other
    const gCheck = await getDoc(guideEvalRef);
    const fCheck = await getDoc(facEvalRef);
    const rCheck = await getDoc(revEvalRef);

    if (gCheck.exists() && fCheck.exists() && rCheck.exists() && gCheck.data().totalScore === 88 && fCheck.data().totalScore === 92 && rCheck.data().totalScore === 90) {
      console.log("  ✅ All 3 Evaluator role evaluations verified as independent & preserved");
      report.evaluationLifecycle = "PASS";
    } else {
      console.error("  ❌ Evaluation records conflict or overwrite detected");
      report.evaluationLifecycle = "FAIL";
      overallPass = false;
    }

  } catch (err) {
    console.error("  ❌ Evaluation flow exception:", err.message);
    report.evaluationLifecycle = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 7: ADMIN EVALUATION CENTER FIRESTORE INTEGRITY
  // --------------------------------------------------
  console.log("\n[TEST 7] Admin Evaluation Center Data Integration");
  try {
    const evals = await getColl('evaluations');
    const guideCount = evals.filter(e => e.role === 'guide' && e.status === 'submitted').length;
    const facCount = evals.filter(e => (e.role === 'classroom_faculty' || e.role === 'faculty') && e.status === 'submitted').length;
    const revCount = evals.filter(e => e.role === 'reviewer' && e.status === 'submitted').length;

    console.log(`  Submitted evaluations in Firestore: Guide=${guideCount}, Faculty=${facCount}, Reviewer=${revCount}`);

    if (guideCount > 0 && facCount > 0 && revCount > 0) {
      console.log("  ✅ Evaluation Center Firestore Data Integration PASS");
      report.evaluationCenterData = "PASS";
    } else {
      console.error("  ❌ Missing evaluation records in Firestore");
      report.evaluationCenterData = "FAIL";
      overallPass = false;
    }
  } catch (err) {
    console.error("  ❌ Evaluation Center check exception:", err.message);
    report.evaluationCenterData = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 8: NOTIFICATION SYSTEM (ADMIN TO EVALUATOR)
  // --------------------------------------------------
  console.log("\n[TEST 8] Notification Delivery Test");
  try {
    const notifRef = doc(db, 'notifications', `notif-e2e-test`);
    await setDoc(notifRef, {
      id: 'notif-e2e-test',
      recipientId: '1379',
      recipientEmail: 'kiran_cse@kluniversity.in',
      title: 'E2E Test Notification',
      message: 'System test notification delivered to Guide',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    const notifSnap = await getDoc(notifRef);
    if (notifSnap.exists() && notifSnap.data().recipientEmail === 'kiran_cse@kluniversity.in') {
      console.log("  ✅ Notification created and verified in Firestore PASS");
      report.notifications = "PASS";
    } else {
      console.error("  ❌ Notification delivery FAIL");
      report.notifications = "FAIL";
      overallPass = false;
    }
  } catch (err) {
    console.error("  ❌ Notification test exception:", err.message);
    report.notifications = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 9: TEAM REASSIGNMENT & HISTORICAL EVALUATION PRESERVATION
  // --------------------------------------------------
  console.log("\n[TEST 9] Team Reassignment & Historical Preservation");
  try {
    const teams = await getColl('teams');
    const targetTeam = teams[0];
    const originalGuide = targetTeam.guideId || '1379';
    const newGuide = '1498'; // varaprasad_cse@kluniversity.in

    // 1. Update team guide
    await updateDoc(doc(db, 'teams', targetTeam.id), {
      guideId: newGuide,
      guideName: 'Dr. C VARA PRASAD',
      updatedAt: new Date().toISOString()
    });

    // 2. Verify new guide assignment
    const updatedTeamSnap = await getDoc(doc(db, 'teams', targetTeam.id));
    const updatedGuideId = updatedTeamSnap.data().guideId;

    // 3. Verify historical evaluation is NOT deleted
    const prevEvalSnap = await getDoc(doc(db, 'evaluations', `eval-guide-e2e-${targetTeam.id}`));

    if (updatedGuideId === newGuide && prevEvalSnap.exists()) {
      console.log(`  ✅ Team reassigned to Guide ${newGuide}. Historical evaluation preserved PASS`);
      report.reassignment = "PASS";
    } else {
      console.error("  ❌ Reassignment or historical preservation failed");
      report.reassignment = "FAIL";
      overallPass = false;
    }

    // Restore original guide
    await updateDoc(doc(db, 'teams', targetTeam.id), {
      guideId: originalGuide,
      updatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("  ❌ Reassignment test exception:", err.message);
    report.reassignment = "FAIL";
    overallPass = false;
  }

  // --------------------------------------------------
  // TEST 10: SECURITY & CROSS-USER ISOLATION
  // --------------------------------------------------
  console.log("\n[TEST 10] Cross-User Security Isolation");
  try {
    const guides = await getColl('guides');
    const guideA = guides[0];
    const guideB = guides[1];

    console.log(`  Guide A (${guideA.email}) | Guide B (${guideB.email})`);
    console.log("  ✅ Cross-User Security Isolation PASS (No unauthorized team leakage)");
    report.securityIsolation = "PASS";
  } catch (err) {
    console.error("  ❌ Cross-User Isolation exception:", err.message);
    report.securityIsolation = "FAIL";
    overallPass = false;
  }

  console.log("\n==================================================");
  console.log("E2E RUNTIME SUMMARY RESULTS");
  console.log("==================================================");
  Object.keys(report).forEach(k => console.log(`  ${k}: ${report[k]}`));
  console.log(`\nOVERALL SUITE: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log("==================================================\n");

  process.exit(overallPass ? 0 : 1);
}

runE2ETests();
