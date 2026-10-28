import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  await page.goto('http://localhost:5173/admin/rubrics/builder/e8dDE2gKWbfLHZ0b0j8B', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  const headerInfo = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('*'));
    const markEls = textEls.filter(el => el.innerText && el.innerText.includes('Total Marks:'));
    return markEls.map(el => el.innerText.trim());
  });
  console.log('Mark elements:', headerInfo);

  const pubButton = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    return {
      text: btn ? btn.innerText.trim() : null,
      disabled: btn ? btn.disabled : null
    };
  });
  console.log('Canonical Review 3 Evaluation Rubric (50/50) Publish button:', pubButton);

  await page.goto('http://localhost:5173/admin/rubrics/builder/rubric_prototype_review3', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  const pubButtonB = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    return {
      text: btn ? btn.innerText.trim() : null,
      disabled: btn ? btn.disabled : null
    };
  });
  console.log('Canonical Prototype Rubric (50/50) Publish button:', pubButtonB);

  await browser.close();
}

test();
