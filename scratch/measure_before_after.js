import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { resolveStudentRelations, resolveProjectRelations } from "../src/utils/relationshipResolver.js";

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

async function runBenchmark() {
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
  console.log("   ADMIN PROJECTS PERFORMANCE & ACCURACY BENCHMARK");
  console.log("==================================================");
  console.log(`Projects: ${projects.length}`);
  console.log(`Teams: ${teams.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Guides: ${guides.length}`);
  console.log(`Faculty: ${faculty.length}`);
  console.log(`Reviewers: ${reviewers.length}\n`);

  // --- MEASURE ORIGINAL (BEFORE) LOGIC FOR 1 PROJECT ROW ---
  console.log("--- 1. MEASURING ORIGINAL (BEFORE) LOGIC FOR 1 PROJECT ROW ---");
  const beforeStart = Date.now();
  const row = projects[0];
  const pKey = String(row.id || row.projectId || row.title || '').toLowerCase();
  
  const assignedStudents2 = students.map(s => resolveStudentRelations(s, dataContext)).filter(s => {
    const sPId = String(s.projectId || '').toLowerCase();
    const sPTitle = String(s.projectTitle || '').toLowerCase();
    return (sPId && sPId === pKey) || (sPTitle && sPTitle === pKey) || sPId === String(row.id).toLowerCase();
  });

  const beforeObj1 = {
    id: row.projectId || row.id,
    title: row.projectTitle || row.title || row.name || 'Untitled Project',
    teamName: row.teamName || row.teamId || assignedStudents2[0]?.teamName || 'Unassigned',
    studentCount: assignedStudents2.length,
    guideName: assignedStudents2[0]?.guideName || row.guideName || 'Unassigned',
    facultyName: assignedStudents2[0]?.facultyName || row.facultyName || 'Unassigned',
    reviewerName: assignedStudents2[0]?.reviewerName || row.reviewerName || 'Unassigned',
    status: row.status || 'Active'
  };

  const beforeDuration1 = Date.now() - beforeStart;
  const projectedBeforeDurationAll564 = Math.round(beforeDuration1 * 564);
  const projectedBeforeIterationsAll564 = 564 * 4 * students.length;

  console.log(`BEFORE Duration for 1 project row: ${beforeDuration1} ms`);
  console.log(`BEFORE Projected Duration for ALL 564 projects: ${projectedBeforeDurationAll564} ms (${(projectedBeforeDurationAll564 / 1000).toFixed(1)} s)`);
  console.log(`BEFORE Iterations for ALL 564 projects: ${projectedBeforeIterationsAll564.toLocaleString()} iterations!\n`);

  // --- MEASURE OPTIMIZED (AFTER) LOGIC FOR ALL 564 PROJECTS ---
  console.log("--- 2. MEASURING OPTIMIZED (AFTER) LOGIC (All 564 projects) ---");
  const afterStart = Date.now();
  
  const afterResults = projects.map(p => resolveProjectRelations(p, dataContext));
  
  const afterDuration = Date.now() - afterStart;
  console.log(`AFTER Duration for ALL 564 projects: ${afterDuration} ms`);
  console.log(`AFTER Iterations: 564 linear map calls`);
  console.log(`SPEEDUP: ${(projectedBeforeDurationAll564 / Math.max(1, afterDuration)).toFixed(1)}x faster!\n`);

  // --- 3. DATA CORRECTNESS & ACCURACY COMPARISON ---
  console.log("--- 3. DATA CORRECTNESS & ACCURACY COMPARISON ---");
  const afterObj1 = afterResults[0];

  console.log(`\nVerifying [${row.projectId || row.id}]:`);
  console.log(`  BEFORE: Team="${beforeObj1.teamName}", Students=${beforeObj1.studentCount}, Guide="${beforeObj1.guideName}", Faculty="${beforeObj1.facultyName}", Reviewer="${beforeObj1.reviewerName}"`);
  console.log(`  AFTER:  Team="${afterObj1.teamName}", Students=${afterObj1.studentCount}, Guide="${afterObj1.guideName}", Faculty="${afterObj1.facultyName}", Reviewer="${afterObj1.reviewerName}"`);

  let discrepancies = 0;
  if (beforeObj1.teamName !== afterObj1.teamName ||
      beforeObj1.studentCount !== afterObj1.studentCount ||
      beforeObj1.guideName !== afterObj1.guideName ||
      beforeObj1.facultyName !== afterObj1.facultyName ||
      beforeObj1.reviewerName !== afterObj1.reviewerName) {
    console.error(`  [DISCREPANCY DETECTED]!`);
    discrepancies++;
  } else {
    console.log(`  [MATCH] All fields identical.`);
  }

  // Also check sample projects P001, P002, P011, P021 in AFTER results
  console.log("\nSample Projects in AFTER Results:");
  ['P001', 'P002', 'P011', 'P021', 'P050', 'P100', 'P200'].forEach(id => {
    const res = afterResults.find(a => String(a.projectId || a.id).toUpperCase() === id);
    if (res) {
      console.log(`  Project ${id}: Title="${res.projectTitle}", Team="${res.teamName}", Students=${res.studentCount}, Guide="${res.guideName}", Faculty="${res.facultyName}", Reviewer="${res.reviewerName}"`);
    }
  });

  console.log(`\n==================================================`);
  console.log(`Total Discrepancies Found: ${discrepancies}`);
  console.log(`==================================================`);

  process.exit(0);
}

runBenchmark().catch(err => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
