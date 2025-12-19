const DUKE_URL = 'http://duke-pub-goettingen.de/';

async function scrapeDuke(page) {
    console.log("   Navigating to Duke Pub...");
    try {
        await page.goto(DUKE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // Duke has no obvious event calendar on main page.
        // Return empty for now.
        return [];
    } catch (e) {
        console.error("   [Duke] Error:", e.message);
        return [];
    }
}

module.exports = scrapeDuke;
