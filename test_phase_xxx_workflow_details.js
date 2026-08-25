import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

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

const BASE_URL = 'http://localhost:5173';

async function testDetailedWorkflows() {
  console.log("===============================================================");
  console.log("   DETAILED WORKFLOW AUDIT & FIRESTORE INTEGRITY VERIFICATION  ");
  console.log("===============================================================\n");

  const auditData = {
    evaluationsCount: 0,
    rolesRepresented: [],
    teamsEvaluated: [],
    pendingCount: 0,
    notificationDelivered: false,
    plainPasswordFound: false
  };

  // 1. Check Firestore collections directly
  const [teamsSnap, evalSnap, notifSnap, userRolesSnap] = await Promise.all([
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'evaluations')),
    getDocs(collection(db, 'notifications')),
    getDocs(collection(db, 'userRoles'))
  ]);

  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const evals = evalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const notifs = notifSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  auditData.evaluationsCount = evals.length;
  evals.forEach(e => {
    if (e.role && !auditData.rolesRepresented.includes(e.role)) {
      auditData.rolesRepresented.push(e.role);
    }
    if (e.teamId && !auditData.teamsEvaluated.includes(e.teamId)) {
      auditData.teamsEvaluated.push(e.teamId);
    }
  });

  console.log(`[FIRESTORE AUDIT] Total Teams: ${teams.length}`);
  console.log(`[FIRESTORE AUDIT] Total Evaluations: ${evals.length}`);
  console.log(`[FIRESTORE AUDIT] Evaluation Roles Represented: ${auditData.rolesRepresented.join(', ')}`);
  console.log(`[FIRESTORE AUDIT] Teams Evaluated: ${auditData.teamsEvaluated.join(', ')}`);

  // 2. Test Admin Notification Creation
  console.log("\n[NOTIFICATION TEST] Sending test notification to Everyone...");
  const newNotif = {
    title: "Phase XXX Production E2E Audit Notification",
    message: "This is a test notification for Phase XXX verification.",
    targetAudience: "everyone",
    recipientType: "global",
    createdAt: new Date().toISOString(),
    createdBy: "cse2admin@kluniversity.in",
    readBy: []
  };

  const notifRef = await addDoc(collection(db, 'notifications'), newNotif);
  console.log(`✅ Created test notification document ID: ${notifRef.id}`);

  // Clean up test notification
  await deleteDoc(doc(db, 'notifications', notifRef.id));
  console.log(`✅ Cleaned up test notification.`);

  return auditData;
}

testDetailedWorkflows();
