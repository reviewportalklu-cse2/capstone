import puppeteer from 'puppeteer';

async function check() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  await page.goto('http://localhost:4173/login', { waitUntil: 'domcontentloaded' });
  await page.type('#email', 'guide01@university.edu');
  await page.type('#password', 'Guide@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/guide'), { timeout: 15000 });
  console.log("Logged in at:", page.url());

  // Let's check the HTML before navigation
  const rootBefore = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length);
  console.log("Root innerHTML length before nav:", rootBefore);

  // Navigate using react router history or link
  await page.evaluate(() => {
    // Check if react router navigate is accessible
    window.location.href = '/guide/profile';
  });

  // Wait 6 seconds
  await new Promise(r => setTimeout(r, 6000));
  
  const rootAfter = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      html: root ? root.innerHTML : 'NO ROOT',
      body: document.body.innerHTML
    };
  });
  console.log("Root after nav:\n", rootAfter.html.substring(0, 500));

  await browser.close();
}

check().catch(console.error);
