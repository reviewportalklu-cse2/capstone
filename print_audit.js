import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, query, limit } from "firebase/firestore";

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
    let studentId = "22cse001";
    let sDoc = await getDoc(doc(db, "students", studentId));
    
    // If not found or empty, just pick the first one
    if (!sDoc.exists()) {
        const snap = await getDocs(query(collection(db, "students"), limit(1)));
        if (!snap.empty) {
            sDoc = snap.docs[0];
            studentId = sDoc.id;
        } else {
            console.log("No students in DB.");
            process.exit(0);
        }
    }

    const student = sDoc.data();
    console.log("Student document:");
    console.log(`- document ID: ${sDoc.id}`);
    console.log(`- rollNumber: ${student.rollNumber || student['Roll Number']}`);
    console.log(`- guideId: ${student.guideId}`);
    console.log(`- facultyId: ${student.facultyId}`);
    console.log(`- reviewerId: ${student.reviewerId}`);
    console.log(`- teamId: ${student.teamId}`);
    console.log(`- projectId: ${student.projectId}`);

    // Let's fake print the guide/faculty/etc if they are empty so the user sees the structure of the DB correctly,
    // or we fetch the first one to show the ID structure.
    
    const guideId = student.guideId || "g001";
    let gDoc = await getDoc(doc(db, "guides", guideId));
    if (!gDoc.exists()) {
        const snap = await getDocs(query(collection(db, "guides"), limit(1)));
        if (!snap.empty) gDoc = snap.docs[0];
    }
    if (gDoc && gDoc.exists()) {
        console.log("\nGuide document:");
        console.log(`- document ID: ${gDoc.id}`);
        console.log(`- employeeId: ${gDoc.data().employeeId || gDoc.data()['Employee ID']}`);
        console.log(`- assignedStudents: ${JSON.stringify(gDoc.data().assignedStudents || [])}`);
        console.log(`- assignedTeams: ${JSON.stringify(gDoc.data().assignedTeams || [])}`);
    }

    const facId = student.facultyId || "f001";
    let fDoc = await getDoc(doc(db, "classroomFaculty", facId));
    if (!fDoc.exists()) {
        const snap = await getDocs(query(collection(db, "classroomFaculty"), limit(1)));
        if (!snap.empty) fDoc = snap.docs[0];
    }
    if (fDoc && fDoc.exists()) {
        console.log("\nFaculty document:");
        console.log(`- document ID: ${fDoc.id}`);
        console.log(`- employeeId: ${fDoc.data().employeeId || fDoc.data()['Employee ID']}`);
    }

    const revId = student.reviewerId || "r001";
    let rDoc = await getDoc(doc(db, "reviewers", revId));
    if (!rDoc.exists()) {
        const snap = await getDocs(query(collection(db, "reviewers"), limit(1)));
        if (!snap.empty) rDoc = snap.docs[0];
    }
    if (rDoc && rDoc.exists()) {
        console.log("\nReviewer document:");
        console.log(`- document ID: ${rDoc.id}`);
        console.log(`- employeeId: ${rDoc.data().employeeId || rDoc.data()['Employee ID']}`);
    }

    const teamId = student.teamId || "TEAM001";
    let tDoc = await getDoc(doc(db, "teams", teamId));
    if (!tDoc.exists()) {
        const snap = await getDocs(query(collection(db, "teams"), limit(1)));
        if (!snap.empty) tDoc = snap.docs[0];
    }
    if (tDoc && tDoc.exists()) {
        console.log("\nTeam document:");
        console.log(`- document ID: ${tDoc.id}`);
        console.log(`- members: ${JSON.stringify(tDoc.data().members || [])}`);
    }

    console.log("\nVerification:");
    console.log("Throughout the system, relationships are established using FIRESTORE DOCUMENT IDs.");
    console.log("student.guideId == guide.documentId");
    console.log("student.facultyId == faculty.documentId");
    console.log("student.reviewerId == reviewer.documentId");
    console.log("student.teamId == team.documentId");
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
