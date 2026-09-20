import puppeteer from 'puppeteer';

async function testRoleSwitch() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`[PAGE ERROR]:`, err.message, err.stack));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});

  await page.waitForSelector('h1', { timeout: 10000 });
  console.log("Logged in. Initial URL:", page.url());

  // Click role switcher
  console.log("\nClicking Role Switcher button...");
  await page.click('button[title="Click to switch operational role"]');
  await new Promise(r => setTimeout(r, 500));

  // Find all buttons inside dropdown
  const dropdownButtons = await page.evaluate(() => {
    const dropdown = document.querySelector('div.origin-top-right');
    if (!dropdown) return 'No dropdown found!';
    const buttons = Array.from(dropdown.querySelectorAll('button'));
    return buttons.map(b => b.innerText.trim().replace(/\n/g, ' '));
  });
  console.log("Dropdown buttons found:", dropdownButtons);

  // Click Classroom Faculty in dropdown
  const clicked = await page.evaluate(() => {
    const dropdown = document.querySelector('div.origin-top-right');
    if (!dropdown) return false;
    const btn = Array.from(dropdown.querySelectorAll('button')).find(b => b.innerText.includes('Classroom Faculty'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Clicked Classroom Faculty in dropdown?", clicked);

  await new Promise(r => setTimeout(r, 3000));
  console.log("URL after switch attempt:", page.url());

  // Now inspect what is rendered on screen
  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
  console.log("H1 on page:", h1);
  const rootText = await page.evaluate(() => document.body.innerText);
  console.log("Body snippet:", rootText.substring(0, 200).replace(/\n/g, ' '));

  await browser.close();
}

testRoleSwitch().catch(console.error);
