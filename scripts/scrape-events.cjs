const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import Scrapers
const scrapeMrJones = require('./scrapers/events/mrjones.cjs');
const scrapeNauti = require('./scrapers/events/nauti.cjs');
const scrapeDuke = require('./scrapers/events/duke.cjs');
const scrapeDots = require('./scrapers/events/dots.cjs');
const scrapeBG = require('./scrapers/events/bg.cjs');
const { upsertEvents } = require('./utils/db.cjs');

const OUTPUT_FILE = path.join(__dirname, '../public/events-data.json');

async function run() {
    console.log("📅 Starting Göttingen Event Scraper...");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const allEvents = [];

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // 1. Mr. Jones (Recurring + Scrape)
        console.log("➡️  Scraping Mr. Jones...");
        try {
            const jonesEvents = await scrapeMrJones(page);
            allEvents.push(...jonesEvents);
            console.log(`   ✅ Mr. Jones: Found ${jonesEvents.length} events.`);
        } catch (e) {
            console.error("   ❌ Mr. Jones Failed:", e.message);
        }

        // 2. BG Göttingen
        console.log("➡️  Scraping BG Göttingen...");
        try {
            const bgEvents = await scrapeBG(page);
            allEvents.push(...bgEvents);
            console.log(`   ✅ BG: Found ${bgEvents.length} events.`);
        } catch (e) {
            console.error("   ❌ BG Failed:", e.message);
        }

        // 3. Dots
        console.log("➡️  Scraping Dots...");
        try {
            const dotsEvents = await scrapeDots(page);
            allEvents.push(...dotsEvents);
            console.log(`   ✅ Dots: Found ${dotsEvents.length} events.`);
        } catch (e) { console.error("   ❌ Dots Failed:", e.message); }

        // 4. Nauti
        try { await scrapeNauti(page); } catch (e) { }

        // 5. Duke
        try { await scrapeDuke(page); } catch (e) { }

        // 6. Savoy (Adding back as requested)
        console.log("➡️  Scraping Savoy...");
        try {
            const scrapeSavoy = require('./scrapers/savoy.cjs');
            const savoyEvents = await scrapeSavoy(page);
            allEvents.push(...savoyEvents);
            console.log(`   ✅ Savoy: Found ${savoyEvents.length} events.`);
        } catch (e) { console.error("   ❌ Savoy Failed:", e.message); }

        // 7. Thanners
        console.log("➡️  Scraping Thanners...");
        try {
            const scrapeThanners = require('./scrapers/events/thanners.cjs');
            const thannersEvents = await scrapeThanners(page);
            allEvents.push(...thannersEvents);
            console.log(`   ✅ Thanners: Found ${thannersEvents.length} events.`);
        } catch (e) { console.error("   ❌ Thanners Failed:", e.message); }

        // 8. Exil
        console.log("➡️  Scraping Exil...");
        try {
            const scrapeExil = require('./scrapers/events/exil.cjs');
            const exilEvents = await scrapeExil(page);
            allEvents.push(...exilEvents);
            console.log(`   ✅ Exil: Found ${exilEvents.length} events.`);
        } catch (e) { console.error("   ❌ Exil Failed:", e.message); }

        // 9. EinsB (via Termine.de)
        console.log("➡️  Scraping EinsB...");
        try {
            const scrapeEinsB = require('./scrapers/events/einsb.cjs');
            const einsbEvents = await scrapeEinsB(page);
            allEvents.push(...einsbEvents);
            console.log(`   ✅ EinsB: Found ${einsbEvents.length} events.`);
        } catch (e) { console.error("   ❌ EinsB Failed:", e.message); }

        // 10. Alpenmax
        console.log("➡️  Scraping Alpenmax...");
        try {
            const scrapeAlpenmax = require('./scrapers/events/alpenmax.cjs');
            const alpenEvents = await scrapeAlpenmax(page);
            allEvents.push(...alpenEvents);
            console.log(`   ✅ Alpenmax: Found ${alpenEvents.length} events.`);
        } catch (e) { console.error("   ❌ Alpenmax Failed:", e.message); }

    } catch (e) {
        console.error("Global Scraper Error:", e);
    } finally {
        await browser.close();
    }

    // Filter Past Events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validEvents = allEvents.filter(e => {
        const d = new Date(e.date);
        return d >= today;
    });

    // Sort by Date
    validEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Write to file (keep for backup/legacy for now)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validEvents, null, 2));
    console.log(`\n🎉 JSON Saved: ${validEvents.length} events to public/events-data.json`);

    // Sync to Supabase
    await upsertEvents(validEvents);
}

run();
