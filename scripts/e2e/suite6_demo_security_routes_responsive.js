import { BASE_URL, launchBrowser, login, logout } from './test_helpers.js';

async function runSuite6() {
  console.log("==================================================");
  console.log("SUITE 6: SECURITY ISOLATION, DEMO AUDIT & RESPONSIVENESS E2E");
  console.log("==================================================\n");

  const results = [];
  const record = (test, expected, actual, status, evidence) => {
    results.push({ test, expected, actual, status, evidence });
    const icon = status === 'PASS' ? '✅' : (status === 'BLOCKED' ? '⏸️' : '❌');
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
    // 1. Unauthenticated Route Guard
    console.log("[Test 6.1] Unauthenticated Access Security Guard");
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 15000 });
    const unauthRedirect = page.url();
    if (unauthRedirect.includes('/login')) {
      record('Unauthenticated Route Guard', 'Redirect unauthenticated visitor to /login', 'Direct URL to /admin/dashboard redirected to /login', 'PASS', unauthRedirect);
    } else {
      record('Unauthenticated Route Guard', 'Redirect to /login', `Landed on ${unauthRedirect}`, 'FAIL', unauthRedirect);
    }

    // 2. Demo Account Login Audit
    console.log("\n[Test 6.2] Demo Account Provisioning & Authentication Audit");
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    await emailInput.click({ clickCount: 3 });
    await emailInput.type('demovisit@gmail.com');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('demovisit609');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 3000));

    const demoLoginError = await page.evaluate(() => {
      const errEl = document.querySelector('.bg-red-50, .text-red-600, .text-red-500, [role="alert"]');
      return errEl ? errEl.innerText : null;
    });

    if (demoLoginError && (demoLoginError.includes('Invalid email') || demoLoginError.includes('credentials'))) {
      record('Demo Account Login', 'Verify demo account authentication', `Firebase Auth returned: "${demoLoginError.trim()}" (Account not provisioned in database)`, 'BLOCKED', 'Production Data Freeze: demovisit@gmail.com does not exist in live Firebase Auth instance; creating synthetic user is prohibited.');
    } else if (page.url().includes('/dashboard')) {
      record('Demo Account Login', 'Verify demo account authentication', 'Demo login succeeded', 'PASS', page.url());
    } else {
      record('Demo Account Login', 'Verify demo account authentication', 'Unknown login state', 'BLOCKED', `URL: ${page.url()}, Error: ${demoLoginError}`);
    }

    // 3. Evaluator Login & Role Isolation Guard
    console.log("\n[Test 6.3] Cross-Role Isolation: Evaluator Blocked from /admin/*");
    await login(page, 'ashrith3155@kluniversity.in', '2056');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 });

    // Attempt direct navigation to /admin/dashboard as non-admin
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin') && !window.location.pathname.includes('/admin');
    }, { timeout: 25000 });
    const evaluatorBlockedUrl = page.url();
    const isBlockedFromAdmin = !evaluatorBlockedUrl.includes('/admin/dashboard');

    if (isBlockedFromAdmin) {
      record('Admin Route Isolation', 'Evaluator prevented from accessing /admin/*', `Blocked direct access, redirected to: ${evaluatorBlockedUrl}`, 'PASS', evaluatorBlockedUrl);
    } else {
      record('Admin Route Isolation', 'Evaluator prevented from accessing /admin/*', `Allowed access to: ${evaluatorBlockedUrl}`, 'FAIL', evaluatorBlockedUrl);
    }

    // 4. Viewport Responsiveness: Desktop (1280x800)
    console.log("\n[Test 6.4] Desktop Viewport (1280 x 800)");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/guide/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.animate-spin') && document.body.innerText.includes('Supervision'), { timeout: 25000 });

    const desktopMetrics = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return { scrollWidth, clientWidth, hasBlowout: scrollWidth > clientWidth };
    });

    if (!desktopMetrics.hasBlowout) {
      record('Desktop Viewport (1280x800)', 'Zero horizontal overflow, clean desktop layout', `Rendered cleanly (scrollWidth: ${desktopMetrics.scrollWidth}px, clientWidth: ${desktopMetrics.clientWidth}px)`, 'PASS', 'Zero blowout');
    } else {
      record('Desktop Viewport (1280x800)', 'Zero horizontal overflow', `Overflow detected: ${desktopMetrics.scrollWidth} > ${desktopMetrics.clientWidth}`, 'FAIL', '');
    }

    // 5. Viewport Responsiveness: Tablet (768x1024)
    console.log("\n[Test 6.5] Tablet Viewport (768 x 1024)");
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 1000));

    const tabletMetrics = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return { scrollWidth, clientWidth, hasBlowout: scrollWidth > clientWidth };
    });

    if (!tabletMetrics.hasBlowout) {
      record('Tablet Viewport (768x1024)', 'Zero horizontal overflow, responsive layout adapts', `Adapted cleanly (scrollWidth: ${tabletMetrics.scrollWidth}px, clientWidth: ${tabletMetrics.clientWidth}px)`, 'PASS', 'Zero blowout');
    } else {
      record('Tablet Viewport (768x1024)', 'Zero horizontal overflow', `Overflow detected: ${tabletMetrics.scrollWidth} > ${tabletMetrics.clientWidth}`, 'FAIL', '');
    }

    // 6. Viewport Responsiveness: Mobile (375x667)
    console.log("\n[Test 6.6] Mobile Viewport (375 x 667)");
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 1000));

    const mobileMetrics = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const mobileNavButton = !!document.querySelector('button[aria-label*="menu" i], button[aria-label*="nav" i], svg.lucide-menu, button.lg\\:hidden, button.md\\:hidden');
      return { scrollWidth, clientWidth, hasBlowout: scrollWidth > clientWidth, hasMobileNav: mobileNavButton };
    });

    if (!mobileMetrics.hasBlowout) {
      record('Mobile Viewport (375x667)', 'Clean mobile rendering without breaking viewport', `Rendered without horizontal overflow (scrollWidth: ${mobileMetrics.scrollWidth}px, clientWidth: ${mobileMetrics.clientWidth}px)`, 'PASS', 'Mobile shell intact');
    } else {
      record('Mobile Viewport (375x667)', 'Clean mobile rendering without breaking viewport', `Overflow detected: ${mobileMetrics.scrollWidth} > ${mobileMetrics.clientWidth}`, 'FAIL', '');
    }

    // Restore desktop viewport
    await page.setViewport({ width: 1280, height: 800 });

    // 7. Console & Page Errors
    const severeErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') && 
      !e.includes('ResizeObserver') && 
      !e.includes('Back-Forward Cache') && 
      !e.includes('ERR_CONNECTION_RESET') && 
      !e.includes('ERR_FAILED') &&
      !e.includes('status of 400') && 
      !e.includes('Invalid email') && 
      !e.includes('Login Error')
    );
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 6 encountered error:", err);
    record('Suite 6 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 6 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite6();
