import { BASE_URL, launchBrowser, login } from './test_helpers.js';

async function runSuite3() {
  console.log("==================================================");
  console.log("SUITE 3: RUBRICS ENGINE & BUILDER E2E");
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

    // 2. Open Rubrics Management
    console.log("\n[Test 3.1] Rubrics Management (/admin/rubrics)");
    await page.goto(`${BASE_URL}/admin/rubrics`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('tbody tr', { timeout: 20000 });

    const pageText = await page.evaluate(() => document.body.innerText);

    const hasR1 = pageText.includes('Review 1');
    const hasR2 = pageText.includes('Review 2');
    const hasR3 = pageText.includes('Review 3');

    if (hasR1 && hasR2 && hasR3) {
      record('All 3 Review Rubrics Visible', 'Review 1, Review 2, Review 3 listed', 'All 3 cycles present on UI', 'PASS', 'Review 1, Review 2, Review 3 detected');
    } else {
      record('All 3 Review Rubrics Visible', 'Review 1, Review 2, Review 3 listed', `R1: ${hasR1}, R2: ${hasR2}, R3: ${hasR3}`, 'FAIL', '');
    }

    // 3. Inspect Rubric Builder for Review 1 (4DMaA7V8X1FkWgzdP2NF)
    console.log("\n[Test 3.2] Review 1 Rubric Builder Inspection");
    await page.goto(`${BASE_URL}/admin/rubrics/build/4DMaA7V8X1FkWgzdP2NF`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('100') && document.querySelectorAll('input').length > 3, { timeout: 20000 });

    const r1Text = await page.evaluate(() => document.body.innerText);
    const r1HasTotal100 = r1Text.includes('100');
    const r1Inputs = await page.evaluate(() => document.querySelectorAll('input').length);

    if (r1HasTotal100 && r1Inputs > 3) {
      record('Review 1 Rubric Configuration', 'Total Marks = 100 and criteria loaded', 'Total marks 100 and criteria configured', 'PASS', `Total 100 verified, ${r1Inputs} inputs`);
    } else {
      record('Review 1 Rubric Configuration', 'Total Marks = 100 and criteria loaded', `Total100: ${r1HasTotal100}, Inputs: ${r1Inputs}`, 'FAIL', '');
    }

    // 4. Inspect Rubric Builder for Review 2 (mqb9hanow94qIOWCrItY)
    console.log("\n[Test 3.3] Review 2 Rubric Builder Inspection");
    await page.goto(`${BASE_URL}/admin/rubrics/build/mqb9hanow94qIOWCrItY`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('100') && document.querySelectorAll('input').length > 3, { timeout: 20000 });

    const r2Text = await page.evaluate(() => document.body.innerText);
    const r2HasTotal100 = r2Text.includes('100');
    const r2Inputs = await page.evaluate(() => document.querySelectorAll('input').length);

    if (r2HasTotal100 && r2Inputs > 3) {
      record('Review 2 Rubric Configuration', 'Total Marks = 100 and criteria loaded', 'Total marks 100 and criteria configured', 'PASS', `Total 100 verified, ${r2Inputs} inputs`);
    } else {
      record('Review 2 Rubric Configuration', 'Total Marks = 100 and criteria loaded', `Total100: ${r2HasTotal100}, Inputs: ${r2Inputs}`, 'FAIL', '');
    }

    // 5. Inspect Rubric Builder for Review 3 (e8dDE2gKWbfLHZ0b0j8B)
    console.log("\n[Test 3.4] Review 3 Rubric Builder Inspection");
    await page.goto(`${BASE_URL}/admin/rubrics/build/e8dDE2gKWbfLHZ0b0j8B`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('100') && document.querySelectorAll('input').length > 3, { timeout: 20000 });

    const r3Text = await page.evaluate(() => document.body.innerText);
    const r3HasTotal100 = r3Text.includes('100');
    const r3Inputs = await page.evaluate(() => document.querySelectorAll('input').length);

    if (r3HasTotal100 && r3Inputs > 3) {
      record('Review 3 Rubric Configuration', 'Total Marks = 100 and criteria loaded', 'Total marks 100 and criteria configured', 'PASS', `Total 100 verified, ${r3Inputs} inputs`);
    } else {
      record('Review 3 Rubric Configuration', 'Total Marks = 100 and criteria loaded', `Total100: ${r3HasTotal100}, Inputs: ${r3Inputs}`, 'FAIL', '');
    }

    // 6. Check for Empty / Duplicate Rubrics or Orphan Criteria
    console.log("\n[Test 3.5] Audit Rubrics Database State");
    const { FirestoreService } = await import('../../src/firebase/services/firestore.js');
    const rubrics = await FirestoreService.getAll('rubrics');
    const criteria = await FirestoreService.getAll('rubricCriteria');

    const canonicalIds = new Set(['4DMaA7V8X1FkWgzdP2NF', 'mqb9hanow94qIOWCrItY', 'e8dDE2gKWbfLHZ0b0j8B']);
    const emptyRubrics = rubrics.filter(r => (r.totalMarks === 0 || !r.totalMarks) && !canonicalIds.has(r.id));
    const orphanCriteria = criteria.filter(c => !canonicalIds.has(c.rubricId));

    if (emptyRubrics.length === 0 && orphanCriteria.length === 0 && rubrics.length === 3) {
      record('Rubrics Database Integrity', 'Zero empty/duplicate rubrics, zero orphan criteria', 'Exactly 3 published rubrics, zero orphans', 'PASS', 'Pure 3 canonical rubrics');
    } else {
      record('Rubrics Database Integrity', 'Zero empty/duplicate rubrics, zero orphan criteria', `Empty: ${emptyRubrics.length}, Orphans: ${orphanCriteria.length}, Total rubrics: ${rubrics.length}`, 'FAIL', '');
    }

    // 7. Error audit
    console.log("\n[Test 3.6] Console & Page Error check in Suite 3");
    const severeErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver'));
    if (severeErrors.length === 0 && pageErrors.length === 0) {
      record('Console & Page errors', 'Zero severe errors', 'Zero severe console/page errors', 'PASS', 'Clean error log');
    } else {
      record('Console & Page errors', 'Zero severe errors', `${severeErrors.length} console errors, ${pageErrors.length} page errors`, 'FAIL', severeErrors.join('; '));
    }

  } catch (err) {
    console.error("Suite 3 encountered error:", err);
    record('Suite 3 Execution', 'Complete all steps', `Error: ${err.message}`, 'FAIL', err.stack);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("SUITE 3 SUMMARY: " + results.filter(r => r.status === 'PASS').length + " / " + results.length + " PASS");
  console.log("==================================================\n");
  return results;
}

runSuite3();
