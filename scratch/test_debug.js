import puppeteer from 'puppeteer';

async function testDebug() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]:`, err.message, err.stack);
  });

  console.log("1. Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  // Login as ashrith3155@kluniversity.in
  console.log("2. Logging in as ashrith3155@kluniversity.in...");
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  console.log("Current URL:", page.url());

  // Wait a bit for auth and state to settle
  await new Promise(r => setTimeout(r, 2000));
  console.log("Post-login body snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 100).replace(/\n/g, ' '));

  // Find and click the Profile link in sidebar
  console.log("\n3. Looking for Profile link in navigation/sidebar...");
  const profileLink = await page.$('a[href="/guide/profile"]');
  console.log("Found a[href='/guide/profile']?", !!profileLink);

  if (profileLink) {
    console.log("Clicking a[href='/guide/profile']...");
    await profileLink.click();
    await new Promise(r => setTimeout(r, 2000));
    console.log("URL after clicking Profile:", page.url());
    const html = await page.evaluate(() => document.getElementById('root')?.innerHTML || document.body.innerHTML);
    console.log("Root innerHTML length:", html.length);
    console.log("Body innerText:", (await page.evaluate(() => document.body.innerText)).substring(0, 200));
    if (html.length < 50) {
      console.log("HTML is empty! Full body HTML:", await page.evaluate(() => document.body.outerHTML));
    }
  }

  // Now test direct navigation to /guide/profile
  console.log("\n4. Direct navigation to /guide/profile...");
  await page.goto('http://localhost:5173/guide/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log("Direct URL:", page.url());
  const directHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || document.body.innerHTML);
  console.log("Direct Root innerHTML length:", directHtml.length);
  console.log("Direct Body innerText:", (await page.evaluate(() => document.body.innerText)).substring(0, 200));

  await browser.close();
}

testDebug().catch(console.error);
