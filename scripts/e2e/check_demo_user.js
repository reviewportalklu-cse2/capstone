import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function check() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const q = query(collection(db, 'users'), where('email', '==', 'demovisit@gmail.com'));
  const snap = await getDocs(q);
  console.log("users docs for demovisit@gmail.com:", snap.size);
  snap.forEach(d => console.log(d.id, d.data()));

  const allUsersSnap = await getDocs(collection(db, 'users'));
  console.log("Total users in Firestore:", allUsersSnap.size);
  allUsersSnap.forEach(d => {
    if (d.data().email?.includes('demo') || d.data().role?.includes('demo')) {
      console.log("Found demo in users:", d.id, d.data());
    }
  });
}

check();
