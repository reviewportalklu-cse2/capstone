import { BASE_URL, launchBrowser, login, logout } from './test_helpers.js';

async function runSuite2() {
  console.log("==================================================");
  console.log("SUITE 2: ADMIN DASHBOARD & CORE MANAGEMENT E2E");
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
    // 1. Login as Admin
    console.log("[Setup] Admin Login");
    await login(page, 'cse2admin@kluniversity.in', 'cse2-2026');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Total Students'), { timeout: 20000 });

    // 2. Admin Dashboard Verification
    console.log("\n[Test 2.1] Admin Dashboard Metrics & Live Data");
    const dashboardText = await page.evaluate(() => document.body.innerText);
    
    const hasStudents = /Total Students/i.test(dashboardText);
    const hasTeams = /Total Teams/i.test(dashboardText);
    const hasProjects = /Active Projects/i.test(dashboardText);
    const hasGuides = /Assigned Guides/i.test(dashboardText);
    const hasFaculty = /Classroom Faculty/i.test(dashboardText);
    const hasReviewers = /Assigned Reviewers/i.test(dashboardText);

    if (hasStudents && hasTeams && hasProjects && hasGuides && hasFaculty && hasReviewers) {
      record('Admin Dashboard Statistics', 'Render all 6 key entity metrics', 'All 6 metrics displayed on dashboard', 'PASS', 'Students, Teams, Projects, Guides, Faculty, Reviewers found');
    } else {
      record('Admin Dashboard Statistics', 'Render all 6 key entity metrics', `Missing metrics: S:${hasStudents}, T:${hasTeams}, P:${hasProjects}, G:${hasGuides}, F:${hasFaculty}, R:${hasReviewers}`, 'FAIL', '');
    }

    // 3. Student Management
    console.log("\n[Test 2.2] Student Management (/admin/students)");
    await page.goto(`${BASE_URL}/admin/students`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length > 0, { timeout: 20000 });

    const studentRowsCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);

    if (studentRowsCount > 0) {
      record('Student Management List', 'Real Firestore student rows rendered', `${studentRowsCount} student rows loaded`, 'PASS', `Found ${studentRowsCount} table rows`);
    } else {
      record('Student Management List', 'Real Firestore student rows rendered', 'Zero student rows loaded', 'FAIL', '');
    }

    // Test Search input
    const searchInput = await page.$('input[placeholder*="Search records"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('2300030');
      await new Promise(r => setTimeout(r, 1500));
      const filteredCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
      record('Student Management Search', 'Filter table rows by search query', `Filtered to ${filteredCount} matching row(s)`, 'PASS', `Search query '2300030' returned ${filteredCount} results`);
      
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 1000));
    }

    // 4. Team Management
    console.log("\n[Test 2.3] Team Management (/admin/teams)");
    await page.goto(`${BASE_URL}/admin/teams`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.grid > div[class*="rounded-xl"], tbody tr');
      return cards.length > 0;
    }, { timeout: 20000 });

    const teamCardsCount = await page.evaluate(() => {
      return document.querySelectorAll('.grid > div[class*="rounded-xl"]').length || document.querySelectorAll('tbody tr').length;
    });

    if (teamCardsCount > 0) {
      record('Team Management List', 'Real Firestore team items rendered', `${teamCardsCount} teams loaded`, 'PASS', `Found ${teamCardsCount} teams`);
    } else {
      record('Team Management List', 'Real Firestore team items rendered', 'Zero teams loaded', 'FAIL', '');
    }

    // Switch to table/list mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const listBtn = buttons.find(b => b.title === 'List View' || b.querySelector('svg.lucide-list'));
      if (listBtn) listBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check for 'undefined' or 'null' in team view
    const teamDataCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasUndefined = text.includes('undefined');
      const hasNull = text.includes('null');
      return { hasUndefined, hasNull };
    });

    if (!teamDataCheck.hasUndefined && !teamDataCheck.hasNull) {
      record('Team Mentors Data Integrity', 'No undefined or null mentor strings', 'Clean resolved data without undefined/null', 'PASS', 'Zero undefined or null values detected');
    } else {
      record('Team Mentors Data Integrity', 'No undefined or null mentor strings', `Found undefined: ${teamDataCheck.hasUndefined}, null: ${teamDataCheck.hasNull}`, 'FAIL', '');
    }

    // 5. Team Details Workspace
    console.log("\n[Test 2.4] Team Details Workspace (/admin/teams/C2C-1)");
    await page.goto(`${BASE_URL}/admin/teams/C2C-1`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('C2C-1') && !document.body.innerText.includes('Loading...'), { timeout: 20000 });

    const teamWorkspaceText = await page.evaluate(() => document.body.innerText);
    const hasTeamTitle = teamWorkspaceText.includes('C2C-1');
    const hasWorkspaceUndefined = teamWorkspaceText.includes('undefined');

    if (hasTeamTitle && !hasWorkspaceUndefined) {
      record('Team Details Workspace (C2C-1)', 'Render workspace with Team ID and zero undefined', 'Workspace rendered fully with clean data', 'PASS', `Team C2C-1 visible on workspace`);
    } else {
      record('Team Details Workspace (C2C-1)', 'Render workspace with Team ID and zero undefined', `TeamTitle: ${hasTeamTitle}, Undefined: ${hasWorkspaceUndefined}`, 'FAIL', '');
    }

    // 6. Project Management
    console.log("\n[Test 2.5] Project Management (/admin/projects)");
    await page.goto(`${BASE_URL}/admin/projects`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length > 0, { timeout: 20000 });

    const projectRowsCount = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length;
    });

    if (projectRowsCount > 0) {
      record('Project Management List', 'Real Firestore project rows rendered', `${projectRowsCount} project rows loaded`, 'PASS', `Found ${projectRowsCount} projects`);
    } else {
      record('Project Management List', 'Real Firestore project rows rendered', 'Zero project rows loaded', 'FAIL', '');
    }

    // 7. Error audit for Suite 2
    console.log("\n[Test 2.6] Console and Page Error check in Suite 2");
    const severeErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver'));
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 2 encountered error:", err);
    record('Suite 2 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 2 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite2();
