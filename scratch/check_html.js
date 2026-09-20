import puppeteer from 'puppeteer';

async function check() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log("=== LOGIN ===");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});

  // Wait for guide dashboard to load
  await page.waitForSelector('h1', { timeout: 10000 });
  console.log("Guide dashboard loaded. Title:", await page.evaluate(() => document.querySelector('h1')?.innerText));

  // 1. Guide profile
  console.log("\n=== TEST GUIDE PROFILE ===");
  await page.goto('http://localhost:5173/guide/profile', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !document.querySelector('.animate-spin') || document.querySelector('h1'), { timeout: 10000 });
  console.log("Guide profile loaded. H1:", await page.evaluate(() => document.querySelector('h1')?.innerText));
  console.log("Guide profile body length:", (await page.evaluate(() => document.body.innerText)).length);

  // 2. Switch role to faculty or test /faculty/profile
  console.log("\n=== TEST SWITCH TO FACULTY & FACULTY PROFILE ===");
  // Check role switcher
  const roleSelect = await page.$('select');
  if (roleSelect) {
    console.log("Found select element:", await page.evaluate(el => el.outerHTML, roleSelect));
  }
  
  // Navigate to /faculty
  await page.goto('http://localhost:5173/faculty/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log("Faculty profile URL:", page.url());
  console.log("Faculty profile H1:", await page.evaluate(() => document.querySelector('h1')?.innerText));
  console.log("Faculty profile body length:", (await page.evaluate(() => document.body.innerText)).length);
  console.log("Faculty profile body text snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 200).replace(/\n/g, ' '));

  // 3. Test /reviewer/profile
  console.log("\n=== TEST REVIEWER PROFILE ===");
  await page.goto('http://localhost:5173/reviewer/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log("Reviewer profile URL:", page.url());
  console.log("Reviewer profile H1:", await page.evaluate(() => document.querySelector('h1')?.innerText));
  console.log("Reviewer profile body length:", (await page.evaluate(() => document.body.innerText)).length);
  console.log("Reviewer profile body text snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 200).replace(/\n/g, ' '));

  await browser.close();
}

check().catch(console.error);
