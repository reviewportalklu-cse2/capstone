import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { firebaseConfig } from '../src/firebase/config.js';

const app = initializeApp(firebaseConfig, 'test-pass-change');
const auth = getAuth(app);

async function testPassChange() {
  const testEmail = `pass_test_${Date.now()}@university.edu`;
  const initialPass = '889973';
  const newPass = 'NewSecure@Password2026';

  console.log('1. Creating account in Firebase Auth with initial pass:', initialPass);
  const cred = await createUserWithEmailAndPassword(auth, testEmail, initialPass);
  console.log('Created UID:', cred.user.uid);

  console.log('2. Reauthenticating with initial pass and updating to newPass...');
  const credential = EmailAuthProvider.credential(testEmail, initialPass);
  await reauthenticateWithCredential(cred.user, credential);
  await updatePassword(cred.user, newPass);
  console.log('Password successfully updated in Firebase Auth!');

  console.log('3. Testing sign-in with initial pass (should FAIL):');
  try {
    await signInWithEmailAndPassword(auth, testEmail, initialPass);
    console.error('ERROR: Initial pass still worked!');
  } catch (err) {
    console.log('PASS: Initial pass failed with:', err.code);
  }

  console.log('4. Testing sign-in with new pass (should SUCCEED):');
  const newCred = await signInWithEmailAndPassword(auth, testEmail, newPass);
  console.log('PASS: Sign-in with new pass succeeded! UID:', newCred.user.uid);

  await deleteUser(newCred.user);
  console.log('Cleaned up test user.');
}

testPassChange().catch(console.error);
