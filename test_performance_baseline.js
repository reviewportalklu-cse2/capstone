import puppeteer from 'puppeteer';

async function auditPerformance() {
  console.log("==================================================");
  console.log("STARTING PERFORMANCE BASELINE AUDIT");
  console.log("==================================================\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Intercept console & network logs
  const logs = [];
  const networkRequests = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on('request', req => {
    if (req.url().includes('firestore.googleapis.com')) {
      networkRequests.push(req.url());
    }
  });

  try {
    // 1. Initial Page Load
    const t0 = Date.now();
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const initialLoadTime = Date.now() - t0;
    console.log(`1. Initial Login Page Load: ${initialLoadTime} ms`);

    // 2. Admin Login -> Dashboard
    const tLoginStart = Date.now();
    await page.type('input[type="email"]', 'admin@university.edu');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1', { timeout: 10000 });
    const adminDashboardTime = Date.now() - tLoginStart;
    console.log(`2. Admin Login -> Dashboard: ${adminDashboardTime} ms`);

    // 3. Admin Teams Page
    const tTeams = Date.now();
    await page.goto('http://localhost:5173/admin/teams', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    const adminTeamsTime = Date.now() - tTeams;
    console.log(`3. Admin Teams Page: ${adminTeamsTime} ms`);

    // 4. Admin Rubrics Page
    const tRubrics = Date.now();
    await page.goto('http://localhost:5173/admin/rubrics', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    const adminRubricsTime = Date.now() - tRubrics;
    console.log(`4. Admin Rubrics Page: ${adminRubricsTime} ms`);

    // 5. Admin Evaluation Center
    const tEvalCenter = Date.now();
    await page.goto('http://localhost:5173/admin/evaluation-center', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    const adminEvalCenterTime = Date.now() - tEvalCenter;
    console.log(`5. Admin Evaluation Center: ${adminEvalCenterTime} ms`);

    // 6. Evaluation Workspace Page
    const tEvalWorkspace = Date.now();
    await page.goto('http://localhost:5173/evaluation/TEAM001', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    const evalWorkspaceTime = Date.now() - tEvalWorkspace;
    console.log(`6. Evaluation Workspace Page: ${evalWorkspaceTime} ms`);

    console.log(`\nTotal Firestore Network Requests Recorded during test: ${networkRequests.length}`);

  } catch (err) {
    console.error("Audit error:", err.message);
  } finally {
    await browser.close();
  }
}

auditPerformance();
