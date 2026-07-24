import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";

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

async function run() {
  try {
    const studentsRef = collection(db, "students");
    // Get a student who is assigned
    const qStudent = query(studentsRef, where("assignmentStatus", "==", "Assigned"), limit(1));
    const studentSnapshot = await getDocs(qStudent);
    
    var studentDoc;
    if (studentSnapshot.empty) {
      console.log("No assigned students found. Trying any student.");
      const qAny = query(studentsRef, limit(1));
      const anySnap = await getDocs(qAny);
      if (anySnap.empty) {
          console.log("No students found.");
          process.exit(0);
      }
      studentDoc = anySnap.docs[0];
    } else {
        studentDoc = studentSnapshot.docs[0];
    }
    
    const student = studentDoc.data();
    
    console.log("--- Student Document ---");
    console.log("Document ID:", studentDoc.id);
    console.log("rollNumber:", student.rollNumber || student.RollNumber);
    console.log("guideId:", student.guideId);
    console.log("facultyId:", student.facultyId);
    console.log("reviewerId:", student.reviewerId);
    console.log("teamId:", student.teamId);
    console.log("projectId:", student.projectId);

    if (student.guideId) {
      // Find guide by Document ID
      let matched = false;
      
      const guidesAll = await getDocs(collection(db, "guides"));
      for (const doc of guidesAll.docs) {
          if (doc.id === student.guideId) {
            console.log("\n--- Guide Document (Matched by Document ID) ---");
            console.log("Document ID:", doc.id);
            console.log("employeeId:", doc.data().employeeId);
            console.log("id:", doc.data().id);
            console.log("assignedStudents:", doc.data().assignedStudents);
            console.log("assignedTeams:", doc.data().assignedTeams);
            matched = true;
          } else if (doc.data().employeeId === student.guideId) {
            console.log("\n--- Guide Document (Matched by 'employeeId' field) ---");
            console.log("Document ID:", doc.id);
            console.log("employeeId:", doc.data().employeeId);
            console.log("id:", doc.data().id);
            console.log("assignedStudents:", doc.data().assignedStudents);
            console.log("assignedTeams:", doc.data().assignedTeams);
            matched = true;
          } else if (doc.data().id === student.guideId) {
            console.log("\n--- Guide Document (Matched by 'id' field) ---");
            console.log("Document ID:", doc.id);
            console.log("employeeId:", doc.data().employeeId);
            console.log("id:", doc.data().id);
            console.log("assignedStudents:", doc.data().assignedStudents);
            console.log("assignedTeams:", doc.data().assignedTeams);
            matched = true;
          }
      }
      
      if (!matched) {
        console.log("\n--- Guide Document NOT FOUND ---");
      }
    }
    
    if (student.facultyId) {
      let matched = false;
      const facAll = await getDocs(collection(db, "classroomFaculty"));
      for (const doc of facAll.docs) {
          if (doc.id === student.facultyId || doc.data().employeeId === student.facultyId || doc.data().id === student.facultyId) {
            console.log("\n--- Faculty Document ---");
            console.log("Document ID:", doc.id);
            console.log("employeeId:", doc.data().employeeId);
            console.log("id:", doc.data().id);
            matched = true;
          }
      }
      if (!matched) {
        console.log("\n--- Faculty Document NOT FOUND ---");
      }
    }
    
    if (student.reviewerId) {
      let matched = false;
      const revAll = await getDocs(collection(db, "reviewers"));
      for (const doc of revAll.docs) {
          if (doc.id === student.reviewerId || doc.data().employeeId === student.reviewerId || doc.data().id === student.reviewerId) {
            console.log("\n--- Reviewer Document ---");
            console.log("Document ID:", doc.id);
            console.log("employeeId:", doc.data().employeeId);
            console.log("id:", doc.data().id);
            matched = true;
          }
      }
      if (!matched) {
        console.log("\n--- Reviewer Document NOT FOUND ---");
      }
    }

    if (student.teamId) {
      let matched = false;
      const teamAll = await getDocs(collection(db, "teams"));
      for (const doc of teamAll.docs) {
          if (doc.id === student.teamId || doc.data().teamId === student.teamId) {
            console.log("\n--- Team Document ---");
            console.log("Document ID:", doc.id);
            console.log("members:", doc.data().members);
            matched = true;
          }
      }
      if (!matched) {
        console.log("\n--- Team Document NOT FOUND ---");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
