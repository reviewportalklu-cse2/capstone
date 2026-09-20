import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc',
  authDomain: 'final-year-project-erp.firebaseapp.com',
  projectId: 'final-year-project-erp',
  storageBucket: 'final-year-project-erp.firebasestorage.app',
  messagingSenderId: '1094425001784',
  appId: '1:1094425001784:web:8d5a03125e1434f2778bcd'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replicate userResolver logic
async function resolve(user, role) {
  const email = user.email;
  const colMap = {
    'student': 'students',
    'guide': 'guides',
    'classroom_faculty': 'classroomFaculty',
    'faculty': 'classroomFaculty',
    'reviewer': 'reviewers',
    'admin': 'users'
  };
  const collectionName = colMap[role];
  const snap = await getDocs(collection(db, collectionName));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Role: ${role}, Collection: ${collectionName}, total docs: ${docs.length}`);
  const match = docs.find(d => (d.email || d.Email || '').toLowerCase() === email.toLowerCase());
  console.log(`Match in ${collectionName}:`, match);
  if (!match) {
    const collectionsToTry = [collectionName, 'guides', 'classroomFaculty', 'reviewers'];
    for (const c of collectionsToTry) {
      const s = await getDocs(collection(db, c));
      const m = s.docs.map(d => ({ id: d.id, ...d.data() })).find(d => (d.email || d.Email || '').toLowerCase() === email.toLowerCase());
      if (m) {
        console.log(`Fallback matched in ${c}:`, m);
        return m;
      }
    }
  }
  return match;
}

async function run() {
  const mockUser = { uid: 'qyAuSuSEtFbh72ozydf8rFVlnTm2', email: 'ashrith3155@kluniversity.in', displayName: 'Ashrith Test Evaluator' };
  for (const r of ['guide', 'classroom_faculty', 'reviewer']) {
    const res = await resolve(mockUser, r);
    console.log(`Resolved for ${r}:`, res);
  }
}

run().then(() => process.exit(0));
