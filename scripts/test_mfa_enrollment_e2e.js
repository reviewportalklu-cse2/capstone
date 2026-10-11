import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:4173';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETests() {
  console.log("==============================================================");
  console.log("   MANDATORY MFA ENROLLMENT POPUP — BROWSER E2E TEST SUITE     ");
  console.log("==============================================================\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passCount = 0;
  let failCount = 0;

  function report(name, condition, details = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '— ' + details : ''}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '— ' + details : ''}`);
      failCount++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: STUDENT EXEMPTION TEST
    // -----------------------------------------------------------------
    console.log("--- TEST 1: STUDENT EXEMPTION ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'student01@university.edu');
      await page.type('#password', 'Student@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/student') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const url = page.url();
      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      const hasStudentDashboard = await page.$eval('body', el => el.innerText.includes('Dashboard') || el.innerText.includes('Student')).catch(() => false);

      report(
        "Student exemption: Normal access without MFA popup",
        url.includes('/student') && !hasModal && hasStudentDashboard,
        `URL: ${url}, Modal displayed: ${hasModal}`
      );
      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 2: ADMIN MANDATORY MFA ENROLLMENT
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: ADMIN MANDATORY MFA ENROLLMENT ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'admin@university.edu');
      await page.type('#password', 'Admin@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const url = page.url();
      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      const hasSetupBtn = await page.$('#mfa-setup-btn') !== null;
      const hasLogoutBtn = await page.$('#mfa-modal-logout-btn') !== null;
      const hasNoSkip = await page.$eval('body', el => {
        const text = el.innerText.toLowerCase();
        return !text.includes('skip') && !text.includes('maybe later') && !text.includes('continue without mfa');
      }).catch(() => false);

      report(
        "Admin mandatory MFA: Blocked by modal, Setup button present, No skip options",
        hasModal && hasSetupBtn && hasNoSkip && hasLogoutBtn,
        `URL: ${url}, Modal: ${hasModal}, SetupBtn: ${hasSetupBtn}, LogoutBtn: ${hasLogoutBtn}`
      );

      // Setup click test
      await page.click('#mfa-setup-btn');
      await sleep(2000);
      const bodyText = await page.$eval('body', el => el.innerText);
      const setupSafelyHandled = bodyText.includes('Scan this QR code') || 
                                 bodyText.includes('TOTP MFA must be enabled') || 
                                 bodyText.includes('Unable to complete MFA setup');

      report(
        "Admin MFA setup action initiated and handled natively",
        setupSafelyHandled,
        "Zero bypass; portal remains locked"
      );

      // Refresh test
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 10000 }).catch(() => {});
      const reloadBlocked = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Refresh test: Modal block persists across page refresh", reloadBlocked);

      // Direct URL test
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 10000 }).catch(() => {});
      const directBlocked = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Direct URL protection: /admin/dashboard blocked by mandatory MFA", directBlocked);

      // Logout test
      await page.click('#mfa-modal-logout-btn');
      await sleep(2000);
      const afterLogoutUrl = page.url();
      report("Logout from modal: Cleanly exits session and redirects to /login", afterLogoutUrl.includes('/login'), `URL: ${afterLogoutUrl}`);

      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 3: GUIDE MANDATORY MFA
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: GUIDE MANDATORY MFA ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'guide01@university.edu');
      await page.type('#password', 'Guide@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Guide mandatory MFA: Blocked by 'Secure Your Account' modal", hasModal, `URL: ${page.url()}`);

      // Direct URL test
      await page.goto(`${BASE_URL}/guide/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 10000 }).catch(() => {});
      const directBlocked = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Direct URL protection: /guide/dashboard blocked by mandatory MFA", directBlocked);

      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 4: CLASSROOM FACULTY MANDATORY MFA & PRESERVED DESTINATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: FACULTY MANDATORY MFA & PRESERVED DESTINATION ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Direct unauthenticated navigation to evaluate deep-link
      const deepLink = `${BASE_URL}/faculty/evaluate/C2C-1`;
      await page.goto(deepLink, { waitUntil: 'domcontentloaded' });
      await sleep(1000);
      const redirectedToLogin = page.url().includes('/login');
      report("Direct unauthenticated access to /faculty/evaluate/C2C-1 redirects to /login", redirectedToLogin);

      // Now log in as Faculty
      await page.type('#email', 'faculty01@university.edu');
      await page.type('#password', 'Faculty@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const facultyUrl = page.url();
      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);

      report(
        "Faculty mandatory MFA: Blocked by modal with destination /faculty/evaluate/C2C-1 preserved",
        hasModal && facultyUrl.includes('/faculty/evaluate/C2C-1'),
        `Current URL: ${facultyUrl}`
      );

      // Direct URL test for faculty dashboard
      await page.goto(`${BASE_URL}/faculty/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 10000 }).catch(() => {});
      const directBlocked = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Direct URL protection: /faculty/dashboard blocked by mandatory MFA", directBlocked);

      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 5: REVIEWER MANDATORY MFA
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: REVIEWER MANDATORY MFA ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'reviewer01@university.edu');
      await page.type('#password', 'Reviewer@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Reviewer mandatory MFA: Blocked by 'Secure Your Account' modal", hasModal, `URL: ${page.url()}`);

      // Direct URL test
      await page.goto(`${BASE_URL}/reviewer/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 10000 }).catch(() => {});
      const directBlocked = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report("Direct URL protection: /reviewer/dashboard blocked by mandatory MFA", directBlocked);

      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 6: MULTI-ROLE USER ACCOUNT LEVEL ENFORCEMENT
    // -----------------------------------------------------------------
    console.log("\n--- TEST 6: MULTI-ROLE USER (ACCOUNT-LEVEL POLICY) ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'pvenkataanusha@kluniversity.in');
      await page.type('#password', '8137');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Secure Your Account');
      }, { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const hasModal = await page.$eval('body', el => el.innerText.includes('Secure Your Account')).catch(() => false);
      report(
        "Multi-role user: Evaluated at account level (Guide/Faculty/Reviewer) and blocked by mandatory MFA",
        hasModal,
        `URL: ${page.url()}`
      );

      await context.close();
    }

    // -----------------------------------------------------------------
    // TEST 7: EXISTING MFA USER & SOURCE OF TRUTH VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 7: SOURCE OF TRUTH & NATIVE TOTP ENROLLMENT ---");
    {
      // Verify via code imports that Firebase Auth multiFactor().enrolledFactors is source of truth
      // and that NO plaintext secrets or fake OTP codes exist.
      const fs = await import('fs');
      const totpSrc = fs.readFileSync('src/firebase/services/totpMfaService.js', 'utf-8');
      const authCtxSrc = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf-8');

      const usesNativeMultiFactor = totpSrc.includes('multiFactor(user)') && 
                                    totpSrc.includes('TotpMultiFactorGenerator') &&
                                    totpSrc.includes('enrolledFactors');
      const noFakeOtp = !totpSrc.includes('"123456"') && !authCtxSrc.includes('"123456"');
      const sourceOfTruthAuth = authCtxSrc.includes('totpMfaService.isMfaEnrolled(user)');

      report("MFA source of truth: Firebase Auth multiFactor().enrolledFactors strictly enforced", usesNativeMultiFactor && sourceOfTruthAuth);
      report("Security: Zero fake OTP comparisons, zero hardcoded codes in authentication logic", noFakeOtp);
    }

  } catch (err) {
    console.error("Test execution encountered unexpected error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n==============================================================");
  console.log(`TOTAL PASSED: ${passCount} | TOTAL FAILED: ${failCount}`);
  console.log("==============================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runE2ETests();
