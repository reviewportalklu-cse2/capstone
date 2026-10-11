import { memberService } from '../src/firebase/services/memberService.js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config.js';

const app = initializeApp(firebaseConfig, 'direct-test-app');
const auth = getAuth(app);
const db = getFirestore(app);

async function testDirect() {
  const testEmail = `direct_test_${Date.now()}@university.edu`;
  const testEmpId = `99${Math.floor(1000 + Math.random() * 9000)}`;
  const testName = 'Dr. Direct Test Member';

  console.log(`Testing direct memberService.createMember for: ${testEmail} / ${testEmpId}`);

  const res = await memberService.createMember({
    name: testName,
    employeeId: testEmpId,
    email: testEmail,
    department: 'Computer Science & Engineering',
    availableRoles: ['guide', 'classroom_faculty', 'reviewer']
  });

  console.log("createMember returned:", res);

  // Check Firestore userRoles
  const roleDoc = await getDoc(doc(db, 'userRoles', res.uid));
  console.log("userRoles doc exists:", roleDoc.exists(), roleDoc.data());

  // Check Firestore users
  const userDoc = await getDoc(doc(db, 'users', res.uid));
  console.log("users doc exists:", userDoc.exists(), userDoc.data());

  // Check guides
  const guideDoc = await getDoc(doc(db, 'guides', testEmpId));
  console.log("guides doc exists:", guideDoc.exists(), guideDoc.data()?.name);

  // Check auth login with initial password (testEmpId)
  console.log("Attempting signInWithEmailAndPassword with initial password (testEmpId)...");
  const cred = await signInWithEmailAndPassword(auth, testEmail, testEmpId);
  console.log("Auth login succeeded! User UID:", cred.user.uid);

  // Cleanup
  await deleteUser(cred.user);
  await deleteDoc(doc(db, 'users', res.uid));
  await deleteDoc(doc(db, 'userRoles', res.uid));
  await deleteDoc(doc(db, 'guides', testEmpId));
  await deleteDoc(doc(db, 'classroomFaculty', testEmpId));
  await deleteDoc(doc(db, 'reviewers', testEmpId));
  console.log("Cleaned up successfully!");
}

testDirect().catch(console.error);
