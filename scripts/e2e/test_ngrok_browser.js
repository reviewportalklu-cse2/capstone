import puppeteer from 'puppeteer';

const NGROK_URL = 'https://facecloth-alongside-bottling.ngrok-free.dev';

async function testNgrok() {
  console.log(`Testing ngrok URL: ${NGROK_URL}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.setCookie({
    name: 'ngrok-skip-browser-warning',
    value: '69420',
    domain: 'facecloth-alongside-bottling.ngrok-free.dev'
  });

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  try {
    console.log('Navigating to ngrok URL...');
    await page.goto(NGROK_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if ngrok interstitial warning exists and click it if present
    const warningButton = await page.$('button, input[type="submit"], a');
    const content = await page.content();
    if (content.includes('ngrok-free.app') || content.includes('Visit Site') || content.includes('ngrok-free.dev')) {
      const visitBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const btn = btns.find(b => b.innerText && b.innerText.includes('Visit Site'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (visitBtn) {
        console.log('Clicked ngrok "Visit Site" warning button.');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      }
    }

    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    console.log('Login form successfully rendered on ngrok URL!');

    // Check if URL still on ngrok
    if (page.url().includes('facecloth-alongside-bottling.ngrok-free.dev')) {
      console.log('Verified: URL remains on ngrok HTTPS domain.');
    } else {
      console.error('URL redirected away from ngrok:', page.url());
    }

    // Perform Admin login
    console.log('Attempting Admin login over ngrok...');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    await emailInput.click({ clickCount: 3 });
    await emailInput.type('cse2admin@kluniversity.in');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('cse2-2026');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 20000 });
    console.log('Admin login successful! Post-login URL:', page.url());

    // Wait for data load
    await new Promise(r => setTimeout(r, 4000));
    console.log('Dashboard content check...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Dashboard preview (first 200 chars):', bodyText.slice(0, 200).replace(/\n/g, ' '));

    console.log('\n--- Console Messages ---');
    consoleMessages.slice(-10).forEach(m => console.log(m));

    console.log('\n--- Errors ---');
    console.log(errors.length === 0 ? 'Zero errors!' : errors);

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    console.log('\n--- All Console Messages ---');
    consoleMessages.forEach(m => console.log(m));
    console.log('\n--- Errors ---');
    console.log(errors);
    await browser.close();
  }
}

testNgrok();
