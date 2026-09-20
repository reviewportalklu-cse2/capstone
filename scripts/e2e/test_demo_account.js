import { BASE_URL, launchBrowser, login } from './test_helpers.js';

async function testDemo() {
  const { browser, page } = await launchBrowser();
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  try {
    console.log("Attempting Demo login (demovisit@gmail.com / demovisit609)...");
    await login(page, 'demovisit@gmail.com', 'demovisit609');
    await new Promise(r => setTimeout(r, 4000));
    console.log("Current URL after demo login:", page.url());
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Body text snippet:\n", text.substring(0, 300));
  } catch (e) {
    console.error("Demo login error:", e.message);
  } finally {
    await browser.close();
  }
}

testDemo();
