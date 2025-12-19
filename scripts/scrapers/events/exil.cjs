const EXIL_URL = 'https://exil-web.de/';

module.exports = async function scrapeExil(page) {
    console.log("Navigating to Exil...");
    await page.goto(EXIL_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
        await page.waitForSelector('.kt-blocks-post-grid-item', { timeout: 10000 });

        return await page.evaluate(() => {
            const items = [];
            const grids = document.querySelectorAll('.kt-blocks-post-grid-item');

            grids.forEach(el => {
                try {
                    const linkEl = el.querySelector('a');
                    const imgEl = el.querySelector('img');
                    const titleEl = el.querySelector('.entry-title, h2, h3, h4');

                    if (!linkEl) return;

                    const href = linkEl.href;
                    const title = titleEl ? titleEl.innerText.trim() : linkEl.innerText.trim();
                    const img = imgEl ? (imgEl.dataset.src || imgEl.src) : null; // Check lazy load

                    // Parse Date from URL or Text
                    // URL format often: .../event/name/2025-12-19/
                    let isoDate = null;
                    const urlMatch = href.match(/(\d{4}-\d{2}-\d{2})/);

                    if (urlMatch) {
                        isoDate = urlMatch[1];
                    } else {
                        // Fallback: Try to find date in text? 
                        // Exil text often doesn't show date clearly on grid :((
                        // Skipping items without clear date for safety to avoid "TBA" spam
                        return;
                    }

                    if (!title || !isoDate) return;

                    items.push({
                        title: title,
                        date: isoDate,
                        time: "20:00", // Default door time
                        location: "Exil",
                        description: "Live Music & Party @ Exil",
                        image: img,
                        link: href,
                        source: "Exil",
                        category: title.toLowerCase().includes('party') ? 'Party' : 'Kultur'
                    });

                } catch (err) {
                    // ignore item error
                }
            });

            // Deduplicate
            const uniqueEvents = [];
            const seen = new Set();
            for (const item of items) {
                const key = item.title + item.date;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueEvents.push(item);
                }
            }
            return uniqueEvents;
        });
    } catch (e) {
        console.error("Exil Scrape Error (Selector not found?):", e.message);
        return [];
    }
};
