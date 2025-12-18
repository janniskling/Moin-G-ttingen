module.exports = async function scrapeAlpenmax(page) {
    console.log('Scraping Alpenmax...');
    const url = 'https://alpenmax-goettingen.com/events';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the list to load (it's a React app)
    try {
        await page.waitForSelector('ul > div.bg-primary', { timeout: 10000 });
    } catch (e) {
        console.warn('Alpenmax event list selector not found (might be no events or changed structure).');
        return [];
    }

    const events = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('ul > div.bg-primary'));
        return items.map(div => {
            const titleEl = div.querySelector('h2');
            const dateEl = div.querySelector('p.opacity-90');
            const imgEl = div.querySelector('img');

            // Link is tricky, using the main events page as fallback
            const link = 'https://alpenmax-goettingen.com/events';

            // Text: "Fr., 19. Dez., 22:00 • Abendkasse 9,90 €"
            let dateText = dateEl ? dateEl.textContent.trim() : '';
            let parsedDate = null;

            // Simple approach: Extract date part and assume current/next year
            // This is brittle and might need distinct parsing logic
            // Setup a "best guess" or just return raw string if parsing fails
            // For now, let's try to extract the ISO date
            // Assuming german format: "Fr., 19. Dez., 22:00"
            // We can resolve the month name

            return {
                title: titleEl ? titleEl.textContent.trim() : '',
                rawDate: dateText,
                description: '', // No summary on card
                location: 'Alpenmax',
                imageUrl: imgEl ? imgEl.src : '',
                link: link,
                source: 'Alpenmax',
                tags: ['Party', 'Club']
            };
        });
    });

    // Post-process dates in Node.js to be safer/easier
    const currentYear = new Date().getFullYear();
    const months = {
        'Jan': 0, 'Feb': 1, 'Mär': 2, 'Apr': 3, 'Mai': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Dez': 11
    };

    return events.map(ev => {
        // Parse "Fr., 19. Dez., 22:00"
        let isoDate = null;
        try {
            const parts = ev.rawDate.match(/(\d+)\.\s*([A-Za-zäöü]+)\.?,?\s*(\d{2}):(\d{2})/);
            // e.g. ["19. Dez., 22:00", "19", "Dez", "22", "00"]
            if (parts) {
                const day = parseInt(parts[1], 10);
                const monthStr = parts[2];
                const hour = parseInt(parts[3], 10);
                const minute = parseInt(parts[4], 10);

                let monthIndex = months[monthStr];
                if (monthIndex === undefined) {
                    // Try first 3 chars
                    monthIndex = months[monthStr.substring(0, 3)];
                }

                if (monthIndex !== undefined) {
                    let year = currentYear;
                    // Logic: if month is Jan and we are currently in Dec, it's next year
                    const now = new Date();
                    if (monthIndex < now.getMonth() && (now.getMonth() > 9)) {
                        year += 1;
                    }

                    const d = new Date(year, monthIndex, day, hour, minute);
                    isoDate = d.toISOString();
                }
            }
        } catch (e) {
            console.error('Date parse error Alpenmax:', ev.rawDate, e);
        }

        return {
            ...ev,
            date: isoDate || ev.rawDate // Fallback
        };
    });
};
