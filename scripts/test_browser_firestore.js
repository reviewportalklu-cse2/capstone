import { launchBrowser, login, BASE_URL } from './e2e/test_helpers.js';

async function verify() {
  const { browser, page } = await launchBrowser();
  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
  try {
    await login(page, 'ashrith3155@kluniversity.in', '2056');
    await page.goto(`${BASE_URL}/guide/evaluate/C2C-1`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000));
    const state = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasSpinner: !!document.querySelector('.animate-spin'),
        bodyText: document.body.innerText.slice(0, 400),
        inputsCount: document.querySelectorAll('input').length,
        h1: document.querySelector('h1')?.innerText
      };
    });
    console.log('PAGE INSPECTION:', state);
  } finally {
    await browser.close();
  }
}

verify();
