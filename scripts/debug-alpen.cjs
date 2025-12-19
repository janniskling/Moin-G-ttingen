const puppeteer = require('puppeteer');
const ALPEN_URL = 'https://www.alpenmax-goettingen.com/events';

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreHTTPSErrors: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log("Navigating...");
    await page.goto(ALPEN_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Click cookies
    try {
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a.btn'));
            const cookieBtn = buttons.find(b => b.innerText.includes('Akzeptieren'));
            if (cookieBtn) cookieBtn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) { }

    // Find "19.12.2025" (or current date if passed)
    const debugInfo = await page.evaluate(() => {
        // Search text node
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        const matches = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes('20.12.2025') || node.nodeValue.includes('19.12.2025')) {
                const p = node.parentElement;
                const sib = p.nextElementSibling;
                matches.push({
                    text: node.nodeValue.trim(),
                    tag: p.tagName,
                    class: p.className,
                    siblingTag: sib ? sib.tagName : 'null',
                    siblingText: sib ? sib.innerText.substring(0, 50) : 'null'
                });
            }
        }
        return matches;
    });

    console.log("Found matches:", JSON.stringify(debugInfo, null, 2));
    await browser.close();
})();
