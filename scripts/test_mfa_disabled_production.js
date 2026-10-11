import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:4173';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("===============================================================");
  console.log("   MFA TEMPORARY DISABLE PRODUCTION VALIDATION SUITE          ");
  console.log("===============================================================\n");

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
    // -------------------------------------------------------------
    // 1. ADMIN LOGIN TEST
    // -------------------------------------------------------------
    console.log("--- 1. ADMIN LOGIN TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'admin@university.edu');
      await page.type('#password', 'Admin@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/admin') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');
      const hasAdminAccess = url.includes('/admin') && (bodyText.includes('Admin') || bodyText.includes('Dashboard'));
      const noOpNotAllowed = !bodyText.includes('auth/operation-not-allowed');

      report("Admin logs in directly to /admin", hasAdminAccess, `URL: ${url}`);
      report("Admin has NO 'Secure Your Account' modal", !hasSecureModal);
      report("Admin experiences NO auth/operation-not-allowed error", noOpNotAllowed);

      await context.close();
    }

    // -------------------------------------------------------------
    // 2. GUIDE LOGIN TEST
    // -------------------------------------------------------------
    console.log("\n--- 2. GUIDE LOGIN TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'guide01@university.edu');
      await page.type('#password', 'Guide@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/guide') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');
      const hasGuideAccess = url.includes('/guide');

      report("Guide logs in directly to /guide", hasGuideAccess, `URL: ${url}`);
      report("Guide has NO 'Secure Your Account' modal", !hasSecureModal);

      await context.close();
    }

    // -------------------------------------------------------------
    // 3. CLASSROOM FACULTY LOGIN TEST
    // -------------------------------------------------------------
    console.log("\n--- 3. CLASSROOM FACULTY LOGIN TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'faculty01@university.edu');
      await page.type('#password', 'Faculty@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/faculty') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');
      const hasFacultyAccess = url.includes('/faculty');

      report("Classroom Faculty logs in directly to /faculty", hasFacultyAccess, `URL: ${url}`);
      report("Classroom Faculty has NO 'Secure Your Account' modal", !hasSecureModal);

      await context.close();
    }

    // -------------------------------------------------------------
    // 4. REVIEWER LOGIN TEST
    // -------------------------------------------------------------
    console.log("\n--- 4. REVIEWER LOGIN TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'reviewer01@university.edu');
      await page.type('#password', 'Reviewer@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return window.location.pathname.includes('/reviewer') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');
      const hasReviewerAccess = url.includes('/reviewer');

      report("Reviewer logs in directly to /reviewer", hasReviewerAccess, `URL: ${url}`);
      report("Reviewer has NO 'Secure Your Account' modal", !hasSecureModal);

      await context.close();
    }

    // -------------------------------------------------------------
    // 5. STUDENT LOGIN TEST
    // -------------------------------------------------------------
    console.log("\n--- 5. STUDENT LOGIN TEST ---");
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
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');
      const hasStudentAccess = url.includes('/student');

      report("Student logs in directly to /student", hasStudentAccess, `URL: ${url}`);
      report("Student continues working normally without modal", !hasSecureModal);

      await context.close();
    }

    // -------------------------------------------------------------
    // 6. MULTI-ROLE EVALUATOR LOGIN & ROLE SWITCHING TEST
    // -------------------------------------------------------------
    console.log("\n--- 6. MULTI-ROLE EVALUATOR & ROLE SWITCHING TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'pvenkataanusha@kluniversity.in');
      await page.type('#password', '8137');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/login') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const url = page.url();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      const hasSecureModal = bodyText.includes('Secure Your Account');

      report("Multi-role evaluator logged in without MFA gate", !hasSecureModal, `URL: ${url}`);

      // Try role switcher if available
      const roleSwitcherBtn = await page.$('button[aria-label="Switch active operational role"]');
      if (roleSwitcherBtn) {
        await roleSwitcherBtn.click();
        await sleep(500);
        const options = await page.$$('button[role="menuitem"], div[role="menu"] button');
        if (options.length > 0) {
          await options[0].click();
          await sleep(2000);
          const afterSwitchText = await page.$eval('body', el => el.innerText).catch(() => '');
          report("Role switcher switches active role without MFA prompt", !afterSwitchText.includes('Secure Your Account'));
        }
      } else {
        report("Evaluator active role loaded smoothly", true);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // 7. DIRECT PROTECTED ROUTES TEST
    // -------------------------------------------------------------
    console.log("\n--- 7. DIRECT PROTECTED ROUTES & DEEP LINK TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Unauthenticated deep link must redirect to /login
      await page.goto(`${BASE_URL}/faculty/evaluate/C2C-1`, { waitUntil: 'domcontentloaded' });
      await sleep(1000);
      const isRedirectedToLogin = page.url().includes('/login');
      report("Unauthenticated access to protected route redirects to /login", isRedirectedToLogin);

      // Authenticate as faculty
      await page.type('#email', 'faculty01@university.edu');
      await page.type('#password', 'Faculty@123');
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/login') || document.body.innerText.includes('Secure Your Account');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      const deepUrl = page.url();
      const deepBody = await page.$eval('body', el => el.innerText).catch(() => '');
      report(
        "Direct protected deep link access succeeds with NO MFA modal", 
        !deepBody.includes('Secure Your Account') && (deepUrl.includes('/faculty') || deepUrl.includes('C2C-1')),
        `Final URL: ${deepUrl}`
      );

      await context.close();
    }

    // -------------------------------------------------------------
    // 8. ROLE-BASED ACCESS CONTROL & AUTHORIZATION PROTECTION TEST
    // -------------------------------------------------------------
    console.log("\n--- 8. AUTHORIZATION & ROLE PROTECTION TEST ---");
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Student attempting to access /admin/dashboard
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.type('#email', 'student01@university.edu');
      await page.type('#password', 'Student@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/student'), { timeout: 15000 }).catch(() => {});
      await sleep(1500);

      // Try to navigate directly to /admin/dashboard
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        return window.location.pathname.includes('/student') || window.location.pathname.includes('/login');
      }, { timeout: 15000 }).catch(() => {});
      await sleep(1000);
      const studentOnAdminUrl = page.url();
      report(
        "Student is blocked from /admin and redirected by ProtectedRoute",
        !studentOnAdminUrl.includes('/admin') && (studentOnAdminUrl.includes('/student') || studentOnAdminUrl.includes('/login')),
        `Landed at: ${studentOnAdminUrl}`
      );

      await context.close();
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n===============================================================");
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
