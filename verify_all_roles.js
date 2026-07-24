import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { syncService } from "./src/firebase/services/syncService.js";

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

async function verifyAllRoles() {
  console.log("=========================================");
  console.log("STARTING FULL STRUCTURAL VERIFICATION");
  console.log("=========================================\n");

  const getCollection = async (name) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const students = await getCollection('students');
  const guides = await getCollection('guides');
  const faculty = await getCollection('classroomFaculty');
  const reviewers = await getCollection('reviewers');
  const teams = await getCollection('teams');
  const projects = await getCollection('projects');

  let errors = 0;

  // 1. Validate Students
  console.log(`[1] Verifying ${students.length} Students...`);
  if (students.length !== 102) {
    console.warn(`WARNING: Expected 102 students, got ${students.length}`);
  }
  for (const s of students) {
    if (!s.guideId || !s.facultyId || !s.reviewerId || !s.teamId || !s.projectId) {
      console.error(`ERROR: Student ${s.rollNumber} has missing assignments!`, s);
      errors++;
    }
  }

  // 2. Validate Guides
  console.log(`[2] Verifying ${guides.length} Guides...`);
  for (const g of guides) {
    const gStudents = g.assignedStudents || [];
    // Verify no duplicates
    const unique = new Set(gStudents);
    if (unique.size !== gStudents.length) {
      console.error(`ERROR: Guide ${g.id} has duplicate assigned students!`);
      errors++;
    }
    // Verify reverse relationship
    for (const sid of gStudents) {
      const stu = students.find(s => s.id === sid);
      if (stu && stu.guideId !== g.id) {
        console.error(`ERROR: Guide ${g.id} has student ${sid}, but student belongs to guide ${stu.guideId}`);
        errors++;
      }
    }
  }

  // 3. Validate Faculty
  console.log(`[3] Verifying ${faculty.length} Faculty...`);
  for (const f of faculty) {
    const fStudents = f.assignedStudents || [];
    for (const sid of fStudents) {
      const stu = students.find(s => s.id === sid);
      if (stu && stu.facultyId !== f.id) {
        console.error(`ERROR: Faculty ${f.id} has student ${sid}, but student belongs to faculty ${stu.facultyId}`);
        errors++;
      }
    }
  }

  // 4. Validate Reviewers
  console.log(`[4] Verifying ${reviewers.length} Reviewers...`);
  for (const r of reviewers) {
    const rStudents = r.assignedStudents || [];
    for (const sid of rStudents) {
      const stu = students.find(s => s.id === sid);
      if (stu && stu.reviewerId !== r.id) {
        console.error(`ERROR: Reviewer ${r.id} has student ${sid}, but student belongs to reviewer ${stu.reviewerId}`);
        errors++;
      }
    }
  }

  // 5. Validate Teams
  console.log(`[5] Verifying ${teams.length} Teams...`);
  for (const t of teams) {
    const members = t.members || [];
    for (const sid of members) {
      const stu = students.find(s => s.id === sid);
      if (stu && stu.teamId !== t.id) {
        console.error(`ERROR: Team ${t.id} has student ${sid}, but student belongs to team ${stu.teamId}`);
        errors++;
      }
    }
  }

  if (errors === 0) {
    console.log("✔ Initial validation passed! Zero errors.\n");
  } else {
    console.log(`❌ Initial validation failed with ${errors} errors.\n`);
    process.exit(1);
  }

  // DELTA UPDATE TEST
  console.log("=========================================");
  console.log("RUNNING DELTA SYNCHRONIZATION TEST");
  console.log("=========================================\n");

  const testStudent = students[0];
  if (!testStudent) {
    console.error("Could not find any student to run the test.");
    process.exit(1);
  }

  const oldGuideId = testStudent.guideId;
  const oldFacultyId = testStudent.facultyId;
  const oldReviewerId = testStudent.reviewerId;
  const oldTeamId = testStudent.teamId;

  // We want to move them to a different guide/faculty/reviewer/team.
  // Find a different one
  const newGuide = guides.find(g => g.id !== oldGuideId);
  const newFaculty = faculty.find(f => f.id !== oldFacultyId);
  const newReviewer = reviewers.find(r => r.id !== oldReviewerId);
  const newTeam = teams.find(t => t.id !== oldTeamId);

  console.log(`Moving 22CSE004:
    Guide:    ${oldGuideId} -> ${newGuide.id}
    Faculty:  ${oldFacultyId} -> ${newFaculty.id}
    Reviewer: ${oldReviewerId} -> ${newReviewer.id}
    Team:     ${oldTeamId} -> ${newTeam.id}
  `);

  const mockAssignmentRow = {
    'Roll Number': testStudent.rollNumber || testStudent.id,
    'Team ID': newTeam.teamId || newTeam.id,
    'Guide Employee ID': newGuide.employeeId || newGuide.id,
    'Faculty Employee ID': newFaculty.employeeId || newFaculty.id,
    'Reviewer Employee ID': newReviewer.employeeId || newReviewer.id,
    'Batch': 'CSE-2',
    'Section': 'A'
  };
  console.log("Mock row:", mockAssignmentRow);

  console.log("Running syncService.syncAssignments() with mock row...");
  const result = await syncService.syncAssignments([mockAssignmentRow]);
  console.log("Sync Results:", result);

  // Re-fetch everything and verify the move!
  console.log("\nVerifying Data Integrity After Delta Sync...");
  
  const updatedStudentDoc = await getDoc(doc(db, 'students', testStudent.id));
  const updatedStudent = updatedStudentDoc.data();

  const verifyRemoved = async (collectionName, id, studentId, arrayName) => {
    const docSnap = await getDoc(doc(db, collectionName, id));
    const data = docSnap.data();
    if ((data[arrayName] || []).includes(studentId)) {
      console.error(`❌ ERROR: Student ${studentId} was NOT removed from ${collectionName} ${id}!`);
      return false;
    }
    console.log(`✔ Removed from ${collectionName} ${id} (${arrayName})`);
    return true;
  };

  const verifyAdded = async (collectionName, id, studentId, arrayName) => {
    const docSnap = await getDoc(doc(db, collectionName, id));
    const data = docSnap.data();
    if (!(data[arrayName] || []).includes(studentId)) {
      console.error(`❌ ERROR: Student ${studentId} was NOT added to ${collectionName} ${id}!`);
      return false;
    }
    console.log(`✔ Added to ${collectionName} ${id} (${arrayName})`);
    return true;
  };

  let testPassed = true;
  testPassed &= await verifyRemoved('guides', oldGuideId, testStudent.id, 'assignedStudents');
  testPassed &= await verifyAdded('guides', newGuide.id, testStudent.id, 'assignedStudents');

  testPassed &= await verifyRemoved('classroomFaculty', oldFacultyId, testStudent.id, 'assignedStudents');
  testPassed &= await verifyAdded('classroomFaculty', newFaculty.id, testStudent.id, 'assignedStudents');

  testPassed &= await verifyRemoved('reviewers', oldReviewerId, testStudent.id, 'assignedStudents');
  testPassed &= await verifyAdded('reviewers', newReviewer.id, testStudent.id, 'assignedStudents');

  testPassed &= await verifyRemoved('teams', oldTeamId, testStudent.id, 'members');
  testPassed &= await verifyAdded('teams', newTeam.id, testStudent.id, 'members');

  if (updatedStudent.guideId === newGuide.id && updatedStudent.teamId === newTeam.id) {
    console.log("✔ Student document updated properly.");
  } else {
    console.error("❌ ERROR: Student document NOT updated properly.");
    testPassed = false;
  }

  if (testPassed) {
    console.log("\n=========================================");
    console.log("✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!");
    console.log("=========================================\n");
  } else {
    console.log("\n=========================================");
    console.log("❌ VERIFICATION FAILED!");
    console.log("=========================================\n");
    process.exit(1);
  }

  process.exit(0);
}

verifyAllRoles();
