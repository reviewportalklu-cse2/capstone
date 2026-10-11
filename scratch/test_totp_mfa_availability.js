import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  multiFactor, 
  TotpMultiFactorGenerator, 
  getMultiFactorResolver 
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

async function checkTotpMfa() {
  console.log("=== CHECKING FIREBASE TOTP MFA CAPABILITY ===");
  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@university.edu', 'Admin@123');
    console.log("Logged in successfully as admin:", cred.user.email);
    console.log("Enrolled factors:", multiFactor(cred.user).enrolledFactors);

    // Try getting multi-factor session
    console.log("Requesting multiFactor session...");
    const mfaSession = await multiFactor(cred.user).getSession();
    console.log("MultiFactor session obtained successfully:", !!mfaSession);

    // Try generating TOTP secret
    console.log("Attempting TotpMultiFactorGenerator.generateSecret...");
    const totpSecret = await TotpMultiFactorGenerator.generateSecret(mfaSession);
    console.log("TOTP secret generated successfully!");
    console.log("Secret key exists:", !!totpSecret.secretKey);
    console.log("QR Code URI:", totpSecret.generateQrCodeUrl('admin@university.edu', 'KL CSE Capstone'));
    console.log(">> CONCLUSION: Firebase TOTP MFA is AVAILABLE and Identity Platform is ENABLED!");
  } catch (error) {
    console.error(">> TOTP MFA CHECK ERROR:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    if (error.code === 'auth/operation-not-allowed' || 
        error.code === 'auth/configuration-not-found' ||
        error.code === 'auth/unsupported-first-factor' ||
        error.message?.includes('Identity Platform') ||
        error.message?.includes('multi-factor')) {
      console.log(">> CONCLUSION: Firebase Authentication with Identity Platform / TOTP MFA is NOT enabled for this project.");
    }
  }
}

checkTotpMfa();
