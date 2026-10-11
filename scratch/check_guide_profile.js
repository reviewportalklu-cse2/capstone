import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR EXCEPTION:', err.message, '\nSTACK:', err.stack));

  const baseUrl = 'http://localhost:5173';
  console.log('--- 1. Testing guide01@university.edu ---');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.type('#email', 'guide01@university.edu');
  await page.type('#password', 'Guide@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  await page.goto(`${baseUrl}/guide/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('Guide Profile & Settings'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));
  
  const text1 = await page.$eval('body', el => el.innerText);
  console.log('Guide01 Profile Page Text:\n', text1.substring(0, 1500));

  console.log('\n--- 2. Testing pvenkataanusha@kluniversity.in ---');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  // Logout or clear cookies
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.type('#email', 'pvenkataanusha@kluniversity.in');
  await page.type('#password', '8137');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  await page.goto(`${baseUrl}/guide/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('Guide Profile & Settings'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const text2 = await page.$eval('body', el => el.innerText);
  console.log('Anusha Profile Page Text:\n', text2.substring(0, 1500));

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
