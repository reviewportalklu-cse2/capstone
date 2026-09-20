import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await page.waitForSelector('h1', { timeout: 10000 });

  console.log('Initial URL:', page.url());

  console.log('Switching to Classroom Faculty...');
  await page.click('button[title="Click to switch operational role"]');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const dropdown = document.querySelector('div.origin-top-right');
    const btn = Array.from(dropdown.querySelectorAll('button')).find(b => b.innerText.includes('Classroom Faculty'));
    btn.click();
  });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const url = page.url();
    const hasSpinner = await page.evaluate(() => !!document.querySelector('.animate-spin'));
    const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
    console.log(`[step ${i}] URL: ${url} | hasSpinner: ${hasSpinner} | h1: ${h1}`);
    if (url.includes('/faculty') && !hasSpinner && h1) break;
  }

  // Now click Faculty Profile link
  console.log('Looking for Faculty Profile link...');
  const facultyProfileLink = await page.$('a[href="/faculty/profile"]');
  console.log('Found a[href="/faculty/profile"]?', !!facultyProfileLink);
  if (facultyProfileLink) {
    await facultyProfileLink.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('Faculty Profile URL:', page.url());
    const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
    console.log('Faculty Profile H1:', h1);
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Faculty Profile body length:', bodyText.length);
  }

  await browser.close();
}

test().catch(console.error);
