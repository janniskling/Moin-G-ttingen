const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OVERVIEW_URL = 'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/speiseplaene-der-mensen';
const OUTPUT_FILE = path.join(__dirname, '../public/mensa-data.json');

const CANTEEN_MAPPING = {
    'Zentralmensa': 179,
    'CGiN': 180,
    'Mensa am Turm': 181,
    'Bistro HAWK': 182 // Added based on debug output
};

async function scrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Go to Overview Page
    console.log(`Navigating to ${OVERVIEW_URL}...`);
    await page.goto(OVERVIEW_URL, { waitUntil: 'networkidle0', timeout: 90000 }); // Increased timeout

    // 2. Get available dates from the dropdown
    const dates = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('#sp_datenav option'));
        return options.map(opt => ({
            value: opt.value, // e.g., "2025-12-17"
            label: opt.innerText // e.g., "Heute"
        })).filter(d => d.value.match(/^\d{4}-\d{2}-\d{2}$/)); // Basic validation
    });

    console.log(`Found ${dates.length} dates:`, dates.map(d => d.value).join(', '));

    const allData = {};

    // 3. Loop through dates
    // Scrape first 3 available dates
    const datesToScrape = dates.slice(0, 3);

    for (const dateObj of datesToScrape) {
        const dateStr = dateObj.value;
        console.log(`Scraping date: ${dateStr} (${dateObj.label})...`);

        // Initialize date entry
        allData[dateStr] = {};

        try {
            // Select the date in the dropdown
            const currentVal = await page.$eval('#sp_datenav', el => el.value);

            if (currentVal !== dateStr) {
                console.log(`Switching to ${dateStr}...`);
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }), // networkidle0 is stricter/better for simple pages
                    page.select('#sp_datenav', dateStr)
                ]);
            } else {
                console.log("Already on selected date.");
            }
            // Wait for hydration/rendering just in case
            await new Promise(r => setTimeout(r, 2000));

            // Extract content
            const scrapedDateData = await page.evaluate((mapping) => {
                const results = {};

                // Find all tables
                const tables = document.querySelectorAll('table.sp_tab');

                tables.forEach(table => {
                    // Find header to identify canteen
                    const th = table.querySelector('th');
                    if (!th) return;
                    const fullTitle = th.innerText.trim(); // e.g., "Zentralmensa\n17.12.2025" or "CGiN"

                    // Match against our mapping
                    let canteenId = null;
                    for (const [name, id] of Object.entries(mapping)) {
                        // Check if the header *starts with* or *contains* the canteen name
                        // "CGiN" is in "CGiN\n17.12.2025"
                        if (fullTitle.includes(name)) {
                            canteenId = id;
                            break;
                        }
                    }

                    if (!canteenId) return;

                    results[canteenId] = [];

                    // Iterate rows
                    const rows = table.querySelectorAll('tr.odd, tr.even');
                    rows.forEach((row, idx) => {
                        const typeEl = row.querySelector('.sp_typ');
                        const descEl = row.querySelector('.sp_bez');

                        if (typeEl && descEl) {
                            const category = typeEl.innerText.trim();
                            const mainNameEl = descEl.querySelector('strong');
                            const mainName = mainNameEl ? mainNameEl.innerText.trim() : descEl.innerText.split('\n')[0].trim();
                            const rawText = descEl.innerText.trim();

                            // Filter out headers/non-meals
                            if (category.includes('Last Minute') && mainName.includes('Last Minute')) return;
                            if (mainName.includes("Nachmittagsangebot ab")) return;

                            results[canteenId].push({
                                id: parseInt(`${canteenId}${idx}`),
                                name: mainName,
                                category: category,
                                prices: { students: 0, employees: 0, others: 0 },
                                notes: [rawText]
                            });
                        }
                    });
                });

                return results;
            }, CANTEEN_MAPPING);

            // Merge into allData
            Object.assign(allData[dateStr], scrapedDateData);

            // Log detailed results
            for (const [name, id] of Object.entries(CANTEEN_MAPPING)) {
                const count = scrapedDateData[id] ? scrapedDateData[id].length : 0;
                console.log(`  ${name} (${id}): Found ${count} meals.`);
            }

        } catch (e) {
            console.error(`Failed to scrape ${dateStr}:`, e);
            // If one date fails, we try the next
        }
    }

    console.log(`Extracted keys: ${Object.keys(allData).join(', ')}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);

    await browser.close();
}

scrape().catch(err => {
    console.error('Scraping failed:', err);
    process.exit(1);
});
