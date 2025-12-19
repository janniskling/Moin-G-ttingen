const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const scrapeRewe = require('./scrapers/supermarkets/rewe.cjs');
const scrapeKaufland = require('./scrapers/supermarkets/kaufland.cjs');
const scrapeEdeka = require('./scrapers/supermarkets/edeka.cjs');
const scrapeAldi = require('./scrapers/supermarkets/aldi.cjs');
const { upsertDeals } = require('./utils/db.cjs');

const OUTPUT_FILE = path.join(__dirname, '../public/deals-data.json');

async function run() {
    console.log("🛒 Starting Göttingen Supermarket Scraper...");

    // Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const allDeals = [];

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // 1. Rewe
        const reweDeals = await scrapeRewe(page);
        allDeals.push(...reweDeals);

        // 2. Kaufland
        const kauflandDeals = await scrapeKaufland(page);
        allDeals.push(...kauflandDeals);

        // Edeka (Currently disabled due to false positives)
        // const edekaDeals = await scrapeEdeka(page);
        // allDeals.push(...edekaDeals);

        // 4. Aldi
        const aldiDeals = await scrapeAldi(page);
        allDeals.push(...aldiDeals);

    } catch (e) {
        console.error("Global Scraper Error:", e);
    } finally {
        await browser.close();
    }

    // Final Deduplication & Cleanup
    const finalData = allDeals.map(d => ({
        id: Math.random().toString(36).substr(2, 9),
        store: d.store,
        title: d.title,
        price: d.price,
        oldPrice: d.oldPrice, // New
        discount: d.discount, // New
        image: d.emoji || '🛒',
        description: d.description || "Details im Markt",
        isStudentDeal: true,
        link: d.link
    }));

    console.log(`✅ Total deals found: ${finalData.length}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));

    // Sync to Supabase
    await upsertDeals(finalData);
}

run();
