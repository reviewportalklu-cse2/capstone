import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { resolveProjectRelations } from "../src/utils/relationshipResolver.js";

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

async function runFastBenchmark() {
  const getColl = async (name) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const [projects, teams, students, guides, faculty, reviewers, reviewerAssignments, guideAssignments, facultyAssignments, reviewCycles] = await Promise.all([
    getColl('projects'),
    getColl('teams'),
    getColl('students'),
    getColl('guides'),
    getColl('classroomFaculty'),
    getColl('reviewers'),
    getColl('reviewerAssignments'),
    getColl('guideAssignments'),
    getColl('facultyAssignments'),
    getColl('reviewCycles')
  ]);

  const dataContext = {
    projects, teams, students, guides, faculty, reviewers,
    reviewerAssignments, guideAssignments, facultyAssignments, reviewCycles
  };

  console.log("==================================================");
  console.log("   OPTIMIZED PROJECT RESOLUTION BENCHMARK");
  console.log("==================================================");
  console.log(`Projects: ${projects.length}`);
  console.log(`Teams: ${teams.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Guides: ${guides.length}`);
  console.log(`Faculty: ${faculty.length}`);
  console.log(`Reviewers: ${reviewers.length}\n`);

  const start = Date.now();
  const resolvedProjects = projects.map(p => resolveProjectRelations(p, dataContext));
  const duration = Date.now() - start;

  console.log(`Resolved ALL ${resolvedProjects.length} projects in ${duration} ms!`);
  console.log(`Average time per project: ${(duration / resolvedProjects.length).toFixed(3)} ms`);

  console.log("\nSample Resolved Projects:");
  ['P001', 'P002', 'P011', 'P021', 'P050', 'P100', 'P200', 'P280'].forEach(id => {
    const res = resolvedProjects.find(a => String(a.projectId || a.id).toUpperCase() === id);
    if (res) {
      console.log(`  [${id}]: Title="${res.projectTitle}", Team="${res.teamName}", Students=${res.studentCount}, Guide="${res.guideName}", Faculty="${res.facultyName}", Reviewer="${res.reviewerName}", Status="${res.status}"`);
    }
  });

  process.exit(0);
}

runFastBenchmark().catch(err => {
  console.error("Fast benchmark error:", err);
  process.exit(1);
});
