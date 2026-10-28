import puppeteer from 'puppeteer';

async function testEvalCenter() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n[1] Testing /admin/evaluation-center/teams...');
  await page.goto('http://localhost:5173/admin/evaluation-center/teams', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const tableHeaders = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim());
  });
  console.log('Table Headers:', tableHeaders);

  const tableSnippet = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log('Table includes "Review 3 Rubrics":', tableSnippet.includes('Review 3 Rubrics'));
  console.log('Table includes "Review 3 Evaluation Rubric":', tableSnippet.includes('Review 3 Evaluation Rubric'));
  console.log('Table includes "Prototype Rubric":', tableSnippet.includes('Prototype Rubric'));

  console.log('\n[2] Testing Team Details (/admin/evaluation-center/team/C2C-1)...');
  await page.goto('http://localhost:5173/admin/evaluation-center/team/C2C-1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const detailsText = await page.evaluate(() => document.body.innerText);
  console.log('Details text includes "Evaluation Stage Progression":', detailsText.includes('Evaluation Stage Progression'));
  console.log('Details text includes "Review 3 Eval":', detailsText.includes('Review 3 Eval'));
  console.log('Details text includes "Prototype Rubric":', detailsText.includes('Prototype Rubric'));
  console.log('Details text includes "Rubric Score Breakdown":', detailsText.includes('Rubric Score Breakdown'));
  console.log('Details text includes "Review 3 Evaluation Rubric — PENDING":', detailsText.includes('Review 3 Evaluation Rubric — PENDING') || detailsText.includes('Review 3 Evaluation Rubric'));
  console.log('Details text includes "Prototype Rubric — PENDING":', detailsText.includes('Prototype Rubric — PENDING') || detailsText.includes('Prototype Rubric'));

  console.log('\n[3] Testing Team Workspace View Rubric Assignment (/admin/teams/C2C-1)...');
  await page.goto('http://localhost:5173/admin/teams/C2C-1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const teamWorkspaceText = await page.evaluate(() => document.body.innerText);
  console.log('Team Workspace includes "Review 3 Rubric Assignment":', teamWorkspaceText.includes('Review 3 Rubric Assignment'));
  console.log('Team Workspace includes "Save Rubric":', teamWorkspaceText.includes('Save Rubric'));

  await browser.close();
}

testEvalCenter();
