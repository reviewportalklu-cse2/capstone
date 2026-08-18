import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { 
  getEntityKeys, 
  resolveFacultyRelationships, 
  resolveGuideRelationships, 
  resolveReviewerRelationships 
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

async function testAuthRuntimeFlow() {
  console.log("==================================================");
  console.log("[AUTH_RUNTIME] COMPREHENSIVE LOGIN & SESSION TRACE");
  console.log("==================================================\n");

  const getColl = async (name) => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  };

  const students = await getColl('students');
  const guides = await getColl('guides');
  const faculty = await getColl('classroomFaculty');
  const reviewers = await getColl('reviewers');
  const teams = await getColl('teams');
  const projects = await getColl('projects');
  const guideAssignments = await getColl('guideAssignments');
  const facultyAssignments = await getColl('facultyAssignments');
  const reviewerAssignments = await getColl('reviewerAssignments');

  const contextData = { students, guides, faculty, reviewers, teams, projects, guideAssignments, facultyAssignments, reviewerAssignments };

  const testAccounts = [
    { roleName: 'Guide', email: 'guide01@kluniversity.in', defaultRole: 'guide', expectedTeams: 4, expectedStudents: 16, masterColl: guides },
    { roleName: 'Faculty', email: 'faculty01@kluniversity.in', defaultRole: 'classroom_faculty', expectedTeams: 3, expectedStudents: 12, masterColl: faculty },
    { roleName: 'Reviewer', email: 'reviewer01@kluniversity.in', defaultRole: 'reviewer', expectedTeams: 3, expectedStudents: 12, masterColl: reviewers }
  ];

  for (const acc of testAccounts) {
    console.log(`--------------------------------------------------`);
    console.log(`Testing Login & Auth State Resolution for: ${acc.roleName} (${acc.email})`);
    console.log(`--------------------------------------------------`);

    // 1. Username/Email Prefix matching to Master Record
    const emailPrefix = acc.email.split('@')[0].toLowerCase();
    const searchKeys = [acc.email, emailPrefix].flatMap(k => getEntityKeys(k));
    
    const matchedMaster = acc.masterColl.find(r => {
      const rEmail = String(r.email || r.Email || '').toLowerCase();
      const rPrefix = rEmail.includes('@') ? rEmail.split('@')[0] : '';
      if (rEmail && rEmail === acc.email.toLowerCase()) return true;
      if (rPrefix && emailPrefix && rPrefix === emailPrefix) return true;
      const rKeys = getEntityKeys(r);
      return searchKeys.some(k => rKeys.includes(k));
    });

    console.log(`[AUTH_RUNTIME] Resolved Master Entity: ${matchedMaster?.name} (ID: ${matchedMaster?.id || matchedMaster?.guideId})`);

    // 2. Resolve relationships
    let rel;
    if (acc.defaultRole === 'guide') {
      rel = resolveGuideRelationships(matchedMaster, contextData);
    } else if (acc.defaultRole === 'classroom_faculty') {
      rel = resolveFacultyRelationships(matchedMaster, contextData);
    } else if (acc.defaultRole === 'reviewer') {
      rel = resolveReviewerRelationships(matchedMaster, contextData);
    }

    if (rel) {
      console.log(`[AUTH_RUNTIME] ${acc.roleName} Data Resolution:
  - Teams Supervised/Assigned: ${rel.teamCount}
  - Students Supervised/Assigned: ${rel.studentCount}
  - Projects: ${rel.projectCount}`);
    }

    const passTeams = rel ? rel.teamCount === acc.expectedTeams : false;
    const passStudents = rel ? rel.studentCount === acc.expectedStudents : false;
    console.log(`Result: ${passTeams && passStudents ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  console.log("==================================================");
  console.log("ALL AUTHENTICATION RUNTIME TESTS COMPLETED");
  console.log("==================================================");

  process.exit(0);
}

testAuthRuntimeFlow();
