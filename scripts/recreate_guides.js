import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID?.replace(/,+$/, '')
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
  console.log("Creating Guides...");
  const timestamp = new Date().toISOString();
  
  for (let i = 1; i <= 10; i++) {
    const index = i.toString().padStart(2, '0');
    const email = `guide${index}@university.edu`;
    const employeeId = `EMP${1000 + i}`;
    
    const uid = `guide_${index}`; 
    
    const data = {
      uid: uid,
      employeeId: employeeId,
      name: `Guide ${index}`,
      email: email,
      department: 'CSE',
      assignedStudents: [],
      assignedTeams: [],
      studentCount: 0,
      status: 'Active',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    try {
      await setDoc(doc(db, 'guides', uid), data);
      console.log(`✅ Guide ${index} Synced`);
    } catch (error) {
      console.error(`Failed Guide ${index}:`, error.message);
    }
  }
  console.log("Done.");
  process.exit(0);
};

run();
