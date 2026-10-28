import puppeteer from 'puppeteer';

async function testWorkspace() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  await page.goto('http://localhost:5173/admin/evaluation/C2C-1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  // Switch to Review 3
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const cycleSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Review 3'));
    if (cycleSelect) {
      cycleSelect.value = 'Review 3';
      cycleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  // Click on Review 3 Evaluation Rubric button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Select Review 3 Evaluation Rubric'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER SELECTING RUBRIC:\n');
  console.log(pageText);

  await browser.close();
}

testWorkspace();
