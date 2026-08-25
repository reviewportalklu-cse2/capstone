import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

async function testAllAdminCategories() {
  console.log("===============================================================");
  console.log("   AUDITING ALL ADMIN CATEGORIES FOR RUNTIME / LOADING ERRORS  ");
  console.log("===============================================================\n");

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Extension') && !text.includes('favicon')) {
        console.error(`[CONSOLE ERROR] ${text}`);
        pageErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE UNCAUGHT ERROR]`, err.message);
    pageErrors.push(err.message);
  });

  // Login as Admin
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[id="email"]');
  await page.type('input[id="email"]', 'cse2admin@kluniversity.in');
  await page.type('input[id="password"]', 'cse2-2026');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.href.includes('/admin'), { timeout: 8000 });
  await new Promise(r => setTimeout(r, 2000));

  const adminRoutes = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Reports Hub', path: '/admin/reports' },
    { name: 'Enterprise Bulk Upload Center', path: '/admin/sync' },
    { name: 'Students', path: '/admin/students' },
    { name: 'Teams & Groups', path: '/admin/teams' },
    { name: 'Projects', path: '/admin/projects' },
    { name: 'Guides', path: '/admin/guides' },
    { name: 'Classroom Faculty', path: '/admin/faculty' },
    { name: 'Reviewers', path: '/admin/reviewers' },
    { name: 'Rubrics Engine', path: '/admin/rubrics' },
    { name: 'Review Cycles', path: '/admin/review-cycles' },
    { name: 'Reviewer Assignments', path: '/admin/reviewer-assignments' },
    { name: 'Evaluation Center', path: '/admin/evaluation-center' },
    { name: 'Semester Result Engine', path: '/admin/semester-results' },
    { name: 'Notifications', path: '/admin/notifications' },
    { name: 'Security Settings', path: '/admin/security' },
    { name: 'Platform Settings', path: '/admin/settings' },
    { name: 'Backup & Restore', path: '/admin/backup' }
  ];

  const auditReport = [];

  for (const r of adminRoutes) {
    pageErrors.length = 0;
    const start = Date.now();

    // Use in-page React Router navigation to preserve SPA state
    await page.evaluate((targetPath) => {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, r.path);

    await new Promise(res => setTimeout(res, 1200));
    const duration = Date.now() - start;

    const currentUrl = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);

    const isBlank = !bodyText || bodyText.trim().length === 0;
    const hasErrorText = bodyText.includes('TypeError') || bodyText.includes('ReferenceError') || bodyText.includes('Something went wrong') || bodyText.includes('Cannot read properties');
    const hasConsoleErr = pageErrors.length > 0;

    let status = 'PASS';
    let details = `Loaded ${bodyText.slice(0, 40).replace(/\n/g, ' ')}...`;

    if (isBlank) {
      status = 'FAIL';
      details = 'BLANK PAGE / WHITE SCREEN';
    } else if (hasErrorText) {
      status = 'FAIL';
      details = 'RUNTIME EXCEPTION RENDERED';
    } else if (hasConsoleErr) {
      status = 'FAIL';
      details = `CONSOLE ERRORS: ${pageErrors.join(' | ')}`;
    }

    console.log(`[AUDIT] ${r.name} (${r.path}): ${status} (${duration} ms) -> ${details}`);
    auditReport.push({ name: r.name, path: r.path, status, duration: `${duration} ms`, details });
  }

  await browser.close();

  console.log("\n===============================================================");
  console.log("   ADMIN CATEGORY AUDIT SUMMARY TABLE                          ");
  console.log("===============================================================");
  console.table(auditReport);
}

testAllAdminCategories();
