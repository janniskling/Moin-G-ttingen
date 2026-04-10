const BASE_URL = 'https://www.wasgehtingoettingen.de';

const CATEGORY_MAP = {
    disco: 'Party',
    konzert: 'Kultur',
    comedy: 'Kultur',
    theater: 'Kultur',
    kino: 'Sonstiges',
    sonstige: 'Sonstiges',
    tipp: 'Sonstiges',
};

function getDateRange(days) {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

module.exports = async function scrapeWasGehtInGoettingen(page) {
    const dates = getDateRange(14);
    const seen = new Set();
    const allEvents = [];

    for (const date of dates) {
        try {
            const url = `${BASE_URL}/index.php?date=${date}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            const events = await page.evaluate((baseUrl, currentDate) => {
                const results = [];
                const items = document.querySelectorAll('div.termin.inline');

                items.forEach(el => {
                    try {
                        const category = el.getAttribute('data-kat') || 'sonstige';

                        // Title
                        const titleEl = el.querySelector('h3.titel > a.target');
                        if (!titleEl) return;
                        const title = titleEl.textContent.trim();
                        if (!title) return;

                        // Date from link href: termin_details.php?id=...&date=YYYY-MM-DD
                        const href = titleEl.getAttribute('href') || '';
                        const dateMatch = href.match(/date=(\d{4}-\d{2}-\d{2})/);
                        const eventDate = dateMatch ? dateMatch[1] : currentDate;

                        // Time from span.zeit > b
                        const zeitEl = el.querySelector('span.zeit > b');
                        let time = '20:00';
                        if (zeitEl) {
                            const zeitText = zeitEl.textContent.trim();
                            const timeMatch = zeitText.match(/(\d{1,2}):(\d{2})\s*Uhr/);
                            if (timeMatch) {
                                time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                            }
                        }

                        // Location
                        const locationEl = el.querySelector('a.location');
                        const location = locationEl
                            ? locationEl.textContent.replace(/^pin/, '').trim()
                            : 'Göttingen';

                        // Description from subtitel (price/info)
                        const subtitelEl = el.querySelector('div.subtitel');
                        const description = subtitelEl ? subtitelEl.textContent.trim() : '';

                        // Image
                        const imgEl = el.querySelector('div.img img');
                        let image = '';
                        if (imgEl) {
                            const src = imgEl.getAttribute('src') || '';
                            image = src.startsWith('http') ? src : `${baseUrl}/${src.replace(/^\//, '')}`;
                        }

                        // Full event link
                        const link = href.startsWith('http')
                            ? href
                            : `${baseUrl}/${href.replace(/^\//, '')}`;

                        results.push({ title, date: eventDate, time, location, category, description, image, link });
                    } catch (e) {
                        // skip broken item
                    }
                });

                return results;
            }, BASE_URL, date);

            for (const ev of events) {
                const key = ev.title + ev.date;
                if (!seen.has(key)) {
                    seen.add(key);
                    allEvents.push({
                        ...ev,
                        category: CATEGORY_MAP[ev.category] || 'Sonstiges',
                        source: 'wasgehtingoettingen',
                    });
                }
            }
        } catch (e) {
            console.error(`   ⚠️  wasgehtingoettingen ${date}: ${e.message}`);
        }
    }

    return allEvents;
};
