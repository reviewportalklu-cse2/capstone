import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

const emailsToTest = [
  'admin@university.edu',
  'admin@kluniversity.in',
  'admin@klu.edu.in',
  'guide01@university.edu',
  'guide1@klu.edu.in',
  'guide01@klu.edu.in',
  'guide.g001@kluniversity.in',
  'faculty01@university.edu',
  'faculty1@klu.edu.in',
  'faculty01@klu.edu.in',
  'faculty.f001@kluniversity.in',
  'reviewer01@university.edu',
  'reviewer1@klu.edu.in',
  'reviewer01@klu.edu.in',
  'reviewer.r001@kluniversity.in',
  'student01@university.edu',
  'student1@klu.edu.in',
  '2200030001@kluniversity.in',
  '220003001@kluniversity.in'
];

const passwordsToTest = [
  'Admin@123', 'admin123', 'Password@123', 'password123', '123456', 'password',
  'Guide@123', 'guide123', 'Faculty@123', 'faculty123',
  'Reviewer@123', 'reviewer123', 'Student@123', 'student123',
  'P@ssword123', 'Welcome@123', 'Kl@123456', 'Klu@123456', 'Pass@123', 'Admin@1234'
];

async function run() {
  console.log("=== TESTING ALL COMBINATIONS ===");
  for (const email of emailsToTest) {
    let success = false;
    for (const pass of passwordsToTest) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        console.log(`[FOUND VALID AUTH!] Email: ${email} | Password: "${pass}" | UID: ${res.user.uid}`);
        success = true;
        break;
      } catch (e) {
        // Continue testing
      }
    }
    if (!success) {
      // console.log(`No password matched for ${email}`);
    }
  }
}

run();
