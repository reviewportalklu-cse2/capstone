import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testUsers = [
  { email: 'student1@klu.edu.in', password: 'password123', role: 'student' },
  { email: 'guide1@klu.edu.in', password: 'password123', role: 'guide' },
  { email: 'faculty1@klu.edu.in', password: 'password123', role: 'classroom_faculty' },
  { email: 'reviewer1@klu.edu.in', password: 'password123', role: 'reviewer' },
  { email: 'guide01@university.edu', password: 'password123', role: 'guide' }, // The one the user used
];

async function createAccounts() {
  for (const u of testUsers) {
    try {
      let user;
      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        user = cred.user;
        console.log(`Created account for ${u.email}`);
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          console.log(`Account ${u.email} already exists. Signing in...`);
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          user = cred.user;
        } else {
          throw e;
        }
      }
      
      // Assign role in users collection
      await setDoc(doc(db, "users", user.uid), {
        email: u.email,
        role: u.role,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`Assigned role ${u.role} to ${u.email}`);
      
    } catch (error) {
      console.error(`Error processing ${u.email}:`, error.message);
    }
  }
  
  process.exit(0);
}

createAccounts();
