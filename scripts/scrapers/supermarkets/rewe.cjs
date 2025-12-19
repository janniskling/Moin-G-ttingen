const { KEYWORDS, getEmoji, parsePrice, getDescription, cleanTitle } = require('./config.cjs');

const REWE_URL = 'https://www.rewe.de/angebote/goettingen-weende/540361/rewe-markt-weender-landstr-76/';

async function scrapeRewe(page) {
    console.log("  [Rewe] Navigating...");
    try {
        await page.goto(REWE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        // Cookie
        try {
            const btns = ['#uc-btn-accept-banner', '.cmpboxbtnyes'];
            for (const b of btns) { if (await page.$(b)) await page.click(b); }
        } catch (e) { }

        // Scroll
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= 10000) { clearInterval(timer); resolve(); }
                }, 100);
            });
        });
        await new Promise(r => setTimeout(r, 2000));

        const rawItems = await page.evaluate(() => {
            const items = [];
            const elements = document.querySelectorAll('div, article, a');
            elements.forEach(el => {
                const text = el.innerText || "";
                if (text.length > 300 || !text.includes('€')) return;
                items.push({ text: text });
            });
            return items;
        });

        console.log(`  [Rewe] Parsing ${rawItems.length} text blocks...`);
        const foundDeals = [];
        const seen = new Set();

        // Re-looping with proper Node context logic
        for (const item of rawItems) {
            const rawText = item.text;
            const lowerText = rawText.toLowerCase();

            if (!KEYWORDS.some(k => lowerText.includes(k))) continue;

            // Extract Title
            const lines = rawText.split('\n');
            let title = lines[0].trim();
            // Try to find a better title if first line is empty or price
            if (title.includes('€') || title.length < 3) {
                const betterLine = lines.find(l => l.length > 3 && !l.includes('€'));
                if (betterLine) title = betterLine.trim();
            }

            // Clean title here too
            title = cleanTitle(title);
            if (!title) continue;

            const priceObj = parsePrice(rawText, title); // Returns object now
            if (!priceObj) continue;

            const description = getDescription(rawText);

            // Deduplicate
            const norm = title.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 15);
            if (seen.has(norm)) continue;
            seen.add(norm);

            foundDeals.push({
                store: 'Rewe',
                title: title,
                price: priceObj.price,
                oldPrice: priceObj.oldPrice,
                discount: priceObj.discount,
                emoji: getEmoji(title),
                description: description,
                link: REWE_URL
            });
        }

        console.log(`  [Rewe] Found ${foundDeals.length} deals.`);
        return foundDeals;

    } catch (e) {
        console.error("  [Rewe] Error:", e.message);
        return [];
    }
}

// Local helper for price parsing if I need to use it inside evaluate? 
// No, I moved processing to Node side which is better.
// But I need to redefine parsePrice here? No, I required it.
const { parsePrice: _p, getDescription: _d } = require('./config.cjs');
// Ah, implicit valid JS.

module.exports = scrapeRewe;
