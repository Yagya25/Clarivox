const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  
  // Capture page errors (like our ErrorBoundary throws)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:5173'); 
  
  // Step 1: Login
  await page.waitForSelector('.home-welcome__input');
  await page.type('.home-welcome__input', 'User'); 
  await page.click('button[type="submit"]'); 
  
  // Wait for transition to Arena selection
  await page.waitForSelector('#start-debate-btn', { visible: true, timeout: 5000 });
  
  // Step 2: Start Debate
  await page.click('#start-debate-btn'); 
  
  // Wait for navigation or error
  await new Promise(r => setTimeout(r, 6000)); 
  
  // Capture the text of the page to see if ErrorBoundary caught it
  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER START DEBATE:');
  console.log(text);
  
  await page.screenshot({path: 'crash_screenshot.png'}); 
  await browser.close(); 
})();
