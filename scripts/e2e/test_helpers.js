import puppeteer from 'puppeteer';

export const BASE_URL = process.env.LIVE_URL || 'https://facecloth-alongside-bottling.ngrok-free.dev';

export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  if (BASE_URL.includes('ngrok')) {
    try {
      await page.setRequestInterception(true);
      page.on('request', req => {
        if (req.url().includes('ngrok-free.dev') || req.url().includes('ngrok-free.app')) {
          const headers = Object.assign({}, req.headers(), {
            'ngrok-skip-browser-warning': 'true'
          });
          req.continue({ headers });
        } else {
          req.continue();
        }
      });
    } catch (e) {}
  }

  const consoleErrors = [];
  const consoleWarns = [];
  const pageErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (msg.type() === 'warning') {
      consoleWarns.push(text);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  page.on('dialog', async dialog => {
    try { await dialog.accept(); } catch (e) {}
  });

  await page.evaluateOnNewDocument(() => {
    window.alert = (msg) => console.log('[WINDOW_ALERT]', msg);
    window.confirm = (msg) => { console.log('[WINDOW_CONFIRM]', msg); return true; };
  });

  return { browser, page, consoleErrors, consoleWarns, pageErrors };
}

export async function login(page, email, password, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    // Handle ngrok interstitial if present
    try {
      const visitBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const btn = btns.find(b => b.innerText && b.innerText.includes('Visit Site'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (visitBtn) {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      }
    } catch (e) {}

    await new Promise(r => setTimeout(r, 1000));
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email);
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password);

    // Submit via Enter key on password input
    await passwordInput.press('Enter');

    try {
      await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
      return; // Login succeeded!
    } catch (e) {
      if (attempt === maxRetries) {
        // Fallback: Click submit button explicitly if Enter didn't trigger navigation
        if (page.url().includes('/login')) {
          const submitBtn = await page.$('button[type="submit"]');
          if (submitBtn) await submitBtn.click();
          await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 25000 });
        }
      } else {
        console.log(`[login] Retrying login for ${email} (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
}

export async function logout(page) {
  try {
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const logoutElem = elements.find(el => (el.innerText || '').toLowerCase().includes('logout'));
      if (logoutElem) logoutElem.click();
    });
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {}

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
}
