const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:5173');
  
  // Login
  await page.waitForSelector('.name-screen__input', { timeout: 10000 });
  await page.type('.name-screen__input', 'User');
  await page.keyboard.press('Enter');
  
  // Welcome page - wait for scroll trigger and click Let's Begin
  await page.waitForSelector('#continue-btn', { visible: true, timeout: 10000 });
  await page.click('#continue-btn');
  
  // Wait for topic selection to load
  await page.waitForSelector('.home-settings', { visible: true, timeout: 5000 });
  
  // Scroll down by 500px to see if background cuts off
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot
  await page.screenshot({ path: 'layout_bug.png', fullPage: true });
  
  await browser.close();
})();
