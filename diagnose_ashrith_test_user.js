import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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

async function inspectUser() {
  const { userRoleService } = await import('./src/firebase/services/userRoleService.js');
  const { resolveGuideRelationships, resolveFacultyRelationships, resolveReviewerRelationships } = await import('./src/utils/relationshipResolver.js');

  console.log("===============================================================");
  console.log("   EVALUATOR TEST USER DIAGNOSTIC: ashrith3155@kluniversity.in ");
  console.log("===============================================================\n");

  const targetEmail = 'ashrith3155@kluniversity.in';
  
  // 1. Check userRoles collection
  const userRolesSnap = await getDocs(collection(db, 'userRoles'));
  let roleDocData = null;
  let userUid = null;

  userRolesSnap.docs.forEach(d => {
    const data = d.data();
    if (data.email && data.email.toLowerCase() === targetEmail) {
      roleDocData = data;
      userUid = d.id;
    }
  });

  console.log("1. FIRESTORE 'userRoles' RECORD:", roleDocData || 'NOT FOUND');

  // 2. Discover roles across collections
  const discovered = await userRoleService.discoverRoles(targetEmail);
  console.log("2. DISCOVERED ROLES FOR EMAIL:", discovered);

  // 3. Fetch domain records (guides, classroomFaculty, reviewers, students, teams, guideAssignments, facultyAssignments, reviewerAssignments)
  const [guidesSnap, facultySnap, reviewersSnap, teamsSnap, guideAssignSnap, facultyAssignSnap, reviewerAssignSnap, studentsSnap] = await Promise.all([
    getDocs(collection(db, 'guides')),
    getDocs(collection(db, 'classroomFaculty')),
    getDocs(collection(db, 'reviewers')),
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'guideAssignments')),
    getDocs(collection(db, 'facultyAssignments')),
    getDocs(collection(db, 'reviewerAssignments')),
    getDocs(collection(db, 'students'))
  ]);

  const guides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const faculty = facultySnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const reviewers = reviewersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guideAssignments = guideAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const facultyAssignments = facultyAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const reviewerAssignments = reviewerAssignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const guideObj = guides.find(g => g.email && g.email.toLowerCase() === targetEmail);
  const facultyObj = faculty.find(f => f.email && f.email.toLowerCase() === targetEmail);
  const reviewerObj = reviewers.find(r => r.email && r.email.toLowerCase() === targetEmail);

  console.log("3. DOMAIN MATCHES:", {
    guide: guideObj ? { id: guideObj.id, name: guideObj.name, empId: guideObj.employeeId } : 'None',
    faculty: facultyObj ? { id: facultyObj.id, name: facultyObj.name, empId: facultyObj.employeeId } : 'None',
    reviewer: reviewerObj ? { id: reviewerObj.id, name: reviewerObj.name, empId: reviewerObj.employeeId } : 'None'
  });

  const guideRel = resolveGuideRelationships(guideObj || { email: targetEmail }, { teams, students, guideAssignments });
  const facRel = resolveFacultyRelationships(facultyObj || { email: targetEmail }, { teams, students, facultyAssignments });
  const revRel = resolveReviewerRelationships(reviewerObj || { email: targetEmail }, { teams, students, reviewerAssignments });

  console.log("4. ASSIGNED TEAMS PER ROLE:", {
    guideTeams: guideRel.teams.map(t => t.id || t.teamId),
    facultyTeams: facRel.teams.map(t => t.id || t.teamId),
    reviewerTeams: revRel.teams.map(t => t.id || t.teamId)
  });

  // 4. Test Client Authentication
  try {
    const authRes = await signInWithEmailAndPassword(auth, targetEmail, '2056');
    console.log(`5. AUTHENTICATION TEST WITH INITIAL PASSWORD ('2056'): SUCCESS (UID: ${authRes.user.uid})`);
  } catch (err) {
    console.log(`5. AUTHENTICATION TEST WITH INITIAL PASSWORD ('2056'): ${err.code || err.message}`);
  }

  process.exit(0);
}

inspectUser();
