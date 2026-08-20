import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAllEmails() {
  console.log("=== ALL USERS IN FIRESTORE 'users' COLLECTION ===");
  const usersSnap = await getDocs(collection(db, 'users'));
  const userEmails = [];

  usersSnap.docs.forEach(d => {
    const data = d.data();
    const email = data.email || data.Email;
    if (email) {
      userEmails.push({ uid: d.id, email, role: data.role, name: data.name });
      console.log(`UID: ${d.id} | Email: ${email} | Role: ${data.role} | Name: ${data.name}`);
    }
  });

  console.log("\n=== ALL GUIDES IN FIRESTORE ===");
  const guidesSnap = await getDocs(collection(db, 'guides'));
  guidesSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Guide ID: ${d.id} | Email: ${data.email || data.Email} | Name: ${data.name}`);
  });

  console.log("\n=== ALL FACULTY IN FIRESTORE ===");
  const facultySnap = await getDocs(collection(db, 'classroomFaculty'));
  facultySnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Faculty ID: ${d.id} | Email: ${data.email || data.Email} | Name: ${data.name}`);
  });

  console.log("\n=== ALL REVIEWERS IN FIRESTORE ===");
  const reviewersSnap = await getDocs(collection(db, 'reviewers'));
  reviewersSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Reviewer ID: ${d.id} | Email: ${data.email || data.Email} | Name: ${data.name}`);
  });

  console.log("\n=== TESTING PASSWORDS FOR DISCOVERED EMAILS ===");
  const testPasswords = [
    'Admin@123', 'admin123', 'Password@123', '123456', 'password',
    'Guide@123', 'guide123', 'Faculty@123', 'faculty123',
    'Reviewer@123', 'reviewer123', 'Student@123', 'student123'
  ];

  for (const u of userEmails) {
    let authenticated = false;
    for (const pass of testPasswords) {
      try {
        const res = await signInWithEmailAndPassword(auth, u.email, pass);
        console.log(`[AUTH SUCCESS!] Email: ${u.email} | Role: ${u.role} | Password: "${pass}" | UID: ${res.user.uid}`);
        authenticated = true;
        break;
      } catch (e) {
        // Continue
      }
    }
    if (!authenticated) {
      console.log(`[AUTH FAILED] Email: ${u.email} | Role: ${u.role} | Tried ${testPasswords.length} passwords`);
    }
  }
}

testAllEmails();
