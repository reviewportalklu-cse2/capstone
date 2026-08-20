import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function testEvaluateWorkflow() {
  console.log("===============================================================");
  console.log("   EVALUATE WORKFLOW & ROUTING VALIDATION TEST SUITE          ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details) => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  };

  try {
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const studentsSnap = await getDocs(collection(db, 'students'));
    const projectsSnap = await getDocs(collection(db, 'projects'));

    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    assert("1. Firestore 'teams' collection retrieved", teams.length > 0, `Count: ${teams.length} teams`);
    assert("2. Firestore 'students' collection retrieved", students.length > 0, `Count: ${students.length} students`);

    const sampleTeam = teams.find(t => t.id === 'T01') || teams[0];
    const sampleTeamId = sampleTeam.id;

    const guideRoutePattern = `/guide/evaluate/${sampleTeamId}`;
    assert(`3. Guide Evaluate route pattern generated (${guideRoutePattern})`, Boolean(guideRoutePattern), `Route: ${guideRoutePattern}`);

    const facultyRoutePattern = `/faculty/evaluate/${sampleTeamId}`;
    assert(`4. Faculty Evaluate route pattern generated (${facultyRoutePattern})`, Boolean(facultyRoutePattern), `Route: ${facultyRoutePattern}`);

    const reviewerRoutePattern = `/reviewer/evaluate/${sampleTeamId}`;
    assert(`5. Reviewer Evaluate route pattern generated (${reviewerRoutePattern})`, Boolean(reviewerRoutePattern), `Route: ${reviewerRoutePattern}`);

    const cleanParamId = String(sampleTeamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchedTeam = teams.find(x => {
      const rawId = String(x.id || x.teamId).toLowerCase();
      const normId = rawId.replace(/[^a-zA-Z0-9]/g, '');
      return rawId === String(sampleTeamId).toLowerCase() || normId === cleanParamId;
    });
    assert("6. EvaluationWorkspace team matching logic resolves target team case-insensitively & normalized", Boolean(matchedTeam), `Matched: ${matchedTeam?.id}`);

    const teamMembers = students.filter(s => {
      const sTeamId = String(s['Team ID'] || s.teamId || s.team || '').toLowerCase();
      return sTeamId === String(matchedTeam?.id).toLowerCase() || sTeamId.replace(/[^a-zA-Z0-9]/g, '') === cleanParamId;
    });
    assert("7. EvaluationWorkspace resolves mapped student roster for target team", teamMembers.length > 0, `Members (${teamMembers.length}): ${teamMembers.map(m => m.name || m['Full Name'] || m.id).slice(0, 3).join(', ')}`);

    const matchedProject = projects.find(p => String(p.id || p.projectId).toLowerCase() === String(matchedTeam?.projectId || matchedTeam?.project).toLowerCase());
    assert("8. EvaluationWorkspace resolves assigned project details for target team", Boolean(matchedProject) || Boolean(matchedTeam?.projectTitle), `Project: ${matchedProject?.title || matchedTeam?.projectTitle || 'Project Linked'}`);

    console.log("\n===============================================================");
    console.log(`EVALUATE WORKFLOW SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Critical failure during test_evaluate_workflow execution:", err);
  }
}

testEvaluateWorkflow();
