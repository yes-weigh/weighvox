const { chromium } = require('playwright');

(async () => {
  console.log('Environment:');
  console.log('HOME:', process.env.HOME);
  console.log('USERPROFILE:', process.env.USERPROFILE);
  console.log('PLAYWRIGHT_BROWSERS_PATH:', process.env.PLAYWRIGHT_BROWSERS_PATH);

  try {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully!');
    const page = await browser.newPage();
    console.log('Navigating to google.com...');
    await page.goto('https://www.google.com');
    console.log('Title:', await page.title());
    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('Error launching browser:');
    console.error(err);
    process.exit(1);
  }
})();
