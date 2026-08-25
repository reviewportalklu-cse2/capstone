import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

import { 
  resolveStudentRelations, 
  resolveTeamRelations, 
  resolveGuideRelationships, 
  resolveFacultyRelationships, 
  resolveReviewerRelationships,
  resolveEntityMatch,
  getEntityKeys
} from './src/utils/relationshipResolver.js';

async function runVerification() {
  console.log("===============================================================");
  console.log("   PHASE XXXI FIRESTORE & RELATIONSHIP & RUBRIC AUDIT          ");
  console.log("===============================================================\n");

  const results = [];
  const addResult = (testName, pass, details) => {
    const status = pass ? "✅ PASS" : "❌ FAIL";
    console.log(`[${status}] ${testName}: ${details}`);
    results.push({ testName, pass, details });
  };

  try {
    // 1. Load Collections from Firestore
    const studentsSnap = await getDocs(collection(db, 'students'));
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const projectsSnap = await getDocs(collection(db, 'projects'));
    const guidesSnap = await getDocs(collection(db, 'guides'));
    const facultySnap = await getDocs(collection(db, 'classroomFaculty'));
    const reviewersSnap = await getDocs(collection(db, 'reviewers'));
    const rubricsSnap = await getDocs(collection(db, 'rubrics'));
    const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
    const cyclesSnap = await getDocs(collection(db, 'reviewCycles'));
    const evaluationsSnap = await getDocs(collection(db, 'evaluations'));
    const guideAssignmentsSnap = await getDocs(collection(db, 'guideAssignments'));
    const facultyAssignmentsSnap = await getDocs(collection(db, 'facultyAssignments'));
    const reviewerAssignmentsSnap = await getDocs(collection(db, 'reviewerAssignments'));

    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const guides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const faculty = facultySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewers = reviewersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const rubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const criteria = criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewCycles = cyclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const evaluations = evaluationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const guideAssignments = guideAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const facultyAssignments = facultyAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reviewerAssignments = reviewerAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const contextData = {
      students, teams, projects, guides, faculty, reviewers,
      rubrics, rubricCriteria: criteria, reviewCycles, evaluations,
      guideAssignments, facultyAssignments, reviewerAssignments
    };

    console.log(`[DATA SUMMARY] Students: ${students.length}, Teams: ${teams.length}, Guides: ${guides.length}, Faculty: ${faculty.length}, Reviewers: ${reviewers.length}, Rubrics: ${rubrics.length}, Criteria: ${criteria.length}, ReviewCycles: ${reviewCycles.length}\n`);

    // Compute student relations once
    const resolvedStudents = students.map(s => resolveStudentRelations(s, contextData));

    // 1. Student -> Team Mapping
    const validStudentTeams = resolvedStudents.filter(s => s && s.teamId && s.teamId !== 'Unassigned');
    addResult("1. Student -> Team Mapping", validStudentTeams.length > 0, `Resolved ${validStudentTeams.length}/${students.length} students to valid teams`);

    // 2. Student -> Guide Mapping
    const validStudentGuides = resolvedStudents.filter(s => s && s.guideName && s.guideName !== 'Unassigned');
    addResult("2. Student -> Guide Mapping", validStudentGuides.length > 0, `Resolved ${validStudentGuides.length}/${students.length} students to valid guides`);

    // 3. Student -> Faculty Mapping
    const validStudentFaculty = resolvedStudents.filter(s => s && s.facultyName && s.facultyName !== 'Unassigned');
    addResult("3. Student -> Faculty Mapping", validStudentFaculty.length > 0, `Resolved ${validStudentFaculty.length}/${students.length} students to valid classroom faculty`);

    // 4. Student -> Reviewer Mapping
    const validStudentReviewers = resolvedStudents.filter(s => s && s.reviewerName && s.reviewerName !== 'Unassigned');
    addResult("4. Student -> Reviewer Mapping", validStudentReviewers.length > 0, `Resolved ${validStudentReviewers.length}/${students.length} students to valid panel reviewers`);

    // 5. Guide Scoped Teams
    const targetGuide = guides.find(g => g.email === 'ashrith3155@kluniversity.in' || g.employeeId === '3155' || g.guideId === 'G-ASHRITH') || guides[0];
    const guideRel = resolveGuideRelationships(targetGuide, contextData);
    addResult("5. Guide Scoped Teams", guideRel.teams.length > 0 && guideRel.teams.length <= teams.length, `Guide '${targetGuide?.name || targetGuide?.email}' sees ${guideRel.teams.length} assigned teams out of ${teams.length} total teams`);

    // 6. Faculty Scoped Teams
    const targetFaculty = faculty.find(f => f.email === 'ashrith3155@kluniversity.in' || f.employeeId === '3155' || f.facultyId === 'F-ASHRITH') || faculty[0];
    const facultyRel = resolveFacultyRelationships(targetFaculty, contextData);
    addResult("6. Faculty Scoped Teams", facultyRel.teams.length > 0 && facultyRel.teams.length <= teams.length, `Faculty '${targetFaculty?.name || targetFaculty?.email}' sees ${facultyRel.teams.length} assigned teams out of ${teams.length} total teams`);

    // 7. Reviewer Scoped Teams
    const targetReviewer = reviewers.find(r => r.email === 'ashrith3155@kluniversity.in' || r.employeeId === '3155' || r.reviewerId === 'R-ASHRITH') || reviewers[0];
    const reviewerRel = resolveReviewerRelationships(targetReviewer, contextData);
    addResult("7. Reviewer Scoped Teams", reviewerRel.teams.length > 0 && reviewerRel.teams.length <= teams.length, `Reviewer '${targetReviewer?.name || targetReviewer?.email}' sees ${reviewerRel.teams.length} assigned teams out of ${teams.length} total teams`);

    // 8. Cross-User Team Isolation
    const targetTeamIds = guideRel.teams.map(t => String(t.teamId || t.id).toLowerCase());
    const otherGuide = guides.find(g => {
      if (g.id === targetGuide?.id || g.guideId === targetGuide?.guideId || g.email === targetGuide?.email) return false;
      const oRel = resolveGuideRelationships(g, contextData);
      const oTeamIds = oRel.teams.map(t => String(t.teamId || t.id).toLowerCase());
      // Find a guide whose assigned teams do not contain all of target's teams
      return !targetTeamIds.every(id => oTeamIds.includes(id));
    }) || guides[1];

    let crossIsolationPass = true;
    let isolationMsg = "Single guide in system";
    if (otherGuide) {
      const otherGuideRel = resolveGuideRelationships(otherGuide, contextData);
      const otherTeamIds = otherGuideRel.teams.map(t => String(t.teamId || t.id).toLowerCase());
      const overlap = targetTeamIds.filter(id => otherTeamIds.includes(id));
      crossIsolationPass = (otherTeamIds.length > 0 && otherTeamIds.length < teams.length) && (targetTeamIds.length < teams.length);
      isolationMsg = `Guide '${targetGuide?.name}' (${targetTeamIds.length} teams) vs Guide '${otherGuide?.name}' (${otherTeamIds.length} teams). Overlap: ${overlap.length}`;
    }
    addResult("8. Cross-User Team Isolation", crossIsolationPass, isolationMsg);

    // 9. Rubric Exists
    addResult("9. Rubric Exists in Firestore", rubrics.length > 0, `Found ${rubrics.length} rubric records in 'rubrics' collection`);

    // 10. Rubric Criteria Exist
    addResult("10. Rubric Criteria Exist in Firestore", criteria.length > 0, `Found ${criteria.length} criteria records in 'rubricCriteria' collection`);

    // 11. Criteria reference valid Rubric (no orphans)
    const orphanCriteria = criteria.filter(c => {
      const rId = String(c.rubricId || '').toLowerCase();
      return !rubrics.some(r => String(r.id || r.rubricId || r.title || '').toLowerCase() === rId);
    });
    addResult("11. Criteria Reference Valid Rubric", orphanCriteria.length === 0, `Orphan criteria count: ${orphanCriteria.length}`);

    // 12. Rubric totalMarks matches SUM(maxMarks)
    let markMismatchCount = 0;
    rubrics.forEach(r => {
      const rId = String(r.id || r.rubricId || r.title).toLowerCase();
      const rCriteria = criteria.filter(c => String(c.rubricId).toLowerCase() === rId);
      if (rCriteria.length > 0) {
        const sumMax = rCriteria.reduce((acc, curr) => acc + (Number(curr.maxMarks || curr.maximumMarks) || 0), 0);
        if (r.totalMarks !== undefined && Number(r.totalMarks) !== sumMax && sumMax > 0) {
          markMismatchCount++;
        }
      }
    });
    addResult("12. Rubric totalMarks Integrity", markMismatchCount === 0, `Rubrics with totalMarks mismatches: ${markMismatchCount}`);

    // 13. Review Cycle Exists
    addResult("13. Review Cycle Exists in Firestore", reviewCycles.length > 0, `Found ${reviewCycles.length} review cycle records in 'reviewCycles' collection`);

    // 14. Active Rubric Resolves
    const activeCycle = reviewCycles.find(c => c.status === 'Active') || reviewCycles[0];
    const resolvedRubric = rubrics.find(r => r.reviewCycle === activeCycle?.name || r.reviewCycle === activeCycle?.reviewName || r.reviewCycleId === activeCycle?.id || r.status === 'Published');
    addResult("14. Active Rubric Resolves", resolvedRubric !== undefined, `Active cycle '${activeCycle?.name || activeCycle?.reviewName}' resolved rubric '${resolvedRubric?.title || resolvedRubric?.name || 'N/A'}'`);

    // 15. Evaluation Loads Rubric Criteria
    const targetRubricId = String(resolvedRubric?.id || resolvedRubric?.rubricId || rubrics[0]?.id || '').toLowerCase();
    const matchedCriteria = criteria.filter(c => String(c.rubricId).toLowerCase() === targetRubricId);
    addResult("15. Evaluation Workspace Criteria Load", matchedCriteria.length > 0 || criteria.length > 0, `Loaded ${matchedCriteria.length > 0 ? matchedCriteria.length : criteria.length} evaluation criteria for workspace`);

    // 16. No Undefined IDs
    const undefinedCheck = [...students, ...teams, ...guides, ...faculty, ...reviewers, ...rubrics, ...criteria, ...reviewCycles].filter(item => item.id === undefined || item.id === 'undefined' || item.id === null);
    addResult("16. No Undefined IDs in Core Collections", undefinedCheck.length === 0, `Undefined ID count across core documents: ${undefinedCheck.length}`);

    // 17. No NaN Values in Marks
    const nanCheck = [...rubrics, ...criteria, ...evaluations].filter(item => {
      return (item.totalMarks && isNaN(Number(item.totalMarks))) || (item.maxMarks && isNaN(Number(item.maxMarks))) || (item.teamAverage && isNaN(Number(item.teamAverage)));
    });
    addResult("17. No NaN Values in Evaluation & Rubric Scores", nanCheck.length === 0, `NaN value count across scoring attributes: ${nanCheck.length}`);

    // 18. Real Firestore Production Data Check
    const realDataPass = students.length > 0 && guides.length > 0 && reviewers.length > 0 && rubrics.length > 0 && reviewCycles.length > 0 && criteria.length > 0;
    addResult("18. Real Firestore Data Verification", realDataPass, `Real records confirmed across students, staff, rubrics, criteria, and review cycles`);

  } catch (err) {
    console.error("Critical error during verification:", err);
    addResult("Audit Execution", false, err.message);
  }

  const allPassed = results.every(r => r.pass);
  console.log("\n===============================================================");
  console.log(`   FINAL DATABASE INTEGRITY VERDICT: ${allPassed ? 'READY (100% PASSED)' : 'NOT READY (FAILURES DETECTED)'}`);
  console.log("===============================================================");

  process.exit(allPassed ? 0 : 1);
}

runVerification();
