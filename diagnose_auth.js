import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

console.log("=== ENV CHECK ===");
console.log("API_KEY:", process.env.VITE_FIREBASE_API_KEY ? "EXISTS (starts with " + process.env.VITE_FIREBASE_API_KEY.substring(0, 6) + ")" : "MISSING");
console.log("AUTH_DOMAIN:", process.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("PROJECT_ID:", process.env.VITE_FIREBASE_PROJECT_ID);
console.log("APP_ID:", JSON.stringify(process.env.VITE_FIREBASE_APP_ID));

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

async function testAuth() {
  console.log("\n=== FIRESTORE USER COLLECTIONS CHECK ===");
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`'users' collection docs count: ${usersSnap.docs.length}`);
    usersSnap.docs.forEach(d => {
      console.log(` - User ID: ${d.id} | Email: ${d.data().email || d.data().Email} | Role: ${d.data().role}`);
    });

    const guidesSnap = await getDocs(collection(db, 'guides'));
    console.log(`'guides' collection docs count: ${guidesSnap.docs.length}`);
    if (guidesSnap.docs.length > 0) {
      console.log(` - Guide 0: ID=${guidesSnap.docs[0].id}, Email=${guidesSnap.docs[0].data().email || guidesSnap.docs[0].data().Email}`);
    }

    const facultySnap = await getDocs(collection(db, 'classroomFaculty'));
    console.log(`'classroomFaculty' collection docs count: ${facultySnap.docs.length}`);
    if (facultySnap.docs.length > 0) {
      console.log(` - Faculty 0: ID=${facultySnap.docs[0].id}, Email=${facultySnap.docs[0].data().email || facultySnap.docs[0].data().Email}`);
    }

    const reviewersSnap = await getDocs(collection(db, 'reviewers'));
    console.log(`'reviewers' collection docs count: ${reviewersSnap.docs.length}`);
    if (reviewersSnap.docs.length > 0) {
      console.log(` - Reviewer 0: ID=${reviewersSnap.docs[0].id}, Email=${reviewersSnap.docs[0].data().email || reviewersSnap.docs[0].data().Email}`);
    }

  } catch (err) {
    console.error("Firestore read error:", err);
  }

  console.log("\n=== TEST AUTHENTICATION CREDENTIALS ===");
  const testCredentials = [
    { label: 'ADMIN', email: 'admin@kluniversity.in', pass: 'Admin@123' },
    { label: 'GUIDE', email: 'guide01@kluniversity.in', pass: 'Guide@123' },
    { label: 'FACULTY', email: 'faculty01@kluniversity.in', pass: 'Faculty@123' },
    { label: 'REVIEWER', email: 'reviewer01@kluniversity.in', pass: 'Reviewer@123' },
    { label: 'STUDENT', email: '2200030001@kluniversity.in', pass: 'Student@123' }
  ];

  for (const cred of testCredentials) {
    try {
      const res = await signInWithEmailAndPassword(auth, cred.email, cred.pass);
      console.log(`[PASS] ${cred.label} (${cred.email}): AUTH SUCCESS! UID=${res.user.uid}`);
    } catch (err) {
      console.error(`[FAIL] ${cred.label} (${cred.email}): Code=${err.code} | Message=${err.message}`);
    }
  }
}

testAuth();
