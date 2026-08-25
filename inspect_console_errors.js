import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

async function inspectConsole() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    if (msg.location() && msg.location().url) {
      console.log(`  Location: ${msg.location().url}:${msg.location().lineNumber}`);
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });

  console.log("Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  await page.type('input[id="email"]', 'cse2admin@kluniversity.in');
  await page.type('input[id="password"]', 'cse2-2026');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.href.includes('/admin'), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log("Navigating around Admin pages...");
  await page.goto('http://localhost:5173/admin/students', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  await page.goto('http://localhost:5173/admin/evaluation-center', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
}

inspectConsole();
