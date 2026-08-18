import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { 
  getEntityKeys, 
  resolveEntityMatch, 
  resolveGuideRelationships,
  resolveFacultyRelationships,
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

async function testAllRolesRuntime() {
  console.log("==================================================");
  console.log("[GUIDE_RUNTIME_DEBUG] COMPLETE RUNTIME TRACE");
  console.log("==================================================\n");

  const getColl = async (name) => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch (e) {
      console.warn(`Could not load ${name}:`, e.message);
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

  // 1. Test Guide Login as "GUIDE01" / "guide01@kluniversity.in"
  const guideAuthUser = { id: "uid_g01", name: "GUIDE01", email: "guide01@kluniversity.in", role: "guide" };
  const matchedGuide = resolveEntityMatch(guides, guideAuthUser.email) || resolveEntityMatch(guides, guideAuthUser.name) || guideAuthUser;
  const guideRes = resolveGuideRelationships(matchedGuide, contextData);

  console.log(`1. GUIDE LOGIN (${guideAuthUser.name} / ${guideAuthUser.email}):`);
  console.log(`   - Resolved Master Guide: ${matchedGuide.name} (guideId: ${matchedGuide.guideId || matchedGuide.id})`);
  console.log(`   - Teams Supervised: ${guideRes.teamCount}`);
  console.log(`   - Students Supervised: ${guideRes.studentCount}`);
  console.log(`   - Projects: ${guideRes.projectCount}`);

  // 2. Test Faculty Login as "FACULTY01" / "faculty01@kluniversity.in"
  const facAuthUser = { id: "uid_f01", name: "FACULTY01", email: "faculty01@kluniversity.in", role: "classroom_faculty" };
  const matchedFac = resolveEntityMatch(faculty, facAuthUser.email) || resolveEntityMatch(faculty, facAuthUser.name) || facAuthUser;
  const facRes = resolveFacultyRelationships(matchedFac, contextData);

  console.log(`\n2. FACULTY LOGIN (${facAuthUser.name} / ${facAuthUser.email}):`);
  console.log(`   - Resolved Master Faculty: ${matchedFac.name} (facultyId: ${matchedFac.facultyId || matchedFac.id})`);
  console.log(`   - Assigned Teams: ${facRes.teamCount}`);
  console.log(`   - Assigned Students: ${facRes.studentCount}`);
  console.log(`   - Projects: ${facRes.projectCount}`);

  // 3. Test Reviewer Login as "REVIEWER01" / "reviewer01@kluniversity.in"
  const revAuthUser = { id: "uid_r01", name: "REVIEWER01", email: "reviewer01@kluniversity.in", role: "reviewer" };
  const matchedRev = resolveEntityMatch(reviewers, revAuthUser.email) || resolveEntityMatch(reviewers, revAuthUser.name) || revAuthUser;
  const revRes = resolveReviewerRelationships(matchedRev, contextData);

  console.log(`\n3. REVIEWER LOGIN (${revAuthUser.name} / ${revAuthUser.email}):`);
  console.log(`   - Resolved Master Reviewer: ${matchedRev.name} (reviewerId: ${matchedRev.reviewerId || matchedRev.id})`);
  console.log(`   - Assigned Teams: ${revRes.teamCount}`);
  console.log(`   - Assigned Students: ${revRes.studentCount}`);
  console.log(`   - Projects: ${revRes.projectCount}`);

  console.log("\n==================================================");
  console.log("ALL PORTAL RUNTIME TRACES COMPLETED SUCCESSFULLY");
  console.log("==================================================");

  process.exit(0);
}

testAllRolesRuntime();
