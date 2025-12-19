const { KEYWORDS, getEmoji, parsePrice, getDescription, cleanTitle } = require('./config.cjs');

const EDEKA_URL = 'https://www.edeka.de/eh/hessenring/julian-motz-e.k.-weender-landstr.-59/angebote.jsp';

async function scrapeEdeka(page) {
    console.log("  [Edeka] Navigating...");
    try {
        await page.goto(EDEKA_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000));

        const pageTitle = await page.title();
        console.log(`  [Edeka] Page Title: ${pageTitle}`);

        // Shadow DOM Cookie handling check
        try {
            await page.evaluate(() => {
                // Try open source strategies for Edeka consent (often in shadowRoot)
                const host = document.querySelector('#usercentrics-root');
                if (host && host.shadowRoot) {
                    const btn = host.shadowRoot.querySelector('button[data-testid="uc-accept-all-button"]');
                    if (btn) btn.click();
                }
            });
        } catch (e) { }

        // Edeka lazy loads heavily. Scroll is needed.
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= 8000) { clearInterval(timer); resolve(); }
                }, 100);
            });
        });

        const rawItems = await page.evaluate(() => {
            const items = [];
            // Broadest search for Edeka
            const elements = document.querySelectorAll('div, a, article');
            elements.forEach(el => {
                const text = el.innerText || "";
                if (text.length > 500) return;
                // Edeka price often formatted with CSS, so InnerText might be "10\n49\n€"
                if ((text.includes('€') || text.includes('EUR')) && text.match(/\d+/)) {
                    items.push({ text: text });
                }
            });
            return items;
        });

        console.log(`  [Edeka] Parsing ${rawItems.length} items...`);
        const foundDeals = [];
        const seen = new Set();

        for (const item of rawItems) {
            const rawText = item.text;
            const lowerText = rawText.toLowerCase();

            if (!KEYWORDS.some(k => lowerText.includes(k))) continue;

            const lines = rawText.split('\n').filter(l => l.length > 2);
            let title = lines[0]; // Usually brand/product name is top

            title = cleanTitle(title);
            if (!title) continue;

            const priceObj = parsePrice(rawText, title);
            if (!priceObj) continue;

            const description = getDescription(rawText);

            const norm = title.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 15);
            if (seen.has(norm)) continue;
            seen.add(norm);

            foundDeals.push({
                store: 'Edeka',
                title: title,
                price: priceObj.price,
                oldPrice: priceObj.oldPrice,
                discount: priceObj.discount,
                emoji: getEmoji(title),
                description: description,
                link: EDEKA_URL
            });
        }

        console.log(`  [Edeka] Found ${foundDeals.length} deals.`);
        return foundDeals;

    } catch (e) {
        console.error("  [Edeka] Error:", e.message);
        return [];
    }
}

module.exports = scrapeEdeka;
