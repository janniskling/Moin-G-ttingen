const NAUTI_URL = 'https://nauti-bar.de/';

async function scrapeNauti(page) {
    console.log("   Navigating to Nautibar...");
    try {
        await page.goto(NAUTI_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Nauti mostly static. Maybe check for "Live" or dates in text?
        // Since we didn't find clear event list in research, we'll do a simple keyword scan for now.
        // If "Live" or a date is found near "Event", we could log it.
        // For now, return empty unless we find "Heute: ..." patterns.

        return [];
    } catch (e) {
        console.error("   [Nauti] Error:", e.message);
        return [];
    }
}

module.exports = scrapeNauti;
