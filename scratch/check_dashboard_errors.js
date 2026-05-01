const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
        
        await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle0' });
        
        console.log('Page loaded successfully');
        await browser.close();
    } catch (e) {
        console.error('PUPPETEER ERROR:', e);
    }
})();
