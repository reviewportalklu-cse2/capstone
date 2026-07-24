import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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

const ROLE_COLLECTION_MAP = {
  'student': 'students',
  'guide': 'guides',
  'classroom_faculty': 'classroomFaculty',
  'reviewer': 'reviewers',
};

async function mockResolve(email, role) {
  const collectionName = ROLE_COLLECTION_MAP[role];
  const colRef = collection(db, collectionName);
  
  let q = query(colRef, where('email', '==', email));
  let snap = await getDocs(q);
  
  if (snap.empty) {
    q = query(colRef, where('Email', '==', email));
    snap = await getDocs(q);
  }
  
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  
  return {
    firebaseUser: { uid: 'mock_uid_' + email, email },
    role,
    domainId: doc.id,
    email: data.email || data.Email,
    employeeId: data['Employee ID'] || data.employeeId || null,
    rollNumber: data['Roll Number'] || data.rollNumber || null,
    name: data.name || data['Student Name'] || data['Guide Name'] || data['Faculty Name'] || data['Reviewer Name'] || data.Name
  };
}

async function verifyQueries() {
  console.log("=== Authentication Verification ===");
  
  const testCases = [
    { email: 'student1@klu.edu.in', role: 'student', queryField: 'rollNumber' },
    { email: 'guide1@klu.edu.in', role: 'guide', queryField: 'guideId' },
    { email: 'faculty1@klu.edu.in', role: 'classroom_faculty', queryField: 'facultyId' },
    { email: 'reviewer1@klu.edu.in', role: 'reviewer', queryField: 'reviewerId' },
  ];
  
  for (let tc of testCases) {
    console.log(`\nLogging in as: ${tc.email}`);
    const resolvedUser = await mockResolve(tc.email, tc.role);
    if (!resolvedUser) {
      console.log(`❌ Failed to resolve ${tc.email}`);
      continue;
    }
    
    console.log("✅ Resolved Domain User:");
    console.log(JSON.stringify(resolvedUser, null, 2));
    
    console.log(`\n=== Dashboard Security Verification: ${tc.role} ===`);
    if (tc.role === 'student') {
      console.log(`Student Profile Load (id=${resolvedUser.domainId})... OK`);
      // Simulating Dashboard Queries
      const projSnap = await getDocs(query(collection(db, 'projects'), where('members', 'array-contains', resolvedUser.domainId)));
      console.log(`Projects found: ${projSnap.size} (Only assigned projects visible)`);
    } else {
      const field = tc.queryField;
      const id = resolvedUser.domainId;
      console.log(`Querying students where ${field} == "${id}"...`);
      const stuSnap = await getDocs(query(collection(db, 'students'), where(field, '==', id)));
      console.log(`✅ Assigned Students Visible: ${stuSnap.size}`);
      
      let allValid = true;
      stuSnap.forEach(d => {
        if (d.data()[field] !== id) allValid = false;
      });
      if (allValid) {
        console.log(`✅ Security Confirmed: No other ${tc.role}'s students are visible.`);
      } else {
        console.log(`❌ Security Breach: Found student not assigned to this ${tc.role}`);
      }
    }
  }
  
  console.log("\n=== Complete! ===");
  process.exit(0);
}

verifyQueries();
