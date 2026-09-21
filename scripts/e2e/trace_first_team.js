import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { resolveTeamRelations, getEntityKeys } from "../../src/utils/relationshipResolver.js";

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

async function getColl(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function traceTeam() {
  console.log("==================================================");
  console.log("STEP 1 & 2: TRACING ONE REAL TEAM FROM FIRESTORE");
  console.log("==================================================");

  const [
    teams,
    projects,
    students,
    guides,
    classroomFaculty,
    reviewers,
    guideAssignments,
    facultyAssignments,
    reviewerAssignments,
    evaluations,
    reviewCycles
  ] = await Promise.all([
    getColl('teams'),
    getColl('projects'),
    getColl('students'),
    getColl('guides'),
    getColl('classroomFaculty'),
    getColl('reviewers'),
    getColl('guideAssignments'),
    getColl('facultyAssignments'),
    getColl('reviewerAssignments'),
    getColl('evaluations'),
    getColl('reviewCycles')
  ]);

  console.log(`Total teams: ${teams.length}`);
  const firstTeam = teams[0];
  console.log("\n[1] RAW FIRESTORE FIRST TEAM (teams[0]):");
  console.log(JSON.stringify(firstTeam, null, 2));

  // Find related records for firstTeam
  const teamId = firstTeam.teamId || firstTeam.id;
  const cleanTeamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  console.log(`\nClean team ID: ${cleanTeamId}`);

  // Check projects
  const relatedProject = projects.find(p => 
    p.id === firstTeam.projectId || 
    p.projectId === firstTeam.projectId || 
    p.teamId === teamId ||
    String(p.id).toLowerCase() === String(firstTeam.projectId).toLowerCase()
  );
  console.log("\n[2] RELATED PROJECT:");
  console.log(JSON.stringify(relatedProject, null, 2));

  // Check students
  const relatedStudents = students.filter(s => {
    const sTeam = String(s.teamId || s.team || s['Team ID'] || s.projectId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return sTeam === cleanTeamId || (firstTeam.members && firstTeam.members.includes(s.id));
  });
  console.log(`\n[3] RELATED STUDENTS (count: ${relatedStudents.length}):`);
  console.log(JSON.stringify(relatedStudents.map(s => ({ id: s.id, name: s.name || s.Name, rollNumber: s.rollNumber })), null, 2));

  // Check assignments
  const relatedGA = guideAssignments.filter(a => String(a.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);
  const relatedFA = facultyAssignments.filter(a => String(a.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);
  const relatedRA = reviewerAssignments.filter(a => String(a.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);

  console.log("\n[4] RELATED ASSIGNMENTS:");
  console.log("Guide Assignments:", JSON.stringify(relatedGA, null, 2));
  console.log("Faculty Assignments:", JSON.stringify(relatedFA, null, 2));
  console.log("Reviewer Assignments:", JSON.stringify(relatedRA, null, 2));

  // Check evaluations
  const relatedEvals = evaluations.filter(e => String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);
  console.log(`\n[5] RELATED EVALUATIONS (count: ${relatedEvals.length}):`);
  console.log(JSON.stringify(relatedEvals, null, 2));

  // Now test relationshipResolver
  console.log("\n==================================================");
  console.log("STEP 1B: TEST relationshipResolver.resolveTeamRelations");
  console.log("==================================================");

  const resolved = resolveTeamRelations(firstTeam, {
    students,
    projects,
    guides,
    faculty: classroomFaculty,
    reviewers,
    reviewCycles,
    guideAssignments,
    facultyAssignments,
    reviewerAssignments,
    evaluations
  });

  console.log("\n[RESOLVED TEAM RELATIONS RESULT]:");
  console.log(JSON.stringify(resolved, null, 2));

  // Now test what useEvaluationCenterData produces
  console.log("\n==================================================");
  console.log("STEP 1C: TEST useEvaluationCenterData logic");
  console.log("==================================================");

  // simulate useEvaluationCenterData.getTeamsWithEvaluations
  const baseTeams = teams;
  const hookRow = baseTeams.map((team, index) => {
    const res = resolveTeamRelations(team, {
      students,
      projects,
      guides,
      faculty: classroomFaculty,
      reviewers,
      reviewCycles,
      guideAssignments,
      facultyAssignments,
      reviewerAssignments,
      evaluations
    }) || {};

    const tId = res.teamId || team.teamId || team.id || `TEAM${String(index + 1).padStart(3, '0')}`;
    const cId = String(tId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const members = res.assignedStudents && res.assignedStudents.length > 0 
      ? res.assignedStudents 
      : students.filter(s => {
          const sTeamId = String(s.teamId || s.team || s['Team ID'] || s.projectId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return sTeamId === cId || String(s.projectId || '').toLowerCase() === String(team.id).toLowerCase();
        });

    const teamEvals = (evaluations || []).filter(e => {
      const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return eTeamId === cId;
    });

    const guideEval = teamEvals.find(e => e.role === 'guide');
    const facultyEval = teamEvals.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
    const reviewerEvalR1 = teamEvals.find(e => e.role === 'reviewer' && (e.reviewCycle === 'Review 1' || e.reviewCycleId === 'cycle-1'));

    const guideName = res.guideName || team.guideName || (guideEval?.evaluatorName || 'Unassigned');
    const reviewerName = res.reviewerName || team.reviewerName || (reviewerEvalR1?.evaluatorName || 'Unassigned');
    const facultyPanelName = res.facultyName || team.facultyName || (facultyEval?.evaluatorName || 'Unassigned');

    return {
      id: team.id || tId,
      teamId: tId,
      teamName: res.teamName || team.teamName || team.name || `Team ${tId}`,
      projectTitle: res.projectTitle || team.projectTitle || team.title || `Project ${tId}`,
      department: team.department || res.department || 'CSE',
      section: team.section || res.section || 'A',
      membersCount: members.length || res.studentCount || team.membersCount || 4,
      guideName,
      reviewerName,
      facultyPanelName
    };
  })[0];

  console.log("\n[HOOK ROW FOR FIRST TEAM]:");
  console.log(JSON.stringify(hookRow, null, 2));

  process.exit(0);
}

traceTeam().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
