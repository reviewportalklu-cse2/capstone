import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { resolveTeamRelations } from "../../src/utils/relationshipResolver.js";

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

async function testResolution() {
  console.log("Fetching all collections from Firestore...");
  const [
    teamsDocs,
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

  console.log(`Loaded: ${teamsDocs.length} teams, ${projects.length} projects, ${students.length} students`);
  console.log(`Assignments: ${guideAssignments.length} guides, ${facultyAssignments.length} faculty, ${reviewerAssignments.length} reviewers`);

  // Build canonical teamMap
  const teamMap = new Map();
  (teamsDocs || []).forEach(t => {
    const canonicalId = t.teamId || t.id;
    if (canonicalId) {
      const key = String(canonicalId).trim().toLowerCase();
      teamMap.set(key, { ...t, id: canonicalId, teamId: canonicalId });
    }
  });

  console.log(`Total canonical teams in map: ${teamMap.size}`);

  const sampleIndices = [0, 5, 50, 100, 150, 200, 250, 294];
  const allTeams = Array.from(teamMap.values());

  console.log("\n==================================================");
  console.log("CHECKING RESOLUTION ON MULTIPLE SAMPLE TEAMS");
  console.log("==================================================");

  let successCount = 0;
  let hasProjectCount = 0;
  let hasGuideCount = 0;
  let hasFacultyCount = 0;
  let hasReviewerCount = 0;

  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
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
    });

    if (res.projectTitle && res.projectTitle !== 'Unassigned') hasProjectCount++;
    if (res.guideName && res.guideName !== 'Unassigned') hasGuideCount++;
    if (res.facultyName && res.facultyName !== 'Unassigned') hasFacultyCount++;
    if (res.reviewerName && res.reviewerName !== 'Unassigned') hasReviewerCount++;
    if (res.members && res.members.length > 0) successCount++;

    if (sampleIndices.includes(i)) {
      console.log(`\nTeam #${i + 1} [${res.teamId}]:`);
      console.log(`  Team Name:      ${res.teamName}`);
      console.log(`  Project Title:  ${res.projectTitle}`);
      console.log(`  Members Count:  ${res.members?.length || 0}`);
      console.log(`  Guide:          ${res.guideName}`);
      console.log(`  Faculty:        ${res.facultyName}`);
      console.log(`  Reviewer:       ${res.reviewerName}`);
      console.log(`  Guide Score:    ${res.guideScore}`);
    }
  }

  console.log("\n==================================================");
  console.log("GLOBAL RESOLUTION METRICS ACROSS ALL 295 TEAMS:");
  console.log(`Teams with resolved students: ${successCount} / ${allTeams.length}`);
  console.log(`Teams with resolved project:  ${hasProjectCount} / ${allTeams.length}`);
  console.log(`Teams with resolved guide:    ${hasGuideCount} / ${allTeams.length}`);
  console.log(`Teams with resolved faculty:  ${hasFacultyCount} / ${allTeams.length}`);
  console.log(`Teams with resolved reviewer: ${hasReviewerCount} / ${allTeams.length}`);
  console.log("==================================================");

  process.exit(0);
}

testResolution().catch(err => {
  console.error(err);
  process.exit(1);
});
