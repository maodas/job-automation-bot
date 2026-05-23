const { chromium } = require('playwright');

(async () => {
  console.log('Testing Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Page title:', title);
  await browser.close();
  console.log('✅ Playwright working!');
})();
