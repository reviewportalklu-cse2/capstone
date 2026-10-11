import puppeteer from 'puppeteer';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig, 'test-verifier-app');
const auth = getAuth(app);
const db = getFirestore(app);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runTests() {
  console.log("=== STARTING CAPSTONE UPDATE 1 & UPDATE 2 VERIFICATION ===");
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => {
    console.log('[BROWSER]', msg.type(), msg.text());
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: GUIDE PROFILE PAGE FLOW & DATA RESOLUTION
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Guide Profile Page Flow (Dr. P V Anusha)...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    // Fill login form
    await page.type('#email', 'pvenkataanusha@kluniversity.in');
    await page.type('#password', '8137');
    await page.click('button[type="submit"]');

    // Wait for in-app navigation away from login
    console.log("- Waiting for login transition...");
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    console.log("- Current page after login:", await page.evaluate(() => window.location.pathname));

    // Direct navigation to /guide/profile
    console.log("- Navigating directly to /guide/profile...");
    await page.goto('http://localhost:5173/guide/profile', { waitUntil: 'networkidle2' });
    
    // Wait for profile container to render
    await page.waitForSelector('h1', { timeout: 15000 });
    await delay(1500);

    const currentUrl = await page.evaluate(() => window.location.pathname);
    const profileText = await page.evaluate(() => document.body.innerText);
    const profileHtml = await page.evaluate(() => document.body.innerHTML);
    const lowerText = profileText.toLowerCase();
    const lowerHtml = profileHtml.toLowerCase();

    const hasName = lowerText.includes('anusha');
    const hasEmpId = lowerText.includes('8137');
    const hasEmail = lowerHtml.includes('pvenkataanusha@kluniversity.in');
    const hasRolesSection = lowerText.includes('assigned roles');

    console.log(`- Profile Loaded at ${currentUrl}: Name found: ${hasName}, Emp ID found: ${hasEmpId}, Email found: ${hasEmail}, Roles found: ${hasRolesSection}`);
    if (!hasName || !hasEmpId) {
      throw new Error(`Guide profile failed to display correct information. Page text snippet:\n${profileText.slice(0, 500)}`);
    }
    console.log(">>> TEST 1 PASSED: Guide Profile page works seamlessly with real evaluator data!");

    // Clear session for next test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // -------------------------------------------------------------
    // TEST 2: ADMIN MEMBERS MANAGEMENT PAGE & DUPLICATE CHECKS
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Admin Members Management UI & Functionality...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('#email', 'admin@university.edu');
    await page.type('#password', 'cse2-2026');
    await page.click('button[type="submit"]');

    // Wait for in-app navigation away from login
    console.log("- Waiting for admin login transition...");
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    console.log("- Current page after admin login:", await page.evaluate(() => window.location.pathname));

    // Navigate to /admin/members
    console.log("- Navigating directly to /admin/members...");
    await page.goto('http://localhost:5173/admin/members', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 15000 });
    await delay(2000);

    const adminPageText = await page.evaluate(() => document.body.innerText);
    const lowerAdminText = adminPageText.toLowerCase();
    const hasMembersHeader = lowerAdminText.includes('evaluator & faculty members');
    const hasStats = lowerAdminText.includes('total members') && lowerAdminText.includes('guides');
    const hasAddBtn = lowerAdminText.includes('add member');

    console.log(`- Admin Members Page: Header found: ${hasMembersHeader}, Stats found: ${hasStats}, Add Button found: ${hasAddBtn}`);
    if (!hasMembersHeader || !hasStats) {
      throw new Error(`Admin Members page did not render properly. Snippet:\n${adminPageText.slice(0, 500)}`);
    }

    // Open Add Member Modal
    console.log("- Opening Add Member modal...");
    const addBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Add Member'));
    });
    if (addBtn) await addBtn.click();
    await delay(1000);

    // Check modal contents
    const modalText = await page.evaluate(() => document.body.innerText);
    const hasModalTitle = modalText.includes('Onboard Evaluator Member');
    const hasInitialPassNotice = modalText.includes('Initial Password Provisioning');
    console.log(`- Modal Loaded: Title found: ${hasModalTitle}, Initial Password notice: ${hasInitialPassNotice}`);

    // Try Duplicate Submission: Dr. P V Anusha (8137 / pvenkataanusha@kluniversity.in)
    console.log("- Testing Duplicate Detection...");
    await page.type('#memberName', 'Dr. Duplicate Test');
    await page.type('#employeeId', '8137');
    await page.type('#officialEmail', 'pvenkataanusha@kluniversity.in');
    
    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Onboard Member'));
    });
    if (submitBtn) await submitBtn.click();
    await delay(2500);

    const modalErrorText = await page.evaluate(() => document.body.innerText);
    const duplicateDetected = modalErrorText.includes('already exists');
    console.log(`- Duplicate detection result: ${duplicateDetected}`);
    if (!duplicateDetected) {
      throw new Error(`Duplicate check did not prevent duplicate member creation.`);
    }
    console.log(">>> Duplicate validation successfully caught existing member!");

    // Close Modal
    const cancelBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText === 'Cancel');
    });
    if (cancelBtn) await cancelBtn.click();
    await delay(1000);

    // -------------------------------------------------------------
    // TEST 3: PROVISION NEW MEMBER & FIRST LOGIN PASSWORD CHANGE
    // -------------------------------------------------------------
    const testEmpId = `99${Math.floor(1000 + Math.random() * 9000)}`;
    const testEmail = `test.faculty.${testEmpId}@kluniversity.in`;
    const testName = `Prof. Test Evaluator ${testEmpId}`;

    console.log(`\n[TEST 3] Provisioning Test Member (${testName}, ID: ${testEmpId}, Email: ${testEmail})...`);

    // Open Add Modal again
    const addBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Add Member'));
    });
    if (addBtn2) await addBtn2.click();
    await delay(1000);

    // Clear form inputs
    await page.evaluate(() => {
      const nameInput = document.querySelector('#memberName');
      const empInput = document.querySelector('#employeeId');
      const emailInput = document.querySelector('#officialEmail');
      if (nameInput) nameInput.value = '';
      if (empInput) empInput.value = '';
      if (emailInput) emailInput.value = '';
    });

    await page.type('#memberName', testName);
    await page.type('#employeeId', testEmpId);
    await page.type('#officialEmail', testEmail);

    // Select Reviewer role in addition to default Guide
    await page.click('#add-role-reviewer');
    await delay(500);

    const submitBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Onboard Member'));
    });
    if (submitBtn2) await submitBtn2.click();

    // Wait for creation to finish
    await delay(6000);

    // Check if created via Search filter
    await page.type('#membersSearchInput', testEmpId);
    await delay(1500);

    const pageAfterAdd = await page.evaluate(() => document.body.innerText);
    const memberAdded = pageAfterAdd.includes(testEmpId) || pageAfterAdd.includes(testName);
    console.log(`- Member found in table search: ${memberAdded}`);

    // Verify Firestore records
    console.log("- Checking Firestore documents created for member...");
    const guideDoc = await getDoc(doc(db, 'guides', testEmpId));
    const reviewerDoc = await getDoc(doc(db, 'reviewers', testEmpId));
    console.log(`- Guide Doc exists: ${guideDoc.exists()}, Reviewer Doc exists: ${reviewerDoc.exists()}`);

    if (!guideDoc.exists() || !reviewerDoc.exists()) {
      throw new Error(`Failed to onboard test member in Firestore! Guide: ${guideDoc.exists()}, Reviewer: ${reviewerDoc.exists()}`);
    }

    // Clear session and test first login as the new member
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log("\n- Logging in as newly created member with initial password (Employee ID)...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('#email', testEmail);
    await page.type('#password', testEmpId);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => !window.location.pathname.endsWith('/login'), { timeout: 15000 });
    const loginUrl = page.url();
    console.log(`- Current URL after login: ${loginUrl}`);
    const isFirstLoginGate = loginUrl.includes('first-login-password-change') || (await page.evaluate(() => document.body.innerText.toLowerCase().includes('first login')));
    console.log(`- Redirected to First Login Password Change gate: ${isFirstLoginGate}`);
    if (!isFirstLoginGate) {
      throw new Error(`New user was not redirected to first-login password change! URL: ${loginUrl}`);
    }

    // Attempt to reuse initial employee ID as new password
    console.log("- Attempting to set new password same as initial Employee ID...");
    await page.waitForSelector('#currentPassword', { timeout: 10000 });
    await page.type('#currentPassword', testEmpId);
    await page.type('#newPassword', testEmpId.padStart(6, '0'));
    await page.type('#confirmPassword', testEmpId.padStart(6, '0'));
    await page.click('button[type="submit"]');
    await delay(1500);

    const passwordErrorText = await page.evaluate(() => document.body.innerText);
    const passwordRejected = passwordErrorText.includes('cannot be the same as your initial Employee ID');
    console.log(`- Password reuse rejected: ${passwordRejected}`);
    if (!passwordRejected) {
      throw new Error(`First login flow allowed reusing employee ID as new password!`);
    }

    // Set a valid new password
    console.log("- Submitting valid new password (NewSecurePass2026!)...");
    await page.click('#newPassword', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#newPassword', 'NewSecurePass2026!');

    await page.click('#confirmPassword', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#confirmPassword', 'NewSecurePass2026!');

    await page.click('button[type="submit"]');

    await delay(2000);
    const formErr = await page.evaluate(() => {
      const err = document.querySelector('.text-red-600');
      return err ? err.innerText : null;
    });
    if (formErr) console.log("- Form error displayed:", formErr);

    await page.waitForFunction(() => !window.location.pathname.includes('first-login-password-change'), { timeout: 20000 });
    await delay(2000);

    const postChangeUrl = page.url();
    console.log(`- Current URL after password change: ${postChangeUrl}`);
    const reachedDashboard = postChangeUrl.includes('/guide') || postChangeUrl.includes('dashboard');
    console.log(`- Successfully transitioned to dashboard: ${reachedDashboard}`);

    // Verify user can now log in with the new password
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log("\n- Testing login with updated password...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', testEmail);
    await page.type('#password', 'NewSecurePass2026!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.endsWith('/login'), { timeout: 15000 });
    await delay(2000);

    const finalUrl = page.url();
    console.log(`- Final Login URL: ${finalUrl}`);
    const finalSuccess = finalUrl.includes('/guide') || finalUrl.includes('dashboard');
    if (!finalSuccess) {
      throw new Error(`Login with new password failed! URL: ${finalUrl}`);
    }
    console.log(">>> TEST 3 PASSED: Member onboarding, first-login gate, password validation, and credential transition all succeed perfectly!");

    // Clean up test account
    console.log("\n[CLEANUP] Cleaning up test member from Firestore & Auth...");
    try {
      const userCred = await signInWithEmailAndPassword(auth, testEmail, 'NewSecurePass2026!');
      const uid = userCred.user.uid;
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'userRoles', uid));
      await deleteDoc(doc(db, 'guides', testEmpId));
      await deleteDoc(doc(db, 'reviewers', testEmpId));
      await deleteUser(userCred.user);
      console.log("- Test account cleaned up successfully.");
    } catch (cleanErr) {
      console.warn("- Cleanup notice:", cleanErr.message);
    }

    console.log("\n=======================================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!");
    console.log("=======================================================\n");

  } finally {
    await browser.close();
    await deleteApp(app);
  }
}

runTests().catch(err => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
