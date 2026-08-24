import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const env = process.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAshrithEvaluator() {
  console.log("===============================================================");
  console.log("   PROVISIONING TEST EVALUATOR: ashrith3155@kluniversity.in    ");
  console.log("===============================================================\n");

  const email = 'ashrith3155@kluniversity.in';
  const initialPassword = '2056';
  // Candidate password for Firebase Auth minimum 6 char requirement: '002056'
  const authPassword = initialPassword.padStart(6, '0');

  let uid = null;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, authPassword);
    uid = cred.user.uid;
    console.log(`[AUTH] Created new Firebase Auth account for ${email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        const sCred = await signInWithEmailAndPassword(auth, email, authPassword);
        uid = sCred.user.uid;
        console.log(`[AUTH] Verified existing Firebase Auth account for ${email} (UID: ${uid})`);
      } catch (sErr) {
        console.log(`[AUTH NOTICE] Account exists. Using fallback auth login or alias.`);
      }
    } else {
      console.error(`[AUTH ERROR]`, err.message);
    }
  }

  // Find primary test team ID
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const primaryTeam = teams.find(t => String(t.id || t.teamId).toLowerCase() === 't001' || String(t.id || t.teamId).toLowerCase() === 't01') || teams[0];
  const targetTeamId = primaryTeam?.id || primaryTeam?.teamId || 'T001';

  console.log(`[TARGET TEAM] Linking test evaluator to Team '${targetTeamId}'`);

  const now = new Date().toISOString();
  const docUid = uid || 'ashrith3155_uid';

  // 1. userRoles Document
  await setDoc(doc(db, 'userRoles', docUid), {
    uid: docUid,
    email,
    availableRoles: ['guide', 'classroom_faculty', 'reviewer'],
    defaultRole: 'guide',
    requiresPasswordChange: false,
    updatedAt: now
  }, { merge: true });
  console.log(`[FIRESTORE] Saved 'userRoles/${docUid}' (availableRoles: ['guide', 'classroom_faculty', 'reviewer'])`);

  // 2. users Document
  await setDoc(doc(db, 'users', docUid), {
    uid: docUid,
    email,
    name: 'Ashrith Test Evaluator',
    role: 'guide',
    requiresPasswordChange: false,
    updatedAt: now
  }, { merge: true });
  console.log(`[FIRESTORE] Saved 'users/${docUid}'`);

  // 3. guides Document
  await setDoc(doc(db, 'guides', 'G-ASHRITH'), {
    id: 'G-ASHRITH',
    guideId: 'G-ASHRITH',
    employeeId: '3155',
    name: 'Ashrith Test Evaluator',
    email,
    department: 'Computer Science & Engineering',
    designation: 'Professor',
    status: 'Active',
    updatedAt: now
  }, { merge: true });
  console.log(`[FIRESTORE] Saved 'guides/G-ASHRITH'`);

  // 4. classroomFaculty Document
  await setDoc(doc(db, 'classroomFaculty', 'F-ASHRITH'), {
    id: 'F-ASHRITH',
    facultyId: 'F-ASHRITH',
    employeeId: '3155',
    name: 'Ashrith Test Evaluator',
    email,
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    status: 'Active',
    updatedAt: now
  }, { merge: true });
  console.log(`[FIRESTORE] Saved 'classroomFaculty/F-ASHRITH'`);

  // 5. reviewers Document
  await setDoc(doc(db, 'reviewers', 'R-ASHRITH'), {
    id: 'R-ASHRITH',
    reviewerId: 'R-ASHRITH',
    employeeId: '3155',
    name: 'Ashrith Test Evaluator',
    email,
    department: 'Computer Science & Engineering',
    designation: 'Senior Evaluator',
    reviewerType: 'Internal',
    status: 'Active',
    updatedAt: now
  }, { merge: true });
  console.log(`[FIRESTORE] Saved 'reviewers/R-ASHRITH'`);

  // 6. Assignments
  await setDoc(doc(db, 'guideAssignments', `ga-${targetTeamId.toLowerCase()}`), {
    id: `ga-${targetTeamId.toLowerCase()}`,
    teamId: targetTeamId,
    guideId: 'G-ASHRITH',
    employeeId: '3155',
    guideEmail: email,
    guideName: 'Ashrith Test Evaluator',
    status: 'Active',
    updatedAt: now
  }, { merge: true });

  await setDoc(doc(db, 'facultyAssignments', `fa-${targetTeamId.toLowerCase()}`), {
    id: `fa-${targetTeamId.toLowerCase()}`,
    teamId: targetTeamId,
    facultyId: 'F-ASHRITH',
    employeeId: '3155',
    facultyEmail: email,
    facultyName: 'Ashrith Test Evaluator',
    status: 'Active',
    updatedAt: now
  }, { merge: true });

  await setDoc(doc(db, 'reviewerAssignments', `ra-${targetTeamId.toLowerCase()}`), {
    id: `ra-${targetTeamId.toLowerCase()}`,
    teamId: targetTeamId,
    reviewerId: 'R-ASHRITH',
    employeeId: '3155',
    reviewerEmail: email,
    reviewerName: 'Ashrith Test Evaluator',
    status: 'Active',
    updatedAt: now
  }, { merge: true });

  console.log(`[FIRESTORE] Assigned 'Ashrith Test Evaluator' to Team '${targetTeamId}' as Guide, Faculty, and Reviewer.`);

  console.log("\n===============================================================");
  console.log("   PROVISIONING COMPLETE FOR ashrith3155@kluniversity.in        ");
  console.log("===============================================================");

  process.exit(0);
}

setupAshrithEvaluator();
