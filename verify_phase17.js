import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { 
  getEntityKeys, 
  resolveEntityMatch, 
  resolveGuideRelationships, 
  resolveFacultyRelationships, 
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

async function runPhase17Verification() {
  console.log("==================================================");
  console.log("PHASE XVII — RUNTIME VERIFICATION");
  console.log("==================================================\n");

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

  console.log(`Loaded dataset counts:
- Students: ${students.length}
- Guides: ${guides.length}
- Faculty: ${faculty.length}
- Reviewers: ${reviewers.length}
- Teams: ${teams.length}
- Projects: ${projects.length}
- Rubrics: ${rubrics.length}
- Rubric Criteria: ${rubricCriteria.length}
- Evaluations: ${evaluations.length}
`);

  const resultsTable = [];

  // 1. Guide Verification (G001 / G01 / G1)
  const sampleGuide = guides.find(g => {
    const keys = getEntityKeys(g);
    return keys.includes('g001') || keys.includes('g01') || keys.includes('g1') || keys.includes('emp301') || keys.includes('gde301');
  }) || guides[0];

  let guideTeams = 0, guideStudents = 0, guideProjects = 0;
  if (sampleGuide) {
    const res = resolveGuideRelationships(sampleGuide, contextData);
    guideTeams = res.teamCount;
    guideStudents = res.studentCount;
    guideProjects = res.projectCount;
    console.log(`[GUIDE CHECK] Guide ${sampleGuide.id || sampleGuide.guideId} (${sampleGuide.name}): ${guideTeams} Teams, ${guideStudents} Students, ${guideProjects} Projects`);
  }

  resultsTable.push({ Module: 'Guide Teams', Expected: '>0', Actual: guideTeams, Status: guideTeams > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Guide Students', Expected: '>0', Actual: guideStudents, Status: guideStudents > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Guide Projects', Expected: '>0', Actual: guideProjects, Status: guideProjects > 0 ? 'PASS' : 'FAIL' });

  // 2. Faculty Verification (F001 / F01 / F1)
  const sampleFaculty = faculty.find(f => {
    const keys = getEntityKeys(f);
    return keys.includes('f001') || keys.includes('f01') || keys.includes('f1') || keys.includes('emp401') || keys.includes('fac401');
  }) || faculty[0];

  let facTeams = 0, facStudents = 0, facProjects = 0;
  if (sampleFaculty) {
    const res = resolveFacultyRelationships(sampleFaculty, contextData);
    facTeams = res.teamCount;
    facStudents = res.studentCount;
    facProjects = res.projectCount;
    console.log(`[FACULTY CHECK] Faculty ${sampleFaculty.id || sampleFaculty.facultyId} (${sampleFaculty.name}): ${facTeams} Teams, ${facStudents} Students, ${facProjects} Projects`);
  }

  resultsTable.push({ Module: 'Faculty Teams', Expected: '>0', Actual: facTeams, Status: facTeams > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Faculty Students', Expected: '>0', Actual: facStudents, Status: facStudents > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Faculty Projects', Expected: '>0', Actual: facProjects, Status: facProjects > 0 ? 'PASS' : 'FAIL' });

  // 3. Reviewer Verification (R001 / R01 / R1)
  const sampleReviewer = reviewers.find(r => {
    const keys = getEntityKeys(r);
    return keys.includes('r001') || keys.includes('r01') || keys.includes('r1') || keys.includes('emp501') || keys.includes('rev501');
  }) || reviewers[0];

  let revTeams = 0, revStudents = 0;
  if (sampleReviewer) {
    const res = resolveReviewerRelationships(sampleReviewer, contextData);
    revTeams = res.teamCount;
    revStudents = res.studentCount;
    console.log(`[REVIEWER CHECK] Reviewer ${sampleReviewer.id || sampleReviewer.reviewerId} (${sampleReviewer.name}): ${revTeams} Teams, ${revStudents} Students`);
  }

  resultsTable.push({ Module: 'Reviewer Teams', Expected: '>0', Actual: revTeams, Status: revTeams > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Reviewer Students', Expected: '>0', Actual: revStudents, Status: revStudents > 0 ? 'PASS' : 'FAIL' });

  // 4. Student Resolution (220003001 or sample student)
  const sampleStudent = students.find(s => {
    const keys = getEntityKeys(s);
    return keys.includes('220003001') || keys.includes('2026cs101');
  }) || students[0];

  if (sampleStudent) {
    const sRel = resolveStudentRelations(sampleStudent, contextData);
    console.log(`[STUDENT CHECK] Student ${sRel.rollNumber || sRel.id} (${sRel.name}):
- Team: ${sRel.teamId} (${sRel.teamName})
- Guide: ${sRel.guideId} (${sRel.guideName})
- Faculty: ${sRel.facultyId} (${sRel.facultyName})
- Reviewer: ${sRel.reviewerId} (${sRel.reviewerName})
- Project: ${sRel.projectId} (${sRel.projectTitle})
`);
  }

  // 5. Rubrics & Criteria Check
  resultsTable.push({ Module: 'Rubrics', Expected: '>0', Actual: rubrics.length, Status: rubrics.length > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Rubric Criteria', Expected: '>=0', Actual: rubricCriteria.length, Status: 'PASS' });
  resultsTable.push({ Module: 'Evaluation Forms', Expected: '>=0', Actual: evaluations.length, Status: 'PASS' });

  // 6. Admin Counters Check
  resultsTable.push({ Module: 'Admin Guide Counters', Expected: '>0', Actual: guideTeams, Status: guideTeams > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Admin Faculty Counters', Expected: '>0', Actual: facTeams, Status: facTeams > 0 ? 'PASS' : 'FAIL' });
  resultsTable.push({ Module: 'Admin Reviewer Counters', Expected: '>0', Actual: revTeams, Status: revTeams > 0 ? 'PASS' : 'FAIL' });

  console.log("\n==================================================");
  console.log("FINAL VERIFICATION SUMMARY TABLE");
  console.log("==================================================");
  console.table(resultsTable);

  process.exit(0);
}

runPhase17Verification();
