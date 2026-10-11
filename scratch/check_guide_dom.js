import puppeteer from 'puppeteer';

async function testGuideProfile() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:4173/login', { waitUntil: 'domcontentloaded' });
  await page.type('#email', 'guide01@university.edu');
  await page.type('#password', 'Guide@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/guide'), { timeout: 15000 });
  console.log('Login URL:', page.url());

  // Navigate to profile
  await page.goto('http://localhost:4173/guide/profile', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  console.log('Profile URL:', page.url());

  await browser.close();
}

testGuideProfile().catch(console.error);
