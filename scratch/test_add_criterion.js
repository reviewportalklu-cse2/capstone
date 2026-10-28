import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@university.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));

  await page.goto('http://localhost:5173/admin/rubrics/builder/new', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('1. Initial text on /new:');
  const txt1 = await page.evaluate(() => document.body.innerText);
  console.log('Includes "0 / 50":', txt1.includes('0 / 50'));

  console.log('2. Clicking "Add Criterion"...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Add Criterion'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const txt2 = await page.evaluate(() => document.body.innerText);
  console.log('After clicking Add Criterion:');
  console.log('Includes "10 / 50":', txt2.includes('10 / 50'));
  console.log('Criterion inputs count:', await page.evaluate(() => document.querySelectorAll('input').length));

  console.log('3. Clicking "Add Criterion" 4 more times...');
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add Criterion'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  const txt3 = await page.evaluate(() => document.body.innerText);
  console.log('After adding 5 criteria (10 x 5 = 50):');
  console.log('Includes "50 / 50":', txt3.includes('50 / 50'));

  // Fill in titles for all 5 criteria
  await page.evaluate(() => {
    const titleInputs = Array.from(document.querySelectorAll('input[placeholder*="Completed System Functionality"]'));
    titleInputs.forEach((inp, idx) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, `Test Criterion ${idx + 1}`);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await new Promise(r => setTimeout(r, 1000));

  const pubStatus50 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish Rubric'));
    return {
      exists: !!pub,
      disabled: pub ? pub.disabled : null,
      bodyText: document.body.innerText.slice(0, 700)
    };
  });
  console.log('Publish status for 50/50 with all names filled:');
  console.log(' - Disabled:', pubStatus50.disabled);

  // Now change first criterion marks to 9 (making total 49)
  console.log('\n4. Changing marks to 9 (making total 49)...');
  await page.evaluate(() => {
    const numberInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    // The number inputs are: targetTotal (idx 0), then each criterion's maxMarks (idx 1, 2, 3, 4, 5)
    const firstCritMarks = numberInputs[1];
    if (firstCritMarks) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(firstCritMarks, '9');
      firstCritMarks.dispatchEvent(new Event('input', { bubbles: true }));
      firstCritMarks.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const pubStatus49 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish Rubric'));
    const body = document.body.innerText;
    return {
      disabled: pub ? pub.disabled : null,
      has49Display: body.includes('49 / 50'),
      hasWarning: body.includes('Total Marks Warning')
    };
  });
  console.log('Publish status for 49/50:');
  console.log(' - Displays 49 / 50:', pubStatus49.has49Display);
  console.log(' - Total Marks Warning shown:', pubStatus49.hasWarning);
  console.log(' - Publish button disabled (BLOCKED):', pubStatus49.disabled);

  // Now change first criterion marks to 11 (making total 51)
  console.log('\n5. Changing marks to 11 (making total 51)...');
  await page.evaluate(() => {
    const numberInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const firstCritMarks = numberInputs[1];
    if (firstCritMarks) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(firstCritMarks, '11');
      firstCritMarks.dispatchEvent(new Event('input', { bubbles: true }));
      firstCritMarks.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const pubStatus51 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish Rubric'));
    const body = document.body.innerText;
    return {
      disabled: pub ? pub.disabled : null,
      has51Display: body.includes('51 / 50'),
      hasWarning: body.includes('Total Marks Warning')
    };
  });
  console.log('Publish status for 51/50:');
  console.log(' - Displays 51 / 50:', pubStatus51.has51Display);
  console.log(' - Total Marks Warning shown:', pubStatus51.hasWarning);
  console.log(' - Publish button disabled (BLOCKED):', pubStatus51.disabled);

  await browser.close();
}

test();
