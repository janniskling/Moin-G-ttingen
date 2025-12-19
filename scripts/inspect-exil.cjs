const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('https://exil-web.de/', { waitUntil: 'networkidle2' });

    // evaluate and print DOM structure of first few events
    const validInfo = await page.evaluate(() => {
        // Try to find container
        const possibleContainers = document.querySelectorAll('article, .event, .post, div[class*="event"]');

        return Array.from(possibleContainers).slice(0, 3).map(el => ({
            tagName: el.tagName,
            className: el.className,
            innerText: el.innerText.substring(0, 50),
            children: Array.from(el.children).map(c => ({ tag: c.tagName, class: c.className }))
        }));
    });

    console.log(JSON.stringify(validInfo, null, 2));
    await browser.close();
})();
