import puppeteer from 'puppeteer';

async function testReproduce() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]:`, err.message, err.stack);
  });

  console.log("Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  // Login as ashrith3155@kluniversity.in
  console.log("Logging in as ashrith3155@kluniversity.in...");
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  console.log("Current URL after login:", page.url());

  // Test Guide Profile
  console.log("\nTesting /guide/profile...");
  await page.goto('http://localhost:5173/guide/profile', { waitUntil: 'networkidle2' });
  let bodyContent = await page.evaluate(() => document.body.innerText);
  console.log("/guide/profile body text length:", bodyContent.length);
  if (bodyContent.length < 50) {
    console.log("WHITE SCREEN DETECTED on /guide/profile! Content:", bodyContent);
  } else {
    console.log("Guide profile loaded:", bodyContent.substring(0, 100).replace(/\n/g, ' '));
  }

  // Test Faculty Profile
  console.log("\nTesting /faculty/profile...");
  await page.goto('http://localhost:5173/faculty/profile', { waitUntil: 'networkidle2' });
  bodyContent = await page.evaluate(() => document.body.innerText);
  console.log("/faculty/profile body text length:", bodyContent.length);
  if (bodyContent.length < 50) {
    console.log("WHITE SCREEN DETECTED on /faculty/profile! Content:", bodyContent);
  } else {
    console.log("Faculty profile loaded:", bodyContent.substring(0, 100).replace(/\n/g, ' '));
  }

  // Test Reviewer Profile
  console.log("\nTesting /reviewer/profile...");
  await page.goto('http://localhost:5173/reviewer/profile', { waitUntil: 'networkidle2' });
  bodyContent = await page.evaluate(() => document.body.innerText);
  console.log("/reviewer/profile body text length:", bodyContent.length);
  if (bodyContent.length < 50) {
    console.log("WHITE SCREEN DETECTED on /reviewer/profile! Content:", bodyContent);
  } else {
    console.log("Reviewer profile loaded:", bodyContent.substring(0, 100).replace(/\n/g, ' '));
  }

  // Now test Admin Evaluation Center
  console.log("\nLogging in as Admin cse2admin@kluniversity.in...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'cse2admin@kluniversity.in');
  await page.type('input[type="password"]', 'cse2-2026');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  console.log("Current URL after admin login:", page.url());

  console.log("\nTesting Admin Evaluation Center /admin/evaluation-center...");
  await page.goto('http://localhost:5173/admin/evaluation-center', { waitUntil: 'networkidle2' });
  bodyContent = await page.evaluate(() => document.body.innerText);
  console.log("Admin Evaluation Center text snippet:", bodyContent.substring(0, 300).replace(/\n/g, ' '));

  await browser.close();
}

testReproduce().catch(console.error);
