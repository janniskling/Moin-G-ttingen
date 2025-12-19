const { KEYWORDS, BLACKLIST, getEmoji, parsePrice, getDescription, cleanTitle, processBarilla } = require('./config.cjs');

const KAUFLAND_URL = 'https://filiale.kaufland.de/angebote/uebersicht.html?cid=DE:6800&kloffer-category=0001_TopArticle';

async function scrapeKaufland(page) {
    console.log("  [Kaufland] Navigating...");
    try {
        await page.goto(KAUFLAND_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        const pageTitle = await page.title();
        console.log(`  [Kaufland] Page Title: ${pageTitle} `);

        // Cookie Banner
        try {
            const btn = await page.$('#onetrust-accept-btn-handler');
            if (btn) await btn.click();
        } catch (e) { }

        // Wait for content (relaxed)
        try {
            await new Promise(r => setTimeout(r, 4000)); // Simple wait
        } catch (e) { }

        // Load more logic? Kaufland puts all on one page usually or categorized.
        // We might need to scroll.
        await page.evaluate(async () => {
            window.scrollBy(0, 1000);
            await new Promise(r => setTimeout(r, 1000));
        });

        const rawItems = await page.evaluate(() => {
            const items = [];

            // Broadest possible search that worked before
            const elements = document.querySelectorAll('div, article, a, li');

            elements.forEach(el => {
                const text = el.innerText || "";
                if (text.length > 500) return;
                if ((!text.includes('€') && !text.match(/\d+[,\.]\d{2}/))) return;

                if (!text.includes('\n')) return;

                items.push({ text: text, link: "" });
            });
            return items;
        });


        console.log(`  [Kaufland] Parsing ${rawItems.length} items...`);
        const foundDeals = [];
        const seen = new Set();

        for (const item of rawItems) {
            const rawText = item.text.replace('DEBUG_WAGNER: ', '');
            const lowerText = rawText.toLowerCase();

            // Keyword check
            if (!KEYWORDS.some(k => lowerText.includes(k))) continue;
            // Blacklist check
            if (BLACKLIST.some(b => lowerText.includes(b))) continue;

            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Try to construct a good title. First line often "Knüller", so we clean it.
            // Text often: "Knüller\nBarilla Pesto\n..."
            let rawTitle = lines[0];
            if ((rawTitle.toLowerCase().includes('knüller') || rawTitle.includes('€')) && lines[1]) {
                rawTitle = lines[1];
            }

            // Clean specific "Knüller" strings from within title
            let title = cleanTitle(rawTitle);

            // Fallback if title became empty or numeric
            if (!title && lines.length > 2) title = cleanTitle(lines[0] + " " + lines[1]);
            if (!title) continue;

            // Special Barilla Handling
            let forcePriceVal = null;
            if (title.toLowerCase().includes('barilla')) {
                const bInfo = processBarilla(title, rawText);
                title = bInfo.title;
                if (bInfo.description) {
                    // Force description if bundle found
                    // We will attach it later or use it to override
                }
                if (bInfo.price) forcePriceVal = bInfo.price;
            }

            const priceObj = parsePrice(rawText, title, forcePriceVal);
            if (!priceObj) continue;

            let description = getDescription(rawText);

            // Re-apply special checks
            if (title.includes('Barilla') || title.includes('Pesto')) {
                const bInfo = processBarilla(title, rawText);
                if (bInfo.description) description = bInfo.description;
            }

            // Don't dedupe yet, collect all candidates
            foundDeals.push({
                store: 'Kaufland',
                title: title,
                price: priceObj.price,      // Main Deal Price
                oldPrice: priceObj.oldPrice, // Dictionary Price
                discount: priceObj.discount, // % off
                emoji: getEmoji(title),
                description: description,
                link: item.link || KAUFLAND_URL,
                // Add sorting helpers
                _isFood: (getEmoji(title) === '🍕' || getEmoji(title) === '🍝'),
                _priceVal: parseFloat(priceObj.price.replace(',', '.'))
            });
        }

        // Post-Processing Deduplication
        const uniqueDeals = [];
        const dealMap = new Map(); // title -> deal

        for (const deal of foundDeals) {
            const norm = deal.title.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 15);

            if (!dealMap.has(norm)) {
                dealMap.set(norm, deal);
            } else {
                const existing = dealMap.get(norm);
                // Smart Replacement logic
                if (deal._isFood) {
                    // For Food (Pizza), we want the LOWEST price
                    if (deal._priceVal < existing._priceVal) {
                        dealMap.set(norm, deal);
                    }
                } else {
                    // For Beer, we usually want the CHEAPEST deal (since we fixed the Max logic)
                    // If we have 10.99 (Deal) vs 17.79 (Old as separate invalid entry?), we prefer 10.99.
                    // Wait, previously I used Max for Beer. 
                    // But now parsePrice() correctly identifies Deal vs Old within the logic.
                    // So if parsePrice ran on "17.79" text only, it might return 17.79.
                    // If it ran on "10.99 .. was 17.79", it returns 10.99.
                    // We prefer the lower price entry generally?
                    // Yes. Krombacher 10.99 is better than 17.79 entry.
                    if (deal._priceVal < existing._priceVal) {
                        dealMap.set(norm, deal);
                    }
                }
            }
        }

        console.log(`  [Kaufland] Found ${dealMap.size} unique deals from ${foundDeals.length} candidates.`);
        return Array.from(dealMap.values());
    } catch (e) {
        console.error("  [Kaufland] Error:", e.message);
        return [];
    }
}

module.exports = scrapeKaufland;
