import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('DATA_SYNC') && (txt.includes('rubric') || txt.includes('evaluat'))) {
      console.log('BROWSER LOG:', txt);
    }
  });

  console.log('1. Logging in...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  console.log('2. Navigating to /admin/rubrics...');
  await page.goto('http://localhost:5173/admin/rubrics', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const rubricsPageText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- RUBRICS PAGE CONTENT CHECK ---');
  console.log('Has "Review 3 Evaluation Rubric":', rubricsPageText.includes('Review 3 Evaluation Rubric'));
  console.log('Has "Prototype Rubric":', rubricsPageText.includes('Prototype Rubric'));
  
  // Extract rubric card titles and descriptions
  const cardDetails = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h4, .font-bold'));
    return headings.map(h => h.innerText).filter(t => t && (t.includes('Review') || t.includes('Rubric') || t.includes('Prototype')));
  });
  console.log('Card titles found:', cardDetails);

  console.log('\n3. Opening Builder for Review 3 Evaluation Rubric (e8dDE2gKWbfLHZ0b0j8B)...');
  await page.goto('http://localhost:5173/admin/rubrics/builder/e8dDE2gKWbfLHZ0b0j8B', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  const builderAText = await page.evaluate(() => document.body.innerText);
  console.log('Builder A Title:', builderAText.includes('Review 3 Evaluation Rubric'));
  console.log('Builder A 50/50:', builderAText.includes('50 / 50'));
  console.log('Builder A Criteria:');
  console.log(' - Completed System Functionality:', builderAText.includes('Completed System Functionality'));
  console.log(' - Testing & Performance Evaluation:', builderAText.includes('Testing & Performance Evaluation'));
  console.log(' - Real-world Application & Domain Impact:', builderAText.includes('Real-world Application & Domain Impact'));
  console.log(' - Reflection, Learning & Future Scope:', builderAText.includes('Reflection, Learning & Future Scope'));

  console.log('\n4. Opening Builder for Prototype Rubric (rubric_prototype_review3)...');
  await page.goto('http://localhost:5173/admin/rubrics/builder/rubric_prototype_review3', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  const builderBText = await page.evaluate(() => document.body.innerText);
  console.log('Builder B Title:', builderBText.includes('Prototype Rubric'));
  console.log('Builder B 50/50:', builderBText.includes('50 / 50'));
  console.log('Builder B Criteria:');
  console.log(' - Prototype Functionality & Live Integration:', builderBText.includes('Prototype Functionality & Live Integration'));
  console.log(' - Innovation & Technical Implementation:', builderBText.includes('Innovation & Technical Implementation'));
  console.log(' - User Interface & Practical Utility:', builderBText.includes('User Interface & Practical Utility'));
  console.log(' - Testing & Results Validation:', builderBText.includes('Testing & Results Validation'));

  console.log('\n5. Opening Evaluation Workspace for TEAM001 with Review 3...');
  await page.goto('http://localhost:5173/admin/evaluation/TEAM001', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  // Change cycle to Review 3
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const cycleSelect = selects.find(s => Array.from(s.options).some(o => o.value.includes('Review 3')));
    if (cycleSelect) {
      cycleSelect.value = 'Review 3';
      cycleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  const workspaceText = await page.evaluate(() => document.body.innerText);
  console.log('Workspace unassigned notice:', workspaceText.includes('No rubric has been assigned to this evaluation.'));

  // Click on Review 3 Evaluation Rubric button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const r3Btn = btns.find(b => b.innerText.includes('Review 3 Evaluation Rubric'));
    if (r3Btn) r3Btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const r3WorkspaceText = await page.evaluate(() => document.body.innerText);
  console.log('After selecting Review 3 Evaluation Rubric:');
  console.log(' - Criteria 1 (Completed System Functionality):', r3WorkspaceText.includes('Completed System Functionality'));
  console.log(' - Criteria 2 (Testing & Performance Evaluation):', r3WorkspaceText.includes('Testing & Performance Evaluation'));

  // Switch to Prototype Rubric
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
  await new Promise(r => setTimeout(r, 3000));

  const protoWorkspaceText = await page.evaluate(() => document.body.innerText);
  console.log('After selecting Prototype Rubric:');
  console.log(' - Criteria 1 (Prototype Functionality & Live Integration):', protoWorkspaceText.includes('Prototype Functionality & Live Integration'));
  console.log(' - Criteria 2 (Innovation & Technical Implementation):', protoWorkspaceText.includes('Innovation & Technical Implementation'));

  console.log('\n6. Checking Admin Evaluation Center (/admin/evaluation-center/teams)...');
  await page.goto('http://localhost:5173/admin/evaluation-center/teams', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  const evalCenterText = await page.evaluate(() => document.body.innerText);
  console.log(' - Has Review 3 Rubrics column:', evalCenterText.includes('Review 3 Rubrics'));
  console.log(' - Displays Review 3 Evaluation Rubric:', evalCenterText.includes('Review 3 Evaluation Rubric'));
  console.log(' - Displays Prototype Rubric:', evalCenterText.includes('Prototype Rubric'));

  console.log('\n7. Checking Team Details (/admin/evaluation-center/team/TEAM001)...');
  await page.goto('http://localhost:5173/admin/evaluation-center/team/TEAM001', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  const teamDetailsText = await page.evaluate(() => document.body.innerText);
  console.log(' - Stage progression has Review 3 Eval:', teamDetailsText.includes('Review 3 Eval'));
  console.log(' - Stage progression has Prototype Rubric:', teamDetailsText.includes('Prototype Rubric'));
  console.log(' - Rubric score breakdown has Review 3 Evaluation Rubric:', teamDetailsText.includes('Review 3 Evaluation Rubric'));
  console.log(' - Rubric score breakdown has Prototype Rubric:', teamDetailsText.includes('Prototype Rubric'));

  await browser.close();
}

test();
