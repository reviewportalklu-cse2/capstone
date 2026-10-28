import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  await page.goto('http://localhost:5173/admin/rubrics/builder/e8dDE2gKWbfLHZ0b0j8B', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  const inputValuesA = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => i.value);
  });
  console.log('Builder A Input Values:', inputValuesA);

  await page.goto('http://localhost:5173/admin/rubrics/builder/rubric_prototype_review3', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  const inputValuesB = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => i.value);
  });
  console.log('Builder B Input Values:', inputValuesB);

  await browser.close();
}

test();
