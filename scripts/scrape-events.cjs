const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import Scrapers
const scrapeSavoy = require('./scrapers/savoy.cjs');
const scrapeExil = require('./scrapers/exil.cjs');
const scrapeAlpenmax = require('./scrapers/alpenmax.cjs');
// const scrapeMusa = require('./scrapers/musa.cjs');
const getThannersEvents = require('./scrapers/thanners.cjs');

const OUTPUT_FILE = path.join(__dirname, '../public/events-data.json');

async function run() {
    console.log("Starting Global Event Scraper...");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const allEvents = [];

    // 1. Run Browser-based Scrapers sequentially to save resources
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Helper to run safety
    async function runScraper(name, scraperFn) {
        try {
            const results = await scraperFn(page);
            console.log(`${name}: Found ${results.length} events.`);
            return results;
        } catch (e) {
            console.error(`Error scraping ${name}:`, e);
            return [];
        }
    }

    allEvents.push(...await runScraper('Savoy', scrapeSavoy));
    allEvents.push(...await runScraper('Exil', scrapeExil));
    allEvents.push(...await runScraper('Alpenmax', scrapeAlpenmax));
    // allEvents.push(...await runScraper('Musa', scrapeMusa)); // Removed per user request

    await browser.close();

    // 2. Run Static Generators
    try {
        const thanners = getThannersEvents();
        console.log(`Thanners: Generated ${thanners.length} events.`);
        allEvents.push(...thanners);
    } catch (e) {
        console.error("Error generating Thanners:", e);
    }

    // 3. Normalize and Sort
    // We need a unified date format. Most scrapers now return `date` as ISO string or something close.
    // Savoy returns `rawDate`. Need to parse it.

    const normalizedEvents = allEvents.map(ev => {
        let dateObj = new Date(ev.date || ev.rawDate); // Try parsing ISO first

        // If invalid or raw string from Savoy "Mi, 17.12.2025, 23:00"
        if (isNaN(dateObj.getTime()) && typeof ev.rawDate === 'string') {
            const match = ev.rawDate.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (match) {
                const [_, d, m, y] = match;
                // Add time if present
                const timeMatch = ev.rawDate.match(/(\d{2}):(\d{2})/);
                const h = timeMatch ? parseInt(timeMatch[1]) : 20;
                const min = timeMatch ? parseInt(timeMatch[2]) : 0;
                dateObj = new Date(y, parseInt(m) - 1, d, h, min);
            }
        }

        return {
            id: (ev.source + "-" + (ev.title + dateObj.toISOString()).replace(/[^a-z0-9]/gi, '')).toLowerCase(),
            title: ev.title,
            description: ev.description || "",
            location: ev.location,
            date: dateObj.toISOString(),
            imageUrl: ev.imageUrl || "",
            link: ev.link || "",
            tags: ev.tags || [],
            source: ev.source
        };
    }).filter(ev => !isNaN(new Date(ev.date).getTime()));

    // Sort
    normalizedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalizedEvents, null, 2));
    console.log(`\nSaved ${normalizedEvents.length} total events to ${OUTPUT_FILE}`);
}

run();
