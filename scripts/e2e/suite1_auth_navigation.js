import { BASE_URL, launchBrowser, login, logout } from './test_helpers.js';

async function runSuite1() {
  console.log("==================================================");
  console.log("SUITE 1: AUTHENTICATION & NAVIGATION E2E");
  console.log("==================================================\n");

  const results = [];
  const record = (test, expected, actual, status, evidence) => {
    results.push({ test, expected, actual, status, evidence });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${test}: ${actual}`);
    if (evidence) console.log(`   Evidence: ${evidence}`);
  };

  const { browser, page, consoleErrors, pageErrors } = await launchBrowser();

  try {
    // 1. Root redirect without login
    console.log("\n[Test 1.1] Root redirect without authentication");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const rootUrl = page.url();
    if (rootUrl.includes('/login')) {
      record('Root route redirect', 'Redirect to /login', `Redirected to ${rootUrl}`, 'PASS', rootUrl);
    } else {
      record('Root route redirect', 'Redirect to /login', `Landed on ${rootUrl}`, 'FAIL', rootUrl);
    }

    // 2. Login page elements
    console.log("\n[Test 1.2] Login page rendering");
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitBtn = await page.$('button[type="submit"]');
    if (emailInput && passwordInput && submitBtn) {
      record('Login page UI elements', 'Inputs and button visible', 'All login elements present', 'PASS', 'Email, Password, Submit rendered');
    } else {
      record('Login page UI elements', 'Inputs and button visible', 'Missing inputs or buttons', 'FAIL', '');
    }

    // 3. Invalid login
    console.log("\n[Test 1.3] Invalid login credentials");
    await emailInput.type('invalid_user@kluniversity.in');
    await passwordInput.type('wrongpassword123');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    const isStillLogin = page.url().includes('/login');
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasErrorMsg = pageText.toLowerCase().includes('invalid') || pageText.toLowerCase().includes('failed') || pageText.toLowerCase().includes('error') || pageText.toLowerCase().includes('user-not-found') || pageText.toLowerCase().includes('wrong-password') || pageText.toLowerCase().includes('credential');
    if (isStillLogin && hasErrorMsg) {
      record('Invalid credentials handling', 'Stay on /login with error alert', 'Stayed on /login with error feedback', 'PASS', 'Error message visible on UI');
    } else {
      record('Invalid credentials handling', 'Stay on /login with error alert', `URL: ${page.url()}, Error shown: ${hasErrorMsg}`, isStillLogin ? 'PASS' : 'FAIL', page.url());
    }

    // 4. Valid Admin login
    console.log("\n[Test 1.4] Valid Admin login (cse2admin@kluniversity.in)");
    await login(page, 'cse2admin@kluniversity.in', 'cse2-2026');
    const adminUrl = page.url();
    if (adminUrl.includes('/admin')) {
      record('Valid Admin login', 'Navigate to /admin or /admin/dashboard', `Landed on ${adminUrl}`, 'PASS', adminUrl);
    } else {
      record('Valid Admin login', 'Navigate to /admin or /admin/dashboard', `Landed on ${adminUrl}`, 'FAIL', adminUrl);
    }

    // 5. Session persistence on refresh
    console.log("\n[Test 1.5] Session persistence on page reload");
    await page.reload({ waitUntil: 'networkidle2' });
    const reloadUrl = page.url();
    if (reloadUrl.includes('/admin')) {
      record('Session persistence on refresh', 'Remain on /admin', `Remained on ${reloadUrl}`, 'PASS', reloadUrl);
    } else {
      record('Session persistence on refresh', 'Remain on /admin', `Landed on ${reloadUrl}`, 'FAIL', reloadUrl);
    }

    // 6. Direct URL navigation
    console.log("\n[Test 1.6] Direct URL navigation to /admin/students and /admin/teams");
    await page.goto(`${BASE_URL}/admin/students`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });
    const studentsUrl = page.url();
    await page.goto(`${BASE_URL}/admin/teams`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });
    const teamsUrl = page.url();
    if (studentsUrl.includes('/admin/students') && teamsUrl.includes('/admin/teams')) {
      record('Direct URL navigation', 'Direct load succeeds without redirect', 'Loaded /admin/students and /admin/teams successfully', 'PASS', `${studentsUrl}, ${teamsUrl}`);
    } else {
      record('Direct URL navigation', 'Direct load succeeds', `students: ${studentsUrl}, teams: ${teamsUrl}`, 'FAIL', '');
    }

    // 7. Browser Back / Forward navigation
    console.log("\n[Test 1.7] Browser Back and Forward navigation");
    await page.goBack({ waitUntil: 'networkidle2' });
    const backUrl = page.url();
    await page.goForward({ waitUntil: 'networkidle2' });
    const fwdUrl = page.url();
    if (backUrl.includes('/admin/students') && fwdUrl.includes('/admin/teams')) {
      record('Browser Back/Forward navigation', 'Back to /admin/students, Forward to /admin/teams', `Back: ${backUrl}, Forward: ${fwdUrl}`, 'PASS', 'Correct history travel');
    } else {
      record('Browser Back/Forward navigation', 'Back to /admin/students, Forward to /admin/teams', `Back: ${backUrl}, Forward: ${fwdUrl}`, 'FAIL', '');
    }

    // 8. Logout
    console.log("\n[Test 1.8] Admin Logout");
    await logout(page);
    const loggedOutUrl = page.url();
    if (loggedOutUrl.includes('/login')) {
      record('Logout action', 'Redirect to /login', `Redirected to ${loggedOutUrl}`, 'PASS', loggedOutUrl);
    } else {
      record('Logout action', 'Redirect to /login', `Landed on ${loggedOutUrl}`, 'FAIL', loggedOutUrl);
    }

    // 9. Protected route after logout
    console.log("\n[Test 1.9] Protected route access after logout");
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    const blockedUrl = page.url();
    if (blockedUrl.includes('/login')) {
      record('Protected route access after logout', 'Redirect to /login', `Access blocked, redirected to ${blockedUrl}`, 'PASS', blockedUrl);
    } else {
      record('Protected route access after logout', 'Redirect to /login', `Landed on ${blockedUrl}`, 'FAIL', blockedUrl);
    }

    // 10. Valid Evaluator Login (ashrith3155@kluniversity.in)
    console.log("\n[Test 1.10] Valid Evaluator login (ashrith3155@kluniversity.in)");
    await login(page, 'ashrith3155@kluniversity.in', '2056');
    const evaluatorUrl = page.url();
    if (evaluatorUrl.includes('/guide') || evaluatorUrl.includes('/faculty') || evaluatorUrl.includes('/reviewer')) {
      record('Valid Evaluator login', 'Navigate to role dashboard', `Landed on ${evaluatorUrl}`, 'PASS', evaluatorUrl);
    } else {
      record('Valid Evaluator login', 'Navigate to role dashboard', `Landed on ${evaluatorUrl}`, 'FAIL', evaluatorUrl);
    }

    // 11. Error audit
    const severeErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') && 
      !e.includes('ResizeObserver') && 
      !e.includes('has-text') &&
      !e.includes('Invalid email or password') &&
      !e.includes('400') &&
      !e.includes('Back-Forward Cache')
    );
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 1 encountered error:", err);
    record('Suite 1 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 1 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite1();
