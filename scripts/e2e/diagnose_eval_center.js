import { BASE_URL, launchBrowser, login } from './test_helpers.js';

async function diagnose() {
  const { browser, page } = await launchBrowser();
  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', err => console.error('[PAGE_ERROR]', err.message));

  try {
    await login(page, 'cse2admin@kluniversity.in', 'cse2-2026');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 });
    console.log("Logged in! Current URL:", page.url());

    await page.goto(`${BASE_URL}/admin/evaluation-center/teams`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000));
    console.log("Navigated to:", page.url());

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("BODY TEXT:\n", bodyText.substring(0, 500));

    const tableHtml = await page.evaluate(() => {
      const t = document.querySelector('table');
      return t ? t.outerHTML.substring(0, 300) : 'NO TABLE FOUND';
    });
    console.log("TABLE HTML:\n", tableHtml);

    const spinExists = await page.evaluate(() => !!document.querySelector('.animate-spin'));
    console.log("SPINNER EXISTS:", spinExists);

  } catch (e) {
    console.error("Diagnostic error:", e);
  } finally {
    await browser.close();
  }
}

diagnose();
