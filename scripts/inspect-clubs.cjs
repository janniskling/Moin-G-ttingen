const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreHTTPSErrors: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Inspect EinsB via WasGehtInGoettingen
    try {
        console.log("--- EINSB (via WasGehtInGoettingen) ---");
        await page.goto('https://www.wasgehtingoettingen.de/lokation/einsb-freihafen-goettingen', { waitUntil: 'networkidle2', timeout: 30000 });
        const einsbInfo = await page.evaluate(() => {
            // Usually standard table or list
            const items = document.querySelectorAll('tr, .event, .termin');
            if (items.length === 0) return "No events found. Body len: " + document.body.innerText.length;
            return Array.from(items).slice(0, 5).map(el => ({
                text: el.innerText.replace(/\s+/g, ' ').substring(0, 100),
                link: el.querySelector('a')?.href
            }));
        });
        console.log(JSON.stringify(einsbInfo, null, 2));
    } catch (e) { console.log("EinsB WasGeht Error:", e.message); }

    // Inspect Alpenmax (React App + Cookie Click)
    try {
        console.log("--- ALPENMAX ---");
        await page.goto('https://www.alpenmax-goettingen.com/events', { waitUntil: 'networkidle0', timeout: 45000 });

        // Try to click cookie button
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a.btn'));
            const cookieBtn = buttons.find(b => b.innerText.includes('Akzeptieren') || b.innerText.includes('Zustimmen') || b.innerText.includes('Alles'));
            if (cookieBtn) cookieBtn.click();
        });

        // Wait for potential reload/render
        await new Promise(r => setTimeout(r, 2000));

        const alpenInfo = await page.evaluate(() => {
            const root = document.getElementById('root') || document.body;
            // Look for event cards again
            const cards = document.querySelectorAll('div[class*="event"], div[class*="card"], article');
            return {
                count: cards.length,
                sample: Array.from(cards).slice(0, 3).map(c => c.innerText.substring(0, 100))
            };
        });
        console.log(JSON.stringify(alpenInfo, null, 2));
    } catch (e) { console.log("Alpenmax Error:", e.message); }

    await browser.close();
})();
