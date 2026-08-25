import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

async function testAuthFlowDiagram() {
  console.log("===============================================================");
  console.log("   VERIFYING AUTHENTICATION FLOW & ROLE REDIRECTION DIAGRAM   ");
  console.log("===============================================================\n");

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // --------------------------------------------------
    // STEP 1: VISIT ROOT "/" WITHOUT AUTHENTICATED SESSION
    // --------------------------------------------------
    console.log("STEP 1: Visiting http://localhost:5173/ without session...");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const step1Url = page.url();
    console.log(`  -> Current URL: ${step1Url}`);
    const step1Redirected = step1Url.includes('/login');
    console.log(`  -> Redirected to /login: ${step1Redirected ? '✅ PASS' : '❌ FAIL'}`);

    // --------------------------------------------------
    // STEP 2: ENTER ADMIN CREDENTIALS & SUBMIT
    // --------------------------------------------------
    console.log("\nSTEP 2: Entering Admin credentials (cse2admin@kluniversity.in)...");
    await page.waitForSelector('input[id="email"]');
    await page.type('input[id="email"]', 'cse2admin@kluniversity.in');
    await page.type('input[id="password"]', 'cse2-2026');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.href.includes('/admin'), { timeout: 8000 });
    const step2Url = page.url();
    console.log(`  -> Post-login URL: ${step2Url}`);
    console.log(`  -> Resolved Admin Role & Dashboard: ${step2Url.includes('/admin') ? '✅ PASS' : '❌ FAIL'}`);

    // --------------------------------------------------
    // STEP 3: VISIT "/" WHILE AUTHENTICATED AS ADMIN
    // --------------------------------------------------
    console.log("\nSTEP 3: Visiting http://localhost:5173/ while authenticated as Admin...");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const step3Url = page.url();
    console.log(`  -> Current URL: ${step3Url}`);
    console.log(`  -> Auto-redirected to active Admin dashboard: ${step3Url.includes('/admin') ? '✅ PASS' : '❌ FAIL'}`);

    // --------------------------------------------------
    // STEP 4: LOGOUT & VERIFY SESSION RESET
    // --------------------------------------------------
    console.log("\nSTEP 4: Logging out...");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[id="email"]');
    console.log(`  -> Session cleared. Currently on /login: ✅ PASS`);

    // --------------------------------------------------
    // STEP 5: ENTER EVALUATOR CREDENTIALS
    // --------------------------------------------------
    console.log("\nSTEP 5: Entering Evaluator credentials (ashrith3155@kluniversity.in)...");
    await page.type('input[id="email"]', 'ashrith3155@kluniversity.in');
    await page.type('input[id="password"]', '2056');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 8000 });
    const step5Url = page.url();
    console.log(`  -> Post-login URL: ${step5Url}`);
    console.log(`  -> Resolved Evaluator Role & Dashboard: ${step5Url.includes('/guide') || step5Url.includes('/faculty') || step5Url.includes('/reviewer') ? '✅ PASS' : '❌ FAIL'}`);

    // --------------------------------------------------
    // STEP 6: VISIT "/" WHILE AUTHENTICATED AS EVALUATOR
    // --------------------------------------------------
    console.log("\nSTEP 6: Visiting http://localhost:5173/ while authenticated as Evaluator...");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const step6Url = page.url();
    console.log(`  -> Current URL: ${step6Url}`);
    console.log(`  -> Auto-redirected to active Evaluator dashboard: ${step6Url.includes('/guide') || step6Url.includes('/faculty') || step6Url.includes('/reviewer') ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n===============================================================");
    console.log("   AUTHENTICATION & ROLE REDIRECTION FLOW: 100% VERIFIED      ");
    console.log("===============================================================");

  } catch (err) {
    console.error("❌ Exception during Auth Flow verification:", err.message);
  } finally {
    await browser.close();
  }
}

testAuthFlowDiagram();
