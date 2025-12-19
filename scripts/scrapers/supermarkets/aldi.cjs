const { KEYWORDS, getEmoji, parsePrice, getDescription, cleanTitle } = require('./config.cjs');

const ALDI_URL = 'https://www.aldi-nord.de/angebote.html';

async function scrapeAldi(page) {
    console.log("  [Aldi] Navigating...");
    try {
        await page.goto(ALDI_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        const pageTitle = await page.title();
        console.log(`  [Aldi] Page Title: ${pageTitle}`);

        // Aldi OneTrust
        try {
            const btn = await page.$('#onetrust-accept-btn-handler');
            if (btn) await btn.click();
        } catch (e) { }

        // Wait for grid
        try {
            await page.waitForSelector('.mod-article-tile', { timeout: 5000 });
        } catch (e) { }

        await page.evaluate(async () => {
            // Scroll simpler
            const dist = 500;
            for (let i = 0; i < 10; i++) {
                window.scrollBy(0, dist);
                await new Promise(r => setTimeout(r, 500));
            }
        });

        // Aldi cards: Broaden search
        const rawItems = await page.evaluate(() => {
            const items = [];
            const elements = document.querySelectorAll('div, article, a');

            elements.forEach(el => {
                const text = el.innerText || "";
                if (text.length > 500) return;

                if (text.includes('€') || text.match(/ab \d/)) {
                    if (text.includes('\n')) {
                        items.push({ text: text, link: null });
                    }
                }
            });
            return items;
        });

        console.log(`  [Aldi] Parsing ${rawItems.length} items...`);
        const foundDeals = [];
        const seen = new Set();

        for (const item of rawItems) {
            const rawText = item.text;
            const lowerText = rawText.toLowerCase();

            if (!KEYWORDS.some(k => lowerText.includes(k))) continue;

            const lines = rawText.split('\n').filter(l => l.length > 2);
            let title = lines[0];

            title = cleanTitle(title);
            if (!title) continue;

            const priceObj = parsePrice(rawText, title);
            if (!priceObj) continue;

            const description = getDescription(rawText);

            const norm = title.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 15);
            if (seen.has(norm)) continue;
            seen.add(norm);

            foundDeals.push({
                store: 'Aldi',
                title: title,
                price: priceObj.price,
                oldPrice: priceObj.oldPrice,
                discount: priceObj.discount,
                emoji: getEmoji(title),
                description: description,
                link: ALDI_URL
            });
        }

        console.log(`  [Aldi] Found ${foundDeals.length} deals.`);
        return foundDeals;

    } catch (e) {
        console.error("  [Aldi] Error:", e.message);
        return [];
    }
}

module.exports = scrapeAldi;
