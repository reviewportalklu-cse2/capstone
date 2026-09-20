import puppeteer from 'puppeteer';

async function testRoleProfile() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'ashrith3155@kluniversity.in');
  await page.type('input[type="password"]', '2056');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});

  // Wait for dashboard to load
  await page.waitForSelector('h1', { timeout: 10000 });
  console.log("Current URL:", page.url());

  // Check Guide Profile by clicking sidebar link
  console.log("\n=== 1. GUIDE PROFILE ===");
  const guideProfileLink = await page.$('a[href="/guide/profile"]');
  if (guideProfileLink) {
    await guideProfileLink.click();
    await new Promise(r => setTimeout(r, 1500));
    console.log("Guide Profile URL:", page.url());
    console.log("Guide Profile Title:", await page.evaluate(() => document.querySelector('h1')?.innerText));
    console.log("Guide Profile snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 300).replace(/\n/g, ' '));
  } else {
    console.log("Guide profile link NOT found");
  }

  // Switch to Faculty
  console.log("\n=== 2. SWITCH TO FACULTY & FACULTY PROFILE ===");
  const roleSwitcherButton = await page.$('button[title="Click to switch operational role"]');
  if (roleSwitcherButton) {
    await roleSwitcherButton.click();
    await new Promise(r => setTimeout(r, 500));
    // Click Classroom Faculty option
    const facultyOption = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const facultyBtn = btns.find(b => b.innerText.includes('Classroom Faculty') || b.innerText.includes('Faculty'));
      if (facultyBtn) {
        facultyBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked faculty option?", facultyOption);
    await new Promise(r => setTimeout(r, 2000));
    console.log("URL after switching to Faculty:", page.url());

    // Click Faculty Profile link
    const facultyProfileLink = await page.$('a[href="/faculty/profile"]');
    console.log("Found a[href='/faculty/profile']?", !!facultyProfileLink);
    if (facultyProfileLink) {
      await facultyProfileLink.click();
      await new Promise(r => setTimeout(r, 1500));
      console.log("Faculty Profile URL:", page.url());
      console.log("Faculty Profile Title:", await page.evaluate(() => document.querySelector('h1')?.innerText));
      console.log("Faculty Profile snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 300).replace(/\n/g, ' '));
      const htmlLen = await page.evaluate(() => (document.getElementById('root')?.innerHTML || '').length);
      console.log("Faculty Profile root HTML length:", htmlLen);
    }
  }

  // Switch to Reviewer
  console.log("\n=== 3. SWITCH TO REVIEWER & REVIEWER PROFILE ===");
  const roleSwitcherButton2 = await page.$('button[title="Click to switch operational role"]');
  if (roleSwitcherButton2) {
    await roleSwitcherButton2.click();
    await new Promise(r => setTimeout(r, 500));
    const reviewerOption = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reviewerBtn = btns.find(b => b.innerText.includes('Reviewer'));
      if (reviewerBtn) {
        reviewerBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked reviewer option?", reviewerOption);
    await new Promise(r => setTimeout(r, 2000));
    console.log("URL after switching to Reviewer:", page.url());

    // Click Reviewer Profile link
    const reviewerProfileLink = await page.$('a[href="/reviewer/profile"]');
    console.log("Found a[href='/reviewer/profile']?", !!reviewerProfileLink);
    if (reviewerProfileLink) {
      await reviewerProfileLink.click();
      await new Promise(r => setTimeout(r, 1500));
      console.log("Reviewer Profile URL:", page.url());
      console.log("Reviewer Profile Title:", await page.evaluate(() => document.querySelector('h1')?.innerText));
      console.log("Reviewer Profile snippet:", (await page.evaluate(() => document.body.innerText)).substring(0, 300).replace(/\n/g, ' '));
      const htmlLen = await page.evaluate(() => (document.getElementById('root')?.innerHTML || '').length);
      console.log("Reviewer Profile root HTML length:", htmlLen);
    }
  }

  await browser.close();
}

testRoleProfile().catch(console.error);
