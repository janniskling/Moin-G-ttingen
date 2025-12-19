const TERMINE_URL = 'https://www.termine.de/stadt/goettingen/veranstalter/club-einsb-freihafen-goettingen';

module.exports = async function scrapeEinsB(page) {
    console.log("Navigating to EinsB (via Termine.de)...");

    // Termine.de is an Angular App, needs robust waiting
    try {
        await page.goto(TERMINE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for *any* content to load inside app-root
        try {
            await page.waitForSelector('.event-item, .termin-liste, tr, article', { timeout: 15000 });
        } catch (e) {
            console.log("   ⚠️ EinsB: Timeout waiting for selectors. Angular might be slow or blocked.");
        }

        const events = await page.evaluate(() => {
            const items = [];
            // Termine.de structure varies, look for generic list items first
            // Selector strategy: Look for elements with date/time and titles

            // Try specific Termine.de selectors (reverse engineered guess based on common Angular structures)
            const eventCards = document.querySelectorAll('.event-item, .card, tr[itemtype="http://schema.org/Event"]');

            eventCards.forEach(card => {
                const titleEl = card.querySelector('h2, h3, .title, strong');
                const dateEl = card.querySelector('time, .date, .termin-datum');
                const linkEl = card.querySelector('a');

                if (!titleEl || !dateEl) return;

                const title = titleEl.innerText.trim();
                let dateStr = dateEl.innerText.trim(); // "20.12.2025" or similar
                const href = linkEl ? linkEl.href : window.location.href;

                // Parse Date (German format DD.MM.YYYY)
                const dateMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                let isoDate = null;
                if (dateMatch) {
                    isoDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
                } else {
                    // Try parsing "Freitag, 20. Dezember" if needed, simplified for now
                    return;
                }

                items.push({
                    title: title,
                    date: isoDate,
                    time: "22:00", // Default if not found
                    location: "EinsB",
                    description: "Event im EinsB",
                    image: "/images/student-party.jpg", // Placeholder until we extract real one
                    link: href,
                    source: "EinsB",
                    category: "Party"
                });
            });

            return items;
        });

        return events;

    } catch (e) {
        console.error("   ❌ EinsB Scraper Error:", e.message);
        return [];
    }
};
