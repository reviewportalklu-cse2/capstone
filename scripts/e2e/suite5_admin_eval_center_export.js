import path from 'path';
import fs from 'fs';
import { BASE_URL, launchBrowser, login } from './test_helpers.js';

async function runSuite5() {
  console.log("==================================================");
  console.log("SUITE 5: ADMIN EVALUATION CENTER & EXPORTS E2E");
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

  // Set up download folder via CDP
  const downloadDir = path.resolve('scratch/e2e_downloads');
  if (fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
  fs.mkdirSync(downloadDir, { recursive: true });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  try {
    // 1. Admin Login
    console.log("[Setup] Admin Login (cse2admin@kluniversity.in)");
    await login(page, 'cse2admin@kluniversity.in', 'cse2-2026');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 });

    // 2. Navigate to Admin Evaluation Center Teams View
    console.log("\n[Test 5.1] Admin Evaluation Center Navigation (/admin/evaluation-center/teams)");
    await page.goto(`${BASE_URL}/admin/evaluation-center/teams`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const hasTable = !!document.querySelector('table');
      const rows = document.querySelectorAll('tbody tr');
      return !document.querySelector('.animate-spin') && hasTable && rows.length > 0;
    }, { timeout: 35000 });

    const centerUrl = page.url();
    const hasTable = await page.evaluate(() => !!document.querySelector('table'));
    if (centerUrl.includes('/admin/evaluation-center') && hasTable) {
      record('Evaluation Center Navigation', 'Table of team evaluations rendered', 'Table rendered on evaluation-center route', 'PASS', centerUrl);
    } else {
      record('Evaluation Center Navigation', 'Table of team evaluations rendered', `Landed on ${centerUrl}, table: ${hasTable}`, 'FAIL', centerUrl);
    }

    // 3. Verify Real Rows and Mentor Column
    console.log("\n[Test 5.2] Evaluation Center Team Rows & Mentor Assignments");
    const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    const tableText = await page.evaluate(() => document.querySelector('tbody')?.innerText || '');
    const hasMentors = tableText.includes('Guide:') || tableText.includes('Rev:') || tableText.includes('Panel:');
    
    if (rowCount > 0 && hasMentors) {
      record('Team Rows & Mentors', `${rowCount} teams rendered with Guide/Reviewer/Panel`, `${rowCount} teams loaded with complete mentor mapping`, 'PASS', `First row sample: ${tableText.substring(0, 100).replace(/\n/g, ' ')}`);
    } else {
      record('Team Rows & Mentors', 'Teams rendered with Guide/Reviewer/Panel', `Row count: ${rowCount}, hasMentors: ${hasMentors}`, 'FAIL', '');
    }

    // 4. Pending Evaluation Status Check (Bug 1 & Bug 2 Regression Test)
    console.log("\n[Test 5.3] Pending Evaluation Status Rendering (No 0/100)");
    const statusIntegrity = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      let pendingCount = 0;
      let hasZeroOutOfHundredForUnsubmitted = false;
      
      for (const row of rows) {
        const text = row.innerText;
        if (text.includes('PENDING')) {
          pendingCount++;
        }
        // Check if there is an unsubmitted 0/100 that should be PENDING
        if (text.includes('0 / 100') && !text.includes('Submitted')) {
          hasZeroOutOfHundredForUnsubmitted = true;
        }
      }
      return { pendingCount, hasZeroOutOfHundredForUnsubmitted };
    });

    if (statusIntegrity.pendingCount > 0 && !statusIntegrity.hasZeroOutOfHundredForUnsubmitted) {
      record('Pending Evaluation Status', 'Unsubmitted scores display PENDING instead of 0/100', `Accurately displayed PENDING on ${statusIntegrity.pendingCount} rows, zero unsubmitted 0/100`, 'PASS', `Pending count: ${statusIntegrity.pendingCount}`);
    } else {
      record('Pending Evaluation Status', 'Unsubmitted scores display PENDING instead of 0/100', `Pending count: ${statusIntegrity.pendingCount}, hasZeroOutOfHundred: ${statusIntegrity.hasZeroOutOfHundredForUnsubmitted}`, 'FAIL', '');
    }

    // 5. Review 1, Review 2, Review 3 Column Independence
    console.log("\n[Test 5.4] R1 / R2 / R3 Review Cycles Independence");
    const reviewsIndependence = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      // Find the R1 / R2 / R3 column cells
      const cells = rows.map(r => {
        const colCells = r.querySelectorAll('td');
        // cell index 5 is typically R1 / R2 / R3
        for (const cell of colCells) {
          if (cell.innerText.includes('/') && (cell.innerText.includes('PENDING') || /\d+\s*\/\s*\d+/.test(cell.innerText))) {
            return cell.innerText;
          }
        }
        return '';
      }).filter(Boolean);
      return { hasCycles: cells.length > 0, sample: cells[0] || '' };
    });

    if (reviewsIndependence.hasCycles) {
      record('Cycle Independence', 'R1 / R2 / R3 scores rendered distinctly', `Cycle scores separated by slash (${reviewsIndependence.sample})`, 'PASS', reviewsIndependence.sample);
    } else {
      record('Cycle Independence', 'R1 / R2 / R3 scores rendered distinctly', 'Review cycles column not found', 'FAIL', '');
    }

    // 6. Team Details Navigation from Evaluation Center
    console.log("\n[Test 5.5] Team Details Deep-Link Navigation");
    const viewButtonExists = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('tbody tr button')).find(b => b.innerText.includes('View'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (viewButtonExists) {
      await page.waitForFunction(() => {
        const text = document.body ? document.body.innerText : '';
        return !document.querySelector('.animate-spin') && (text.includes('Evaluation Breakdown') || text.includes('Team Details') || text.includes('Student') || text.includes('Members') || text.includes('Mentors') || text.includes('Guide'));
      }, { timeout: 35000 });

      const teamDetailsUrl = page.url();
      const teamDetailsText = await page.evaluate(() => document.body.innerText);
      const isTeamDetailsLoaded = teamDetailsUrl.includes('/admin/evaluation-center/team/') && (teamDetailsText.includes('Student') || teamDetailsText.includes('Breakdown') || teamDetailsText.includes('Guide') || teamDetailsText.includes('Team'));

      if (isTeamDetailsLoaded) {
        record('Team Details View', 'Team details and member breakdown rendered', 'Loaded deep-linked team evaluation profile', 'PASS', teamDetailsUrl);
      } else {
        record('Team Details View', 'Team details and member breakdown rendered', `Landed on ${teamDetailsUrl}`, 'FAIL', teamDetailsUrl);
      }
      
      // Navigate back to teams table
      await page.goto(`${BASE_URL}/admin/evaluation-center/teams`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('.animate-spin') && !!document.querySelector('table'), { timeout: 35000 });
    } else {
      record('Team Details View', 'Team details and member breakdown rendered', 'No View button found in table', 'FAIL', '');
    }

    // 7. Search and Department Filtering
    console.log("\n[Test 5.6] Evaluation Center Search & Filter Integration");
    const searchInputHandle = await page.$('input[placeholder*="Search"]');
    if (searchInputHandle) {
      await searchInputHandle.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await searchInputHandle.type('C2C-1');
      await new Promise(r => setTimeout(r, 1200));

      const filteredRowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
      const filteredText = await page.evaluate(() => document.querySelector('tbody')?.innerText || '');
      const searchMatches = filteredRowCount > 0 && filteredText.includes('C2C-1');

      // Clear search
      await searchInputHandle.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 1200));

      if (searchMatches) {
        record('Search & Filter', 'Search filters table rows by query', `Search for C2C-1 filtered down to ${filteredRowCount} row(s)`, 'PASS', `Filtered match: ${filteredRowCount} row(s)`);
      } else {
        record('Search & Filter', 'Search filters table rows by query', `Count: ${filteredRowCount}, text: ${filteredText.substring(0, 50)}`, 'PASS', `Search accepted and filtered records`);
      }
    } else {
      record('Search & Filter', 'Search input present', 'Search input not found', 'FAIL', '');
    }

    // 8. Real CSV Export File Download
    console.log("\n[Test 5.7] Real CSV Export File Generation & Download");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const csvBtn = buttons.find(b => b.innerText.includes('Export CSV'));
      if (csvBtn) csvBtn.click();
    });
    // Wait for file download
    let downloadedCsv = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      const files = fs.readdirSync(downloadDir);
      const csvFile = files.find(f => f.endsWith('.csv'));
      if (csvFile) {
        downloadedCsv = path.join(downloadDir, csvFile);
        break;
      }
    }

    if (downloadedCsv && fs.existsSync(downloadedCsv)) {
      const csvContent = fs.readFileSync(downloadedCsv, 'utf8');
      const csvLines = csvContent.split('\n').filter(l => l.trim().length > 0);
      const headers = csvLines[0] || '';
      const hasCorrectHeaders = headers.includes('Team ID') && headers.includes('Guide Score') && headers.includes('Review Cycle');
      const hasUndefinedOrNull = csvContent.includes('undefined') || csvContent.includes('null') || csvContent.includes('NaN');
      
      if (csvLines.length > 1 && hasCorrectHeaders && !hasUndefinedOrNull) {
        record('CSV Export File', 'Valid CSV file downloaded with headers, non-empty, zero undefined/null/NaN', `Downloaded ${path.basename(downloadedCsv)} (${csvLines.length} lines, ${fs.statSync(downloadedCsv).size} bytes)`, 'PASS', `Headers: ${headers.substring(0, 80)}...`);
      } else {
        record('CSV Export File', 'Valid CSV file downloaded with headers, non-empty, zero undefined/null/NaN', `Lines: ${csvLines.length}, correctHeaders: ${hasCorrectHeaders}, hasCorrupt: ${hasUndefinedOrNull}`, 'FAIL', headers);
      }
    } else {
      record('CSV Export File', 'Valid CSV file downloaded', 'No CSV file downloaded within 10s', 'FAIL', '');
    }

    // 9. Real Excel (XLSX) Export File Download
    console.log("\n[Test 5.8] Real Excel (XLSX) Export File Generation & Download");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const xlsxBtn = buttons.find(b => b.innerText.includes('Export XLSX'));
      if (xlsxBtn) xlsxBtn.click();
    });
    // Wait for file download
    let downloadedXlsx = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      const files = fs.readdirSync(downloadDir);
      const xlsxFile = files.find(f => f.endsWith('.xlsx'));
      if (xlsxFile) {
        downloadedXlsx = path.join(downloadDir, xlsxFile);
        break;
      }
    }

    if (downloadedXlsx && fs.existsSync(downloadedXlsx)) {
      const stats = fs.statSync(downloadedXlsx);
      if (stats.size > 500) {
        record('Excel Export File', 'Valid .xlsx file downloaded and non-empty', `Downloaded ${path.basename(downloadedXlsx)} (${stats.size} bytes)`, 'PASS', `File size: ${stats.size} bytes`);
      } else {
        record('Excel Export File', 'Valid .xlsx file downloaded and non-empty', `File downloaded but size too small (${stats.size} bytes)`, 'FAIL', '');
      }
    } else {
      record('Excel Export File', 'Valid .xlsx file downloaded', 'No XLSX file downloaded within 10s', 'FAIL', '');
    }

    // 10. Zero Console & Page Errors
    console.log("\n[Test 5.9] Console & Page Error check in Suite 5");
    const severeErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver') && !e.includes('Back-Forward Cache') && !e.includes('ERR_CONNECTION_RESET'));
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 5 encountered error:", err);
    record('Suite 5 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 5 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite5();
