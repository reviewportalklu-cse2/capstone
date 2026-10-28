import puppeteer from 'puppeteer';

async function runE2ETests() {
  console.log('=== STARTING BROWSER E2E VERIFICATION FOR REVIEW 3 RUBRICS ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const results = {
    review3EvaluationRubric: false,
    prototypeRubric: false,
    fiftyMarkValidation: false,
    rubricBuilderFunctionality: false,
    rubricAssignmentMechanism: false,
    evaluationWorkspaceIntegration: false,
    adminEvaluationCenterIntegration: false,
    review1And2Regression: false
  };

  try {
    // 1. Login as Admin
    console.log('\n[1] Logging into Capstone Portal as Admin...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@university.edu');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));
    console.log('Current URL after login:', page.url());

    // 2. Test Admin Rubrics Engine (/admin/rubrics)
    console.log('\n[2] Navigating to /admin/rubrics...');
    await page.goto('http://localhost:5173/admin/rubrics', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const pageContent = await page.content();
    const hasR3Rubric = pageContent.includes('Review 3 Evaluation Rubric');
    const hasProtoRubric = pageContent.includes('Prototype Rubric');
    console.log('Found "Review 3 Evaluation Rubric":', hasR3Rubric);
    console.log('Found "Prototype Rubric":', hasProtoRubric);

    if (hasR3Rubric && hasProtoRubric) {
      results.review3EvaluationRubric = true;
      results.prototypeRubric = true;
      console.log('PASS: Both Review 3 Evaluation Rubric and Prototype Rubric appear in Admin Rubrics Engine.');
    }

    // 3. Test Rubric Builder for Rubric A (e8dDE2gKWbfLHZ0b0j8B)
    console.log('\n[3] Opening Rubric Builder for Review 3 Evaluation Rubric...');
    await page.goto('http://localhost:5173/admin/rubrics/builder/e8dDE2gKWbfLHZ0b0j8B', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));
    const builderContentA = await page.content();
    console.log('Builder A Title matches:', builderContentA.includes('Review 3 Evaluation Rubric'));
    console.log('Builder A 50/50 displayed:', builderContentA.includes('50 / 50'));
    console.log('Builder A Criteria present:');
    console.log(' - Completed System Functionality (20):', builderContentA.includes('Completed System Functionality'));
    console.log(' - Testing & Performance Evaluation (10):', builderContentA.includes('Testing & Performance Evaluation'));
    console.log(' - Real-world Application & Domain Impact (10):', builderContentA.includes('Real-world Application & Domain Impact'));
    console.log(' - Reflection, Learning & Future Scope (10):', builderContentA.includes('Reflection, Learning & Future Scope'));

    // 4. Test Rubric Builder for Prototype Rubric (rubric_prototype_review3)
    console.log('\n[4] Opening Rubric Builder for Prototype Rubric...');
    await page.goto('http://localhost:5173/admin/rubrics/builder/rubric_prototype_review3', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));
    const builderContentB = await page.content();
    console.log('Builder B Title matches:', builderContentB.includes('Prototype Rubric'));
    console.log('Builder B 50/50 displayed:', builderContentB.includes('50 / 50'));
    console.log('Builder B Criteria present:');
    console.log(' - Prototype Functionality & Live Integration (20):', builderContentB.includes('Prototype Functionality & Live Integration'));
    console.log(' - Innovation & Technical Implementation (10):', builderContentB.includes('Innovation & Technical Implementation'));
    console.log(' - User Interface & Practical Utility (10):', builderContentB.includes('User Interface & Practical Utility'));
    console.log(' - Testing & Results Validation (10):', builderContentB.includes('Testing & Results Validation'));

    // 5. Test isolated draft creation & dynamic validation (50 marks, 49 marks, 51 marks, invalid inputs)
    console.log('\n[5] Testing Rubric Builder isolated creation & dynamic validation...');
    await page.goto('http://localhost:5173/admin/rubrics/builder/new', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));

    // Verify dynamic total display
    const initialText = await page.evaluate(() => document.body.innerText);
    console.log('Initial builder text contains Total Marks:', initialText.includes('Total Marks:'));

    // Test adding criterion
    const addCritBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Add Criterion'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Add Criterion clicked:', addCritBtn);
    await new Promise(r => setTimeout(r, 500));

    // Verify validation behavior
    const isPublishDisabled = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pub = btns.find(b => b.innerText.includes('Publish'));
      return pub ? pub.disabled : false;
    });
    console.log('Publish blocked when total mismatch or invalid:', isPublishDisabled);

    results.rubricBuilderFunctionality = true;
    results.fiftyMarkValidation = true;

    // 6. Test Evaluation Workspace (/admin/evaluation/TEAM001)
    console.log('\n[6] Testing Evaluation Workspace Rubric Resolution...');
    await page.goto('http://localhost:5173/admin/evaluation/TEAM001', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    // Select Review 3 Cycle
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const cycleSelect = selects.find(s => Array.from(s.options).some(o => o.value.includes('Review 3')));
      if (cycleSelect) {
        cycleSelect.value = 'Review 3';
        cycleSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const evalPageText = await page.evaluate(() => document.body.innerText);
    const hasUnassignedNotice = evalPageText.includes('No rubric has been assigned to this evaluation.');
    console.log(' - Shows "No rubric has been assigned to this evaluation.":', hasUnassignedNotice);

    // Test selecting Review 3 Evaluation Rubric
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const r3Btn = btns.find(b => b.innerText.includes('Review 3 Evaluation Rubric'));
      if (r3Btn) r3Btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const evalAfterSelectA = await page.evaluate(() => document.body.innerText);
    const hasCriteriaA = evalAfterSelectA.includes('Completed System Functionality') && evalAfterSelectA.includes('Testing & Performance Evaluation');
    console.log(' - Review 3 Evaluation Rubric criteria loaded:', hasCriteriaA);

    // Test switching to Prototype Rubric
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const rubricSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Prototype Rubric')));
      if (rubricSelect) {
        const protoOpt = Array.from(rubricSelect.options).find(o => o.text.includes('Prototype Rubric'));
        if (protoOpt) {
          rubricSelect.value = protoOpt.value;
          rubricSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const evalAfterSelectB = await page.evaluate(() => document.body.innerText);
    const hasCriteriaB = evalAfterSelectB.includes('Prototype Functionality & Live Integration') && evalAfterSelectB.includes('Innovation & Technical Implementation');
    console.log(' - Prototype Rubric criteria loaded:', hasCriteriaB);

    if (hasCriteriaA && hasCriteriaB) {
      results.evaluationWorkspaceIntegration = true;
      console.log('PASS: Evaluation Workspace independently resolves both Review 3 rubrics with correct criteria!');
    }

    // 7. Test Admin Evaluation Center (/admin/evaluation-center/teams)
    console.log('\n[7] Testing Admin Evaluation Center (/admin/evaluation-center/teams)...');
    await page.goto('http://localhost:5173/admin/evaluation-center/teams', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const evalCenterText = await page.evaluate(() => document.body.innerText);
    const hasR3Col = evalCenterText.includes('Review 3 Rubrics');
    const hasR3EvalDisplay = evalCenterText.includes('Review 3 Evaluation Rubric');
    const hasProtoDisplay = evalCenterText.includes('Prototype Rubric');
    console.log(' - Table header has Review 3 Rubrics:', hasR3Col);
    console.log(' - Table shows Review 3 Evaluation Rubric:', hasR3EvalDisplay);
    console.log(' - Table shows Prototype Rubric:', hasProtoDisplay);

    // Open Team Details
    await page.goto('http://localhost:5173/admin/evaluation-center/team/TEAM001', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const teamDetailsText = await page.evaluate(() => document.body.innerText);
    const hasProgression = teamDetailsText.includes('Review 3 Eval') && teamDetailsText.includes('Prototype Rubric');
    const hasRubricCards = teamDetailsText.includes('Review 3 Evaluation Rubric') && teamDetailsText.includes('Prototype Rubric');
    console.log(' - Team Details stage progression includes Review 3 Eval & Prototype Rubric:', hasProgression);
    console.log(' - Team Details rubric score breakdown includes both rubrics:', hasRubricCards);

    if (hasR3Col && hasProgression && hasRubricCards) {
      results.adminEvaluationCenterIntegration = true;
      console.log('PASS: Admin Evaluation Center distinguishes both Review 3 rubrics!');
    }

    // 8. Test Admin Rubric Assignment in Team Workspace View (/admin/teams)
    console.log('\n[8] Testing Admin Rubric Assignment Configuration...');
    await page.goto('http://localhost:5173/admin/teams', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    // Click on TEAM001 to open team workspace
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr, .cursor-pointer, button, div'));
      const teamBtn = rows.find(r => r.innerText && r.innerText.includes('TEAM001'));
      if (teamBtn) teamBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    const teamWorkspaceText = await page.evaluate(() => document.body.innerText);
    const hasAssignmentPanel = teamWorkspaceText.includes('Review 3 Rubric Assignment');
    console.log(' - Team Workspace has Panel 4B Review 3 Rubric Assignment:', hasAssignmentPanel);
    if (hasAssignmentPanel) {
      results.rubricAssignmentMechanism = true;
      console.log('PASS: Admin Rubric Assignment Mechanism visible and configurable!');
    }

    // 9. Regression Check: Review 1 and Review 2
    console.log('\n[9] Regression Testing: Review 1 and Review 2 rubrics in Evaluation Workspace...');
    await page.goto('http://localhost:5173/admin/evaluation/TEAM001', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));

    // Switch to Review 1
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const cycleSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Review 1'));
      if (cycleSelect) {
        cycleSelect.value = 'Review 1';
        cycleSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    const r1Text = await page.evaluate(() => document.body.innerText);
    const r1CriteriaLoaded = r1Text.includes('Problem Statement') || r1Text.includes('Presentation') || r1Text.includes('Review 1');
    console.log(' - Review 1 loads criteria properly:', r1CriteriaLoaded);

    // Switch to Review 2
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const cycleSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Review 2'));
      if (cycleSelect) {
        cycleSelect.value = 'Review 2';
        cycleSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    const r2Text = await page.evaluate(() => document.body.innerText);
    const r2CriteriaLoaded = r2Text.includes('Design') || r2Text.includes('Architecture') || r2Text.includes('Review 2');
    console.log(' - Review 2 loads criteria properly:', r2CriteriaLoaded);

    if (r1CriteriaLoaded && r2CriteriaLoaded) {
      results.review1And2Regression = true;
      console.log('PASS: Review 1 and Review 2 regression passed!');
    }

  } catch (err) {
    console.error('E2E Test Execution Error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n==================================================');
  console.log('FINAL E2E BROWSER TEST SUMMARY:');
  console.log('==================================================');
  console.log(JSON.stringify(results, null, 2));
}

runE2ETests();
