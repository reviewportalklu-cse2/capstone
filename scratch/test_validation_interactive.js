import puppeteer from 'puppeteer';

async function testValidation() {
  console.log('=== TESTING DYNAMIC 50-MARK VALIDATION IN BROWSER ===');
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

  // Add 1 criterion
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Add Criterion'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const setInputValue = async (selector, value) => {
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, selector, value);
    await new Promise(r => setTimeout(r, 400));
  };

  // 1. Set Title and Criterion 1 Name
  await setInputValue('input[placeholder*="Review 1 Rubric"]', 'Isolated Test Rubric 50M');
  
  await page.evaluate(() => {
    const titleInput = document.querySelector('input[placeholder*="Completed System Functionality"]');
    if (titleInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(titleInput, 'System Functionality Criterion');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // 2. Set Marks to 49
  await page.evaluate(() => {
    const marksInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const critMarks = marksInputs[marksInputs.length - 1];
    if (critMarks) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(critMarks, '49');
      critMarks.dispatchEvent(new Event('input', { bubbles: true }));
      critMarks.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const check49 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    const body = document.body.innerText;
    return {
      disabled: pub ? pub.disabled : null,
      textIncludes49: body.includes('49 / 50')
    };
  });
  console.log('Result for 49 marks:', check49);

  // 3. Set Marks to 51
  await page.evaluate(() => {
    const marksInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const critMarks = marksInputs[marksInputs.length - 1];
    if (critMarks) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(critMarks, '51');
      critMarks.dispatchEvent(new Event('input', { bubbles: true }));
      critMarks.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const check51 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    const body = document.body.innerText;
    return {
      disabled: pub ? pub.disabled : null,
      textIncludes51: body.includes('51 / 50')
    };
  });
  console.log('Result for 51 marks:', check51);

  // 4. Set Marks to 50
  await page.evaluate(() => {
    const marksInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const critMarks = marksInputs[marksInputs.length - 1];
    if (critMarks) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(critMarks, '50');
      critMarks.dispatchEvent(new Event('input', { bubbles: true }));
      critMarks.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const check50 = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    const body = document.body.innerText;
    return {
      disabled: pub ? pub.disabled : null,
      textIncludes50: body.includes('50 / 50')
    };
  });
  console.log('Result for 50 marks:', check50);

  // 5. Test empty criterion title
  await page.evaluate(() => {
    const titleInput = document.querySelector('input[placeholder*="Completed System Functionality"]');
    if (titleInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(titleInput, '');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const checkEmptyName = await page.evaluate(() => {
    const pub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish'));
    return {
      disabled: pub ? pub.disabled : null
    };
  });
  console.log('Result for empty criterion name:', checkEmptyName);

  await browser.close();
}

testValidation();
