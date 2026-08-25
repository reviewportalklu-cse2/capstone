import puppeteer from 'puppeteer';
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
  addDoc
} from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "final-year-project-erp.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "final-year-project-erp",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "final-year-project-erp.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1094425001784",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BASE_URL = 'http://localhost:5173';

const logHeader = (msg) => {
  console.log(`\n==================================================`);
  console.log(` ${msg}`);
  console.log(`==================================================`);
};

async function executeInitialAudit() {
  logHeader("PHASE XXX — COMPREHENSIVE INITIAL AUDIT (NO CODE MODIFICATIONS)");

  const report = {};
  const perfData = {};
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Extension') && !text.includes('favicon')) {
        console.error(`[BROWSER CONSOLE ERROR] ${text}`);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE UNCAUGHT EXCEPTION]`, err.message);
    consoleErrors.push(err.message);
  });

  try {
    // --------------------------------------------------
    // 1. ADMIN AUTH & DASHBOARD
    // --------------------------------------------------
    logHeader("1. ADMIN AUTHENTICATION & INITIAL DASHBOARD");
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'cse2admin@kluniversity.in');
    await page.type('input[type="password"]', 'cse2-2026');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3000));

    const postAdminUrl = page.url();
    console.log("Admin Post-Login URL:", postAdminUrl);
    report.adminAuth = postAdminUrl.includes('/admin') ? 'PASS' : 'FAIL';

    // --------------------------------------------------
    // 2. ADMIN MASTER DATA & CATEGORY SWITCHING PERFORMANCE
    // --------------------------------------------------
    logHeader("2. ADMIN MASTER DATA & CATEGORY NAVIGATION PERFORMANCE");
    const adminRoutes = [
      { name: 'Dashboard', path: '/admin/dashboard' },
      { name: 'Students', path: '/admin/students' },
      { name: 'Teams & Groups', path: '/admin/teams' },
      { name: 'Projects', path: '/admin/projects' },
      { name: 'Guides', path: '/admin/guides' },
      { name: 'Classroom Faculty', path: '/admin/faculty' },
      { name: 'Reviewers', path: '/admin/reviewers' },
      { name: 'Rubrics', path: '/admin/rubrics' },
      { name: 'Review Cycles', path: '/admin/review-cycles' },
      { name: 'Evaluation Center', path: '/admin/evaluation-center' },
      { name: 'Bulk Upload Center', path: '/admin/sync' },
      { name: 'Settings', path: '/admin/settings' },
      { name: 'Notifications', path: '/admin/notifications' }
    ];

    let masterDataPass = true;
    for (const r of adminRoutes) {
      const start = Date.now();
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await new Promise(res => setTimeout(res, 800));
      const duration = Date.now() - start;
      perfData[`Admin -> ${r.name}`] = `${duration} ms`;
      console.log(`[PERF] Admin -> ${r.name} (${r.path}): ${duration} ms`);

      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('TypeError') || text.includes('ReferenceError') || text.includes('Unhandled Rejection')) {
        console.error(`❌ Page ${r.name} contains runtime errors!`);
        masterDataPass = false;
      }
    }
    report.adminMasterData = masterDataPass ? 'PASS' : 'FAIL';

    // --------------------------------------------------
    // 3. EVALUATOR AUTH & MULTI-ROLE TESTING (ashrith3155@kluniversity.in)
    // --------------------------------------------------
    logHeader("3. EVALUATOR AUTHENTICATION & MULTI-ROLE TESTING");
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
    await page.type('input[type="password"]', '2056');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3000));
    console.log("Evaluator Post-Login URL:", page.url());

    // Check Firebase Auth directly for ashrith3155@kluniversity.in
    let evaluatorUser = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, 'ashrith3155@kluniversity.in', '2056');
      evaluatorUser = cred.user;
      console.log("✅ Firebase Auth Evaluator login succeeded. UID:", evaluatorUser.uid);
      report.evaluatorAuth = 'PASS';
    } catch (e) {
      console.error("❌ Evaluator Firebase Auth failed:", e.message);
      report.evaluatorAuth = 'FAIL';
    }

    // Inspect Firestore userRole document for ashrith3155@kluniversity.in
    if (evaluatorUser) {
      const userRoleSnap = await getDoc(doc(db, 'userRoles', evaluatorUser.uid));
      console.log("Evaluator userRoles data:", userRoleSnap.exists() ? userRoleSnap.data() : "NOT FOUND");
    }

    // --------------------------------------------------
    // 4. EVALUATOR CATEGORY SWITCHING PERFORMANCE
    // --------------------------------------------------
    logHeader("4. EVALUATOR CATEGORY SWITCHING PERFORMANCE");
    const evaluatorRoutes = [
      { name: 'Guide Dashboard', path: '/guide/dashboard' },
      { name: 'Guide Evaluations', path: '/guide/evaluations' },
      { name: 'Guide Meetings', path: '/guide/meetings' },
      { name: 'Faculty Dashboard', path: '/faculty/dashboard' },
      { name: 'Faculty Evaluations', path: '/faculty/evaluations' },
      { name: 'Reviewer Dashboard', path: '/reviewer/dashboard' },
      { name: 'Reviewer Evaluations', path: '/reviewer/evaluations' }
    ];

    for (const r of evaluatorRoutes) {
      const start = Date.now();
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await new Promise(res => setTimeout(res, 800));
      const duration = Date.now() - start;
      perfData[`Evaluator -> ${r.name}`] = `${duration} ms`;
      console.log(`[PERF] Evaluator -> ${r.name} (${r.path}): ${duration} ms`);
    }

    // --------------------------------------------------
    // 5. SECURITY & DATABASE INTEGRITY AUDIT
    // --------------------------------------------------
    logHeader("5. SECURITY & DATABASE WRITE INTEGRITY AUDIT");
    
    // Check plaintext passwords in Firestore
    const [userRolesSnap, usersSnap, studentsSnap, guidesSnap, facultySnap, reviewersSnap, evalsSnap] = await Promise.all([
      getDocs(collection(db, 'userRoles')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'guides')),
      getDocs(collection(db, 'classroomFaculty')),
      getDocs(collection(db, 'reviewers')),
      getDocs(collection(db, 'evaluations'))
    ]);

    let plainPasswordExposed = false;
    const checkSec = (snap, colName) => {
      snap.forEach(d => {
        const data = d.data();
        if (data.password || data.initialPassword || data.plainPassword || data.userPassword) {
          console.error(`❌ SECURITY AUDIT FAIL: Plaintext password field found in collection ${colName}, doc ID ${d.id}`);
          plainPasswordExposed = true;
        }
      });
    };

    checkSec(userRolesSnap, 'userRoles');
    checkSec(usersSnap, 'users');
    checkSec(studentsSnap, 'students');
    checkSec(guidesSnap, 'guides');
    checkSec(facultySnap, 'classroomFaculty');
    checkSec(reviewersSnap, 'reviewers');

    report.passwordSecurity = plainPasswordExposed ? 'FAIL' : 'PASS';
    console.log(`Plaintext Password Security Audit: ${report.passwordSecurity}`);

    // Check Evaluations Data Integrity
    let evalsIntegrity = true;
    let evalCount = 0;
    evalsSnap.forEach(d => {
      evalCount++;
      const data = d.data();
      if (!data.teamId || !data.role || !data.evaluatorId || !data.status) {
        console.error(`❌ Database Integrity FAIL: Evaluation ${d.id} is missing core metadata!`);
        evalsIntegrity = false;
      }
    });

    console.log(`Total Evaluations in Firestore: ${evalCount}`);
    report.databaseIntegrity = (evalsIntegrity && evalCount > 0) ? 'PASS' : 'FAIL';

    // --------------------------------------------------
    // 6. CONSOLE AUDIT SUMMARY
    // --------------------------------------------------
    logHeader("6. CONSOLE AUDIT SUMMARY");
    console.log(`Total Application Console Errors: ${consoleErrors.length}`);
    report.consoleAudit = consoleErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (err) {
    console.error("❌ Exception during Initial Audit:", err);
  } finally {
    await browser.close();
  }

  logHeader("INITIAL AUDIT SUMMARY REPORT");
  console.table(report);

  logHeader("INITIAL NAVIGATION LATENCY REPORT");
  console.table(perfData);

  return { report, perfData, consoleErrors };
}

executeInitialAudit();
