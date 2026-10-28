import puppeteer from 'puppeteer';

async function testPrototype() {
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

  // Switch rubric to Prototype Rubric in dropdown
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
  await new Promise(r => setTimeout(r, 4000));

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER SELECTING PROTOTYPE RUBRIC:\n');
  console.log(pageText);

  await browser.close();
}

testPrototype();
