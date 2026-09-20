import { BASE_URL, launchBrowser, login } from './test_helpers.js';

async function diagnose() {
  const { browser, page } = await launchBrowser();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text(), ...msg.args().map(a => a.toString()));
  });

  page.on('pageerror', err => {
    console.error('[PAGEERROR]', err.message, '\nStack:', err.stack);
  });

  page.on('requestfailed', req => {
    console.log('[FAILED_REQUEST]', req.url(), 'Error:', req.failure()?.errorText);
  });

  try {
    console.log('Logging in as evaluator...');
    await login(page, 'ashrith3155@kluniversity.in', '2056');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });

    console.log('Navigating to /guide/evaluate/C2C-1...');
    await page.goto(`${BASE_URL}/guide/evaluate/C2C-1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000));

    console.log('Final URL:', page.url());
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        value: i.value
      }));
    });
    console.log('All inputs count:', inputs.length, 'Samples:', JSON.stringify(inputs.slice(0, 5)));
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page text snippet (first 300 chars):', pageText.slice(0, 300).replace(/\n/g, ' '));
  } catch (e) {
    console.error('Diagnosis failed:', e);
  } finally {
    await browser.close();
  }
}

diagnose();
