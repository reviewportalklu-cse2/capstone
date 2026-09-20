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

  await page.click('button[title="Click to switch operational role"]');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const dropdown = document.querySelector('div.origin-top-right');
    const btn = Array.from(dropdown.querySelectorAll('button')).find(b => b.innerText.includes('Classroom Faculty'));
    btn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => document.body.outerHTML);
  console.log('HTML after role switch:', html);
  console.log('Current URL:', page.url());
  await browser.close();
}

test().catch(console.error);
