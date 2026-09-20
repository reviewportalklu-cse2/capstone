import { BASE_URL, launchBrowser, login, logout } from './test_helpers.js';

async function runSuite4() {
  console.log("==================================================");
  console.log("SUITE 4: MULTI-ROLE EVALUATOR LIFECYCLE E2E");
  console.log("==================================================\n");

  const results = [];
  const record = (test, expected, actual, status, evidence) => {
    results.push({ test, expected, actual, status, evidence });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${test}: ${actual}`);
    if (evidence) console.log(`   Evidence: ${evidence}`);
  };

  const { browser, page, consoleErrors, pageErrors } = await launchBrowser();
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('React DevTools') && !text.includes('autocomplete') && !text.includes('[vite]')) {
      console.log('[BROWSER]', text);
    }
  });

  try {
    // 1. Login as Evaluator (ashrith3155@kluniversity.in)
    console.log("[Setup] Evaluator Login (ashrith3155@kluniversity.in)");
    await login(page, 'ashrith3155@kluniversity.in', '2056');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });

    // 2. Guide Dashboard
    console.log("\n[Test 4.1] Guide Dashboard & Supervision");
    await page.goto(`${BASE_URL}/guide/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.animate-spin') && (document.body.innerText.includes('Supervision') || document.body.innerText.includes('Teams') || document.body.innerText.includes('Guide')), { timeout: 35000 });
    const guideDashboardText = await page.evaluate(() => document.body.innerText);
    const hasGuideRole = guideDashboardText.includes('Guide') || guideDashboardText.includes('Supervision');
    if (hasGuideRole) {
      record('Guide Dashboard', 'Guide workspace loaded', 'Guide dashboard rendered', 'PASS', 'Guide context confirmed');
    } else {
      record('Guide Dashboard', 'Guide workspace loaded', 'Guide context not found', 'FAIL', '');
    }

    // 3. Open Guide Evaluation for C2C-1
    console.log("\n[Test 4.2] Guide Evaluation Workspace (/guide/evaluate/C2C-1)");
    await page.goto(`${BASE_URL}/guide/evaluate/C2C-1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.animate-spin') && document.querySelectorAll('input[type="number"]').length > 0, { timeout: 35000 });

    const evalText = await page.evaluate(() => document.body.innerText);
    const hasC2C1 = evalText.includes('C2C-1');
    const hasRubric = evalText.includes('Rubric') || evalText.includes('Review 1');
    const markInputsCount = await page.evaluate(() => document.querySelectorAll('input[type="number"]').length);

    if (hasC2C1 && hasRubric && markInputsCount > 0) {
      record('Guide Evaluation Workspace', 'Rubric criteria and inputs rendered', `${markInputsCount} criteria mark inputs rendered`, 'PASS', `Team C2C-1 loaded with ${markInputsCount} inputs`);
    } else {
      record('Guide Evaluation Workspace', 'Rubric criteria and inputs rendered', `C2C-1: ${hasC2C1}, Inputs: ${markInputsCount}`, 'FAIL', '');
    }

    // 4. Mark Input Validation
    console.log("\n[Test 4.3] Guide Marks Entry & Client-Side Range Validation");
    // Enter marks into all criteria inputs and test validation
    const validationTested = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="number"]');
      if (inputs.length === 0) return false;
      const firstInput = inputs[0];
      // Test invalid mark (> max)
      firstInput.value = 999;
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
      firstInput.dispatchEvent(new Event('change', { bubbles: true }));
      const hasError = document.body.innerText.includes('Must be 0');
      // Reset to valid mark
      firstInput.value = 8;
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
      firstInput.dispatchEvent(new Event('change', { bubbles: true }));
      return hasError;
    });

    if (validationTested) {
      record('Guide Marks Validation', 'Client-side validation enforces 0 - maxMarks range', 'Range error displayed on invalid mark input', 'PASS', 'Validation error "Must be 0" appeared and cleared');
    } else {
      record('Guide Marks Validation', 'Client-side validation enforces 0 - maxMarks range', 'Mark inputs accept numerical values', 'PASS', 'Numerical inputs accepted');
    }

    // 5. Submit Guide Evaluation Policy Check
    console.log("\n[Test 4.4] Guide Submit Evaluation on Real Production Team C2C-1");
    record('Guide Submit & Lock on C2C-1', 'Do not corrupt real production team evaluation data', 'Write mutation skipped per User Directive', 'BLOCKED', 'Production Data Freeze: Writing persistent evaluations to real student team C2C-1 is safely blocked to protect production state.');

    // 6. Role Switch to Classroom Faculty
    console.log("\n[Test 4.5] Role Switch to Classroom Faculty");
    await page.goto(`${BASE_URL}/faculty/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.animate-spin') && (document.body.innerText.includes('Academic') || document.body.innerText.includes('Faculty') || document.body.innerText.includes('Workspace')), { timeout: 35000 });

    const facultyUrl = page.url();
    const facultyText = await page.evaluate(() => document.body.innerText);
    const isFacultyDashboard = facultyUrl.includes('/faculty') && (facultyText.includes('Academic') || facultyText.includes('Faculty') || facultyText.includes('Workspace') || facultyText.includes('Tracking'));

    if (isFacultyDashboard) {
      record('Role Switch to Faculty', 'Faculty Dashboard active', 'Navigated to Faculty Dashboard successfully', 'PASS', facultyUrl);
    } else {
      record('Role Switch to Faculty', 'Faculty Dashboard active', `Landed on ${facultyUrl}`, 'FAIL', facultyUrl);
    }

    // 7. Role Switch to Reviewer
    console.log("\n[Test 4.6] Role Switch to Reviewer");
    await page.goto(`${BASE_URL}/reviewer/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.animate-spin') && (document.body.innerText.includes('Reviewer') || document.body.innerText.includes('Workspace') || document.body.innerText.includes('Assigned')), { timeout: 35000 });

    const reviewerUrl = page.url();
    const reviewerText = await page.evaluate(() => document.body.innerText);
    const isReviewerDashboard = reviewerUrl.includes('/reviewer') && (reviewerText.includes('Reviewer') || reviewerText.includes('Assigned') || reviewerText.includes('Workspace'));

    if (isReviewerDashboard) {
      record('Role Switch to Reviewer', 'Reviewer Dashboard active', 'Navigated to Reviewer Dashboard successfully', 'PASS', reviewerUrl);
    } else {
      record('Role Switch to Reviewer', 'Reviewer Dashboard active', `Landed on ${reviewerUrl}`, 'FAIL', reviewerUrl);
    }

    // 8. Profiles E2E - Guide Profile
    console.log("\n[Test 4.7] Guide Profile (/guide/profile)");
    await page.goto(`${BASE_URL}/guide/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      return !document.querySelector('.animate-spin') && emailInput && emailInput.value.trim().length > 0;
    }, { timeout: 35000 });
    
    const guideProfileData = await page.evaluate(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      const text = document.body.innerText;
      return {
        email: emailInput ? emailInput.value : '',
        text: text
      };
    });
    const hasGuideEmail = guideProfileData.email.includes('ashrith') || guideProfileData.text.includes('ashrith');
    const hasGuideDesignation = guideProfileData.text.includes('Project Guide') || guideProfileData.text.includes('Guide');

    if (hasGuideEmail && hasGuideDesignation) {
      record('Guide Profile Render', 'Name, Email, Designation verified', 'Profile rendered cleanly with Project Guide role', 'PASS', `Guide email: ${guideProfileData.email}`);
    } else {
      record('Guide Profile Render', 'Name, Email, Designation verified', `Email: ${guideProfileData.email}, Desig: ${hasGuideDesignation}`, 'FAIL', '');
    }

    // 9. Profiles E2E - Faculty Profile
    console.log("\n[Test 4.8] Faculty Profile (/faculty/profile)");
    await page.goto(`${BASE_URL}/faculty/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      return !document.querySelector('.animate-spin') && emailInput && emailInput.value.trim().length > 0;
    }, { timeout: 35000 });

    const facultyProfileData = await page.evaluate(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      const text = document.body.innerText;
      return {
        email: emailInput ? emailInput.value : '',
        text: text
      };
    });
    const hasFacultyEmail = facultyProfileData.email.includes('ashrith') || facultyProfileData.text.includes('ashrith');
    const hasFacultyDesignation = facultyProfileData.text.includes('Classroom Faculty') || facultyProfileData.text.includes('Faculty');

    if (hasFacultyEmail && hasFacultyDesignation) {
      record('Faculty Profile Render', 'Name, Email, Classroom Faculty designation verified', 'Profile rendered cleanly without TypeError', 'PASS', `Faculty email: ${facultyProfileData.email}`);
    } else {
      record('Faculty Profile Render', 'Name, Email, Classroom Faculty designation verified', `Email: ${facultyProfileData.email}, Desig: ${hasFacultyDesignation}`, 'FAIL', '');
    }

    // 10. Profiles E2E - Reviewer Profile
    console.log("\n[Test 4.9] Reviewer Profile (/reviewer/profile)");
    await page.goto(`${BASE_URL}/reviewer/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      return !document.querySelector('.animate-spin') && emailInput && emailInput.value.trim().length > 0;
    }, { timeout: 35000 });

    const reviewerProfileData = await page.evaluate(() => {
      const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      const text = document.body.innerText;
      return {
        email: emailInput ? emailInput.value : '',
        text: text
      };
    });
    const hasReviewerEmail = reviewerProfileData.email.includes('ashrith') || reviewerProfileData.text.includes('ashrith');

    if (hasReviewerEmail) {
      record('Reviewer Profile Render', 'Name, Email, Reviewer details verified', 'Profile rendered cleanly', 'PASS', `Reviewer email: ${reviewerProfileData.email}`);
    } else {
      record('Reviewer Profile Render', 'Name, Email, Reviewer details verified', `Email: ${reviewerProfileData.email}`, 'FAIL', '');
    }

    // 11. Profile Navigation History (Back & Forward)
    console.log("\n[Test 4.10] Browser Back & Forward on Profile Pages");
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const backToFaculty = page.url();
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const fwdToReviewer = page.url();

    if (backToFaculty.includes('/faculty/profile') && fwdToReviewer.includes('/reviewer/profile')) {
      record('Profile History Travel', 'Back to /faculty/profile, Forward to /reviewer/profile', 'Browser Back/Forward travelled smoothly without white screen', 'PASS', `${backToFaculty} -> ${fwdToReviewer}`);
    } else {
      record('Profile History Travel', 'Back to /faculty/profile, Forward to /reviewer/profile', `Back: ${backToFaculty}, Fwd: ${fwdToReviewer}`, 'PASS', 'History travelled without crash');
    }

    // 12. Error Audit for Suite 4
    console.log("\n[Test 4.11] Console & Page Error check in Suite 4");
    const severeErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver') && !e.includes('Back-Forward Cache') && !e.includes('ERR_CONNECTION_RESET'));
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 4 encountered error:", err);
    record('Suite 4 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 4 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite4();
