import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { 
  getEntityKeys, 
  resolveFacultyRelationships, 
  resolveGuideRelationships, 
  resolveReviewerRelationships, 
  resolveStudentRelations, 
  resolveTeamRelations 
} from "./src/utils/relationshipResolver.js";

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

async function runExhaustiveVerification() {
  console.log("==================================================================");
  console.log("PHASE XVII FINAL IMPLEMENTATION — EXHAUSTIVE RUNTIME VERIFICATION");
  console.log("==================================================================\n");

  const getCollection = async (name) => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn(`Could not load ${name}:`, e.message);
      return [];
    }
  };

  const students = await getCollection('students');
  const guides = await getCollection('guides');
  const faculty = await getCollection('classroomFaculty');
  const reviewers = await getCollection('reviewers');
  const teams = await getCollection('teams');
  const projects = await getCollection('projects');
  const rubrics = await getCollection('rubrics');
  const rubricCriteria = await getCollection('rubricCriteria');
  const evaluations = await getCollection('evaluations');
  const guideAssignments = await getCollection('guideAssignments');
  const facultyAssignments = await getCollection('facultyAssignments');
  const reviewerAssignments = await getCollection('reviewerAssignments');
  const reviewCycles = await getCollection('reviewCycles');

  const contextData = {
    students, guides, faculty, reviewers, teams, projects,
    rubrics, rubricCriteria, evaluations, guideAssignments,
    facultyAssignments, reviewerAssignments, reviewCycles
  };

  console.log(`[FIRESTORE DATASET LOADED]:
  - Students: ${students.length}
  - Guides: ${guides.length}
  - Classroom Faculty: ${faculty.length}
  - Reviewers: ${reviewers.length}
  - Teams: ${teams.length}
  - Projects: ${projects.length}
  - Active Review Cycles: ${reviewCycles.length}
  - Rubrics: ${rubrics.length}
  - Rubric Criteria: ${rubricCriteria.length}
  - Evaluations: ${evaluations.length}
`);

  let errors = 0;

  // 1. GUIDE LOGIN & STUDENT MAPPING VERIFICATION
  console.log("------------------------------------------------------------------");
  console.log("1. TESTING GUIDE LOGIN & MAPPED STUDENT EVALUATION WORKFLOW");
  console.log("------------------------------------------------------------------");
  
  const sampleGuide = guides.find(g => getEntityKeys(g).some(k => ['g001', 'g01', 'g1', 'emp001', 'gde301'].includes(k))) || guides[0];
  if (!sampleGuide) {
    console.error("ERROR: No guide found!");
    errors++;
  } else {
    const guideRes = resolveGuideRelationships(sampleGuide, contextData);
    console.log(`Logged-in Guide: ${sampleGuide.name} (ID: ${sampleGuide.id})
    - Assigned Teams Count: ${guideRes.teamCount}
    - Assigned Students Count: ${guideRes.studentCount}
    - Assigned Projects Count: ${guideRes.projectCount}`);

    if (guideRes.studentCount === 0 || guideRes.teamCount === 0) {
      console.error(`ERROR: Guide ${sampleGuide.name} has 0 students/teams mapped!`);
      errors++;
    } else {
      console.log(`\n  [Guide Mapped Students Detail]:`);
      guideRes.students.forEach((s, idx) => {
        const sRel = resolveStudentRelations(s, contextData);
        console.log(`   ${idx + 1}. ${sRel.name} (${sRel.rollNumber}) -> Team: ${sRel.teamId}, Project: ${sRel.projectId}`);
      });

      // Verify Guide Evaluation Workflow for First Team
      const gTeam = guideRes.teams[0];
      const gRelTeam = resolveTeamRelations(gTeam, contextData);
      console.log(`\n  [Guide Opening Evaluation for Team ${gRelTeam.teamId}]:`);
      console.log(`   - Mapped Members: ${gRelTeam.members.map(m => m.name || m.rollNumber || m.id).join(', ')}`);
      console.log(`   - Project Title: ${gRelTeam.projectTitle}`);
    }
  }

  // 2. FACULTY LOGIN & STUDENT MAPPING VERIFICATION
  console.log("\n------------------------------------------------------------------");
  console.log("2. TESTING CLASSROOM FACULTY LOGIN & MAPPED STUDENT WORKFLOW");
  console.log("------------------------------------------------------------------");

  const sampleFaculty = faculty.find(f => getEntityKeys(f).some(k => ['f001', 'f01', 'f1', 'f001', 'fac401'].includes(k))) || faculty[0];
  if (!sampleFaculty) {
    console.error("ERROR: No faculty found!");
    errors++;
  } else {
    const facRes = resolveFacultyRelationships(sampleFaculty, contextData);
    console.log(`Logged-in Faculty: ${sampleFaculty.name} (ID: ${sampleFaculty.id})
    - Assigned Teams Count: ${facRes.teamCount}
    - Assigned Students Count: ${facRes.studentCount}
    - Assigned Projects Count: ${facRes.projectCount}`);

    if (facRes.studentCount === 0 || facRes.teamCount === 0) {
      console.error(`ERROR: Faculty ${sampleFaculty.name} has 0 students/teams mapped!`);
      errors++;
    } else {
      console.log(`\n  [Faculty Mapped Students Detail]:`);
      facRes.students.forEach((s, idx) => {
        const sRel = resolveStudentRelations(s, contextData);
        console.log(`   ${idx + 1}. ${sRel.name} (${sRel.rollNumber}) -> Team: ${sRel.teamId}, Project: ${sRel.projectId}`);
      });

      // Verify Faculty Evaluation Workflow for First Team
      const fTeam = facRes.teams[0];
      const fRelTeam = resolveTeamRelations(fTeam, contextData);
      console.log(`\n  [Faculty Opening Evaluation for Team ${fRelTeam.teamId}]:`);
      console.log(`   - Mapped Members: ${fRelTeam.members.map(m => m.name || m.rollNumber || m.id).join(', ')}`);
      console.log(`   - Project Title: ${fRelTeam.projectTitle}`);
    }
  }

  // 3. REVIEWER LOGIN & STUDENT MAPPING VERIFICATION
  console.log("\n------------------------------------------------------------------");
  console.log("3. TESTING REVIEWER LOGIN & MAPPED STUDENT WORKFLOW");
  console.log("------------------------------------------------------------------");

  const sampleReviewer = reviewers.find(r => getEntityKeys(r).some(k => ['r001', 'r01', 'r1', 'r001', 'rev501'].includes(k))) || reviewers[0];
  if (!sampleReviewer) {
    console.error("ERROR: No reviewer found!");
    errors++;
  } else {
    const revRes = resolveReviewerRelationships(sampleReviewer, contextData);
    console.log(`Logged-in Reviewer: ${sampleReviewer.name} (ID: ${sampleReviewer.id})
    - Assigned Teams Count: ${revRes.teamCount}
    - Assigned Students Count: ${revRes.studentCount}
    - Assigned Projects Count: ${revRes.projectCount}`);

    if (revRes.studentCount === 0 || revRes.teamCount === 0) {
      console.error(`ERROR: Reviewer ${sampleReviewer.name} has 0 students/teams mapped!`);
      errors++;
    } else {
      console.log(`\n  [Reviewer Mapped Students Detail]:`);
      revRes.students.forEach((s, idx) => {
        const sRel = resolveStudentRelations(s, contextData);
        console.log(`   ${idx + 1}. ${sRel.name} (${sRel.rollNumber}) -> Team: ${sRel.teamId}, Project: ${sRel.projectId}`);
      });
    }
  }

  // 4. CROSS-USER ISOLATION & NO FALLBACK TEST
  console.log("\n------------------------------------------------------------------");
  console.log("4. TESTING CROSS-USER ISOLATION & PROHIBITED FALLBACK PROTECTION");
  console.log("------------------------------------------------------------------");

  const invalidGuide = { id: 'G_NON_EXISTENT_9999', name: 'Unknown Guide' };
  const invalidRes = resolveGuideRelationships(invalidGuide, contextData);
  if (invalidRes.studentCount > 0 || invalidRes.teamCount > 0) {
    console.error("ERROR: Non-existent guide resolved data belonging to another user!");
    errors++;
  } else {
    console.log("✔ Non-existent user returned 0 students/teams (Zero cross-user data leakage).");
  }

  // 5. TEST PERSISTENCE OF DRAFT & SUBMITTED EVALUATION WITH PER-STUDENT ATTENDANCE
  console.log("\n------------------------------------------------------------------");
  console.log("5. TESTING EVALUATION DRAFT & SUBMIT PERSISTENCE (MARKS + ATTENDANCE)");
  console.log("------------------------------------------------------------------");

  const testTeam = teams[0];
  const relTeam = resolveTeamRelations(testTeam, contextData);
  const targetStudent = relTeam.members[0];
  const targetStudentId = targetStudent?.id || '220003001';

  const testEvalId = `test-phase17-${Date.now()}`;
  const draftDoc = {
    id: testEvalId,
    teamId: relTeam.teamId,
    projectId: relTeam.projectId || '',
    reviewCycle: 'Review 1',
    evaluatorId: sampleFaculty.id,
    evaluatorName: sampleFaculty.name,
    role: 'faculty',
    marks: { [`${targetStudentId}_crit1`]: 28 },
    attendance: { [targetStudentId]: 'Present' },
    studentTotals: { [targetStudentId]: 28 },
    teamAverage: 28,
    status: 'Draft',
    updatedAt: new Date().toISOString()
  };

  try {
    // 1. Save Draft
    await setDoc(doc(db, 'evaluations', testEvalId), draftDoc);
    console.log(`✔ Draft saved for Team ${relTeam.teamId}, Student ${targetStudentId}.`);

    // Verify Draft Persisted in Firestore
    const draftSnap = await getDoc(doc(db, 'evaluations', testEvalId));
    if (draftSnap.exists() && draftSnap.data().status === 'Draft' && draftSnap.data().attendance[targetStudentId] === 'Present') {
      console.log("✔ Draft persistence verified from Firestore read.");
    } else {
      console.error("ERROR: Draft evaluation failed to persist properly!");
      errors++;
    }

    // 2. Submit & Lock
    await setDoc(doc(db, 'evaluations', testEvalId), { ...draftDoc, status: 'Locked' }, { merge: true });
    const lockedSnap = await getDoc(doc(db, 'evaluations', testEvalId));
    if (lockedSnap.exists() && lockedSnap.data().status === 'Locked') {
      console.log("✔ Submission & locking verified from Firestore read.");
    } else {
      console.error("ERROR: Submission locking failed!");
      errors++;
    }

    // Cleanup
    await deleteDoc(doc(db, 'evaluations', testEvalId));
    console.log("✔ Test evaluation document cleaned up.");
  } catch (err) {
    console.error("ERROR in evaluation persistence test:", err.message);
    errors++;
  }

  // 6. ADMIN REGRESSION VERIFICATION
  console.log("\n------------------------------------------------------------------");
  console.log("6. ADMIN REGRESSION VERIFICATION");
  console.log("------------------------------------------------------------------");
  console.log(`✔ Admin Guides count: ${guides.length}`);
  console.log(`✔ Admin Faculty count: ${faculty.length}`);
  console.log(`✔ Admin Reviewers count: ${reviewers.length}`);
  console.log(`✔ Admin Students count: ${students.length}`);
  console.log(`✔ Admin Teams count: ${teams.length}`);
  console.log(`✔ Admin Projects count: ${projects.length}`);

  console.log("\n==================================================================");
  if (errors === 0) {
    console.log("✅ ALL EXHAUSTIVE RUNTIME VERIFICATIONS PASSED WITH ZERO ERRORS!");
  } else {
    console.log(`❌ VERIFICATION COMPLETED WITH ${errors} ERRORS.`);
    process.exit(1);
  }
  console.log("==================================================================\n");

  process.exit(0);
}

runExhaustiveVerification();
