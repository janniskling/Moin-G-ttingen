const SAVOY_URL = 'https://www.club-savoy.de/events/';

module.exports = async function scrapeSavoy(page) {
    console.log("Scraping Savoy...");
    await page.goto(SAVOY_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
        await page.waitForSelector('ul[class*="styledEvents__StyledEventsGrid"]', { timeout: 10000 });

        return await page.evaluate(() => {
            const items = [];
            const grid = document.querySelector('ul[class*="styledEvents__StyledEventsGrid"]');
            if (!grid) return [];

            const lis = grid.querySelectorAll('li');
            lis.forEach(li => {
                try {
                    const titleEl = li.querySelector('div[class*="styledEvents__StyledEventItemText"] > div:nth-child(2)');
                    const dateEl = li.querySelector('div[class*="styledEvents__StyledEventItemDate"] span');
                    const img = li.querySelector('img');
                    const badgeEl = li.querySelector('div[class*="styledEvents__StyledEventItemBadge"]');

                    if (titleEl && dateEl) {
                        // Parse Date: "Fr. 22.12."
                        const rawDate = dateEl.innerText.trim();
                        const match = rawDate.match(/(\d{2})\.(\d{2})\./);
                        let isoDate = "";

                        if (match) {
                            const day = match[1];
                            const month = match[2];
                            let year = new Date().getFullYear();
                            // Handle year rollover
                            if (month < new Date().getMonth() + 1) year++;
                            isoDate = `${year}-${month}-${day}`;
                        }

                        if (!isoDate) return;

                        items.push({
                            title: titleEl.innerText.trim(),
                            date: isoDate,
                            time: "23:00", // Default club time
                            description: "Club Savoy Party",
                            location: "Club Savoy",
                            image: img ? img.src : "https://www.club-savoy.de/wp-content/uploads/2021/09/savoy-logo-neu-weiss.png", // Fallback or extracted
                            link: 'https://www.club-savoy.de/events/',
                            source: "Savoy",
                            category: "Party",
                            tags: ["Party", "Club", ...(badgeEl ? [badgeEl.innerText.trim()] : [])] // Kept tags for reference
                        });
                    }
                } catch (err) {
                    // ignore item error
                }
            });
            // Recurring Event: Studentenmittwoch (User req: Savoy)
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() + i);
                if (d.getDay() === 3) { // Wednesday
                    items.push({
                        title: 'Studentenmittwoch',
                        date: d.toISOString().split('T')[0],
                        time: '22:00',
                        description: 'Kostenloser Eintritt für Studenten bis 23 Uhr und 1€ Bier!',
                        location: 'Club Savoy',
                        image: '/images/savoy-student.png', // Custom generated image
                        link: 'https://www.club-savoy.de',
                        source: 'Savoy',
                        category: 'Party',
                        tags: ['Studenten', 'Party', '1€ Bier']
                    });
                }
            }

            return items;
        });
    } catch (e) {
        console.error("Savoy Scrape Error:", e);
        return [];
    }
};
