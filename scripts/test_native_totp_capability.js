import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  multiFactor, 
  TotpMultiFactorGenerator 
} from 'firebase/auth';
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

async function testNativeTotpCapability() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@university.edu', 'Admin@123');
    const user = cred.user;

    const mfaSession = await multiFactor(user).getSession();
    const totpSecret = await TotpMultiFactorGenerator.generateSecret(mfaSession);

    // If reached here without error, TOTP is supported and enabled on the Firebase project
    console.log("TOTP_SUPPORTED");
  } catch (error) {
    console.log("TOTP_NOT_ENABLED");
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
  }
}

testNativeTotpCapability();
