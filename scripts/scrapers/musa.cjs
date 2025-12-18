module.exports = async function scrapeMusa(page) {
    console.log('Scraping Musa...');
    const url = 'https://www.musa.de';
    // Homepage has the list
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract year from the navigation bar "2025" or similar
    const year = await page.evaluate(() => {
        // Try to find the year in the calculator nav
        // Structure: <div class="cal-nav ..."> ... <div class="p-1">2025</div> ... </div>
        // This is a bit loose, let's try finding the element containing 4 digits inside cal-nav
        const nav = document.querySelector('.cal-nav');
        if (nav) {
            const yearEl = Array.from(nav.querySelectorAll('div')).find(div => div.innerText.trim().match(/^\d{4}$/));
            return yearEl ? parseInt(yearEl.innerText.trim()) : new Date().getFullYear();
        }
        return new Date().getFullYear();
    });

    const events = await page.evaluate((currentYear) => {
        const items = Array.from(document.querySelectorAll('.container.event'));
        return items.map(div => {
            // Check if it's a real event row
            const titleEl = div.querySelector('.musa-event-title a');
            if (!titleEl) return null;

            const dateEl = div.querySelector('.h2.mb-0, .musa-event-date');
            // "19.12."
            const timeEl = div.querySelector('.event-time'); // "Beginn: 20:00"
            const categoryEl = div.querySelector('.small'); // "PARTY" or "KONZERT"

            let dateStr = dateEl ? dateEl.innerText.trim().replace(/[^\d.]/g, '') : '';
            if (dateStr.endsWith('.')) dateStr = dateStr.slice(0, -1); // "19.12"

            let timeStr = timeEl ? timeEl.innerText.replace('Beginn:', '').trim() : '20:00';

            return {
                title: titleEl.innerText.trim(),
                datePartial: dateStr, // "19.12"
                time: timeStr,
                location: 'Musa',
                link: titleEl.href, // Absolute URL usually handled by browser
                source: 'Musa',
                tags: categoryEl ? [categoryEl.innerText.trim()] : [],
                imageUrl: '' // Only available on detail page usually, or we can look for backgrounds
            };
        }).filter(e => e !== null);
    }, year);

    // Post-process dates
    return events.map(ev => {
        let isoDate = null;
        try {
            const [day, month] = ev.datePartial.split('.').map(s => parseInt(s, 10));
            if (day && month) {
                // Adjust year if needed (e.g. scrap in Dec, event in Jan)
                // However, we extracted the 'current displayed year' from the nav.
                // But the nav year might be "2025" while some events are "2026" if the list spans?
                // The musa list seems to be monthly.
                // Let's assume the extracted year is correct for the visible block,
                // OR handle year rollover if month < currentMonth (assuming future events).

                // Better approach: if month is smaller than the scrape month, it might be next year?
                // But the 'year' variable passed from evaluate was from the nav bar, so it should be the context.

                let eventYear = year;
                // Heuristic: If we are in Dec and event is Jan, add 1 year?
                // No, rely on the page context if possible.
                // If page says "2025" in nav, assume 2025. 
                // Wait, if I browse next month, the URL changes to /2026/1/. 
                // Since I scrap homepage, it's the current month/view.

                const [h, m] = ev.time.split(':').map(s => parseInt(s, 10));
                const d = new Date(eventYear, month - 1, day, h || 20, m || 0);
                isoDate = d.toISOString();
            }
        } catch (e) { console.error('Date parse musa', e); }

        return {
            title: ev.title,
            date: isoDate,
            location: ev.location,
            link: ev.link,
            imageUrl: ev.imageUrl, // Might be empty
            source: ev.source,
            description: '',
            tags: ev.tags
        };
    });
};
