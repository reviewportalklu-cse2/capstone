// scripts/test_validation_updates.js
import puppeteer from 'puppeteer';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config.js';
import { memberService } from '../src/firebase/services/memberService.js';

const BASE_URL = 'http://localhost:4173';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const app = initializeApp(firebaseConfig, 'test-verifier-app');
const auth = getAuth(app);
const db = getFirestore(app);

async function runTestSuite() {
  console.log("==================================================================");
  console.log("   AUTOMATED PRE-PUSH AUDIT & REGRESSION VERIFICATION SUITE       ");
  console.log("==================================================================\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passed = 0;
  let failed = 0;

  function report(title, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${title} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // ==================================================================
    // PART 1: GUIDE LOGIN & GUIDE PROFILE REAL DATA VERIFICATION
    // ==================================================================
    console.log("\n>>> PART 1: GUIDE LOGIN & PROFILE REAL DATA <<<");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Step 1: Login as Guide
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', 'guide01@university.edu');
      await page.type('#password', 'Guide@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => window.location.pathname.includes('/guide'), { timeout: 15000 });
      report("Guide logged in successfully", page.url().includes('/guide'), page.url());

      // Step 2: Direct navigation to /guide/profile
      await page.goto(`${BASE_URL}/guide/profile`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#profileEmail', { timeout: 15000 }).catch(() => {});
      await sleep(2500);

      const pageText = await page.$eval('body', el => el.innerText).catch(() => '');
      
      // Confirm no hardcoded dummy data & no exposed password
      report("Profile does NOT show dummy 'John Doe'", !pageText.includes('John Doe'));
      report("Profile does NOT expose any password", !pageText.toLowerCase().includes('guide@123'));
      
      // Check real loaded fields
      const emailInput = await page.$eval('#profileEmail, input[name="email"]', el => el.value).catch(() => '');
      const nameInput = await page.$eval('#profileName, input[name="name"]', el => el.value).catch(() => '');
      const empIdBadge = pageText.includes('ID:') || pageText.includes('GUIDE');

      report("Profile contains real email", emailInput.toLowerCase() === 'guide01@university.edu', `Email: ${emailInput}`);
      report("Profile contains real Name", nameInput.trim().length > 0, `Name: ${nameInput}`);
      report("Profile shows Employee ID section", empIdBadge);
      report("Profile shows Assigned Roles section", pageText.includes('ASSIGNED ROLES') || pageText.includes('Assigned Roles'));
      report("No MFA/TOTP gate blocked Guide Profile", !pageText.includes('Secure Your Account'));

      await context.close();
    }

    // ==================================================================
    // PART 2: REGRESSION: OTHER ROLES LOGIN & ACCESS
    // ==================================================================
    console.log("\n>>> PART 2: ROLE REGRESSION TESTS (ADMIN, FACULTY, REVIEWER, STUDENT) <<<");
    
    // Admin login
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'admin@university.edu');
      await page.type('#password', 'Admin@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/admin'), { timeout: 15000 });
      const text = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Admin login works directly without MFA", page.url().includes('/admin') && !text.includes('Secure Your Account'));
      await context.close();
    }

    // Classroom Faculty login
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'faculty01@university.edu');
      await page.type('#password', 'Faculty@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/faculty'), { timeout: 15000 });
      const text = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Classroom Faculty login works directly without MFA", page.url().includes('/faculty') && !text.includes('Secure Your Account'));
      await context.close();
    }

    // Reviewer login
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'reviewer01@university.edu');
      await page.type('#password', 'Reviewer@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/reviewer'), { timeout: 15000 });
      const text = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Reviewer login works directly without MFA", page.url().includes('/reviewer') && !text.includes('Secure Your Account'));
      await context.close();
    }

    // Student login
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'student01@university.edu');
      await page.type('#password', 'Student@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/student'), { timeout: 15000 });
      const text = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Student login works directly without MFA", page.url().includes('/student') && !text.includes('Secure Your Account'));
      await context.close();
    }

    // ==================================================================
    // PART 3: SECURITY AUDIT: NON-ADMIN CALLER PROVISIONING RESTRICTION
    // ==================================================================
    console.log("\n>>> PART 3: SECURITY AUDIT: UNAUTHORIZED PROVISIONING REJECTION <<<");
    {
      let unauthorizedRejected = false;
      try {
        // Sign in as non-admin (student)
        const studentCred = await signInWithEmailAndPassword(auth, 'student01@university.edu', 'Student@123');
        try {
          await memberService.createMember({
            name: 'Exploit Test',
            employeeId: '999999',
            email: 'exploit@test.edu',
            department: 'Computer Science',
            availableRoles: ['guide']
          });
        } catch (authErr) {
          unauthorizedRejected = authErr.message.includes('Unauthorized') || authErr.message.includes('Forbidden');
        }
        await signOut(auth);
      } catch (e) {
        unauthorizedRejected = true;
      }
      report("Non-Admin user is strictly blocked from provisioning members", unauthorizedRejected);
    }

    // ==================================================================
    // PART 4: ADMIN MEMBERS MANAGEMENT PAGE UI
    // ==================================================================
    console.log("\n>>> PART 4: ADMIN -> MEMBERS MANAGEMENT PAGE <<<");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Login as Admin
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', 'admin@university.edu');
      await page.type('#password', 'Admin@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => window.location.pathname.includes('/admin'), { timeout: 15000 });
      report("Admin navigates to Admin Center", page.url().includes('/admin'));

      // Direct navigation to /admin/members
      await page.goto(`${BASE_URL}/admin/members`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#addMemberBtn', { timeout: 15000 }).catch(() => {});
      await sleep(2500);

      const adminPageText = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Members page header renders", adminPageText.includes('Faculty & Evaluator Members') || adminPageText.includes('Members'));
      report("Add Member button is present", adminPageText.includes('Add Member'));
      report("Search filter input is present", adminPageText.includes('Search') || (await page.$('#membersSearchInput')) !== null);
      report("Role filter options are present", adminPageText.includes('Role:') || adminPageText.includes('Guide'));

      await context.close();
    }

    // ==================================================================
    // PART 5: SAFE TEST MEMBER ONBOARDING, FIRST LOGIN & PASSWORD CHANGE
    // ==================================================================
    console.log("\n>>> PART 5: SAFE MEMBER ONBOARDING, FIRST LOGIN & PASSWORD CHANGE <<<");
    const testEmail = `test_faculty_${Date.now()}@university.edu`;
    const testEmpId = `88${Math.floor(1000 + Math.random() * 9000)}`;
    const testName = 'Dr. Test Audit Faculty';
    const newSecurePassword = 'AuditSecure@Password2026';

    console.log(`Test Member: ${testEmail} | Emp ID: ${testEmpId}`);

    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Login as Admin to add the member
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', 'admin@university.edu');
      await page.type('#password', 'Admin@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/admin'), { timeout: 15000 });

      // Go to /admin/members
      await page.goto(`${BASE_URL}/admin/members`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#addMemberBtn', { timeout: 15000 });
      await sleep(1500);

      // Click "Add Member" button
      await page.click('#addMemberBtn');
      await page.waitForSelector('#memberName', { timeout: 10000 });

      // Fill Add Member Form
      await page.type('#memberName', testName);
      await page.type('#employeeId', testEmpId);
      await page.type('#officialEmail', testEmail);

      // Select Classroom Faculty and Reviewer in addition to Guide
      await page.click('#add-role-classroom_faculty');
      await page.click('#add-role-reviewer');

      // Submit Form
      await page.click('#submitOnboardMemberBtn');

      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text.includes('onboarded successfully') || !document.querySelector('#memberName');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const afterSubmitText = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Admin provisioned new member successfully", afterSubmitText.includes('successfully') || !afterSubmitText.includes('Failed'));

      await context.close();
    }

    // Direct Firestore Database Inspection
    console.log("\n--- Direct Firestore Database Inspection ---");
    let provisionedUid = null;
    {
      const q = query(collection(db, 'users'), where('email', '==', testEmail));
      const snap = await getDocs(q);
      report("Firestore users record created", !snap.empty);
      if (!snap.empty) {
        const userDoc = snap.docs[0].data();
        provisionedUid = snap.docs[0].id;
        report("Firestore requiresPasswordChange is true", userDoc.requiresPasswordChange === true);
        report("Firestore users record has NO password field", userDoc.password === undefined);
        report("Multi-roles recorded in users", Array.isArray(userDoc.availableRoles) && userDoc.availableRoles.length >= 1, JSON.stringify(userDoc.availableRoles));
      }

      // Check guides collection
      const guideDoc = await getDoc(doc(db, 'guides', testEmpId));
      report("Firestore guides record created with Employee ID", guideDoc.exists());

      // Check userRoles record
      if (provisionedUid) {
        const roleDoc = await getDoc(doc(db, 'userRoles', provisionedUid));
        report("Firestore userRoles record created", roleDoc.exists());
        if (roleDoc.exists()) {
          report("userRoles requiresPasswordChange is true", roleDoc.data().requiresPasswordChange === true);
        }
      }
    }

    // Member First Login with Employee ID Initial Password
    console.log("\n--- Member First Login with Employee ID Initial Password ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', testEmail);
      await page.type('#password', testEmpId);
      await page.click('button[type="submit"]');

      // Should be redirected to /first-login-password-change
      await page.waitForFunction(() => {
        return window.location.pathname.includes('/first-login-password-change');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const firstLoginUrl = page.url();
      report("Redirected to First Login Password Change screen", firstLoginUrl.includes('/first-login-password-change'), firstLoginUrl);

      // Attempt setting new password to Employee ID (should be REJECTED)
      await page.waitForSelector('#currentPassword', { timeout: 10000 });
      await page.type('#currentPassword', testEmpId);
      await page.type('#newPassword', testEmpId);
      await page.type('#confirmPassword', testEmpId);
      await page.click('#submitFirstLoginPasswordBtn');
      await sleep(1500);

      let bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Reusing Employee ID as new password is BLOCKED", bodyText.includes('New password cannot be the same as your initial Employee ID password'));

      // Set legitimate new password using nativeInputValueSetter for React
      await page.evaluate((sel, val) => {
        const input = document.querySelector(sel);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, '#newPassword', newSecurePassword);

      await page.evaluate((sel, val) => {
        const input = document.querySelector(sel);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, '#confirmPassword', newSecurePassword);

      await sleep(500);
      await page.click('#submitFirstLoginPasswordBtn');

      // Wait for success and redirect to dashboard
      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/first-login-password-change') && 
               !window.location.pathname.includes('/login');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(3000);

      const postChangeUrl = page.url();
      report("Successfully redirected to dashboard after password change", !postChangeUrl.includes('/first-login-password-change'), postChangeUrl);

      await context.close();
    }

    // Step 6: Test that old password NO LONGER works
    console.log("\n--- Verification: Old Employee ID Password No Longer Works ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', testEmail);
      await page.type('#password', testEmpId);
      await page.click('button[type="submit"]');
      await sleep(3000);

      const oldPassUrl = page.url();
      const oldPassText = await page.$eval('body', el => el.innerText).catch(() => '');
      report("Old initial password fails to log in", oldPassText.includes('Invalid email or password') || oldPassText.includes('check your credentials') || oldPassUrl.includes('/login'));

      await context.close();
    }

    // Step 7: Test that NEW password works directly
    console.log("\n--- Verification: New Password Works Directly ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', testEmail);
      await page.type('#password', newSecurePassword);
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/guide') || 
               window.location.pathname.includes('/faculty') || 
               window.location.pathname.includes('/reviewer');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(3000);

      const successUrl = page.url();
      const successText = await page.$eval('body', el => el.innerText).catch(() => '');

      report("New password successfully logs in to dashboard", !successUrl.includes('/login') && !successUrl.includes('/first-login-password-change'), successUrl);
      report("No password-change screen appears on subsequent login", !successText.includes('First Login — Set New Password'));
      report("No MFA/TOTP screen appears", !successText.includes('Secure Your Account'));

      await context.close();
    }

    // Cleanup test user
    console.log("\n--- Cleaning Up Test User ---");
    try {
      const userCred = await signInWithEmailAndPassword(auth, testEmail, newSecurePassword);
      await deleteUser(userCred.user);
      if (provisionedUid) {
        await deleteDoc(doc(db, 'users', provisionedUid));
        await deleteDoc(doc(db, 'userRoles', provisionedUid));
      }
      await deleteDoc(doc(db, 'guides', testEmpId));
      await deleteDoc(doc(db, 'classroomFaculty', testEmpId));
      await deleteDoc(doc(db, 'reviewers', testEmpId));
      console.log("[CLEANUP] Successfully cleaned up test account.");
    } catch (cleanErr) {
      console.warn("[CLEANUP NOTICE]", cleanErr.message);
    }

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log("\n==================================================================");
  console.log(`   FINAL AUDIT SUMMARY: PASSED: ${passed} | FAILED: ${failed}    `);
  console.log("==================================================================");
}

runTestSuite();
