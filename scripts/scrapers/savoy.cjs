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
                        items.push({
                            title: titleEl.innerText.trim(),
                            rawDate: dateEl.innerText.trim(), // Needs parsing later
                            description: "Club Savoy",
                            location: "Club Savoy",
                            imageUrl: img ? img.src : "",
                            link: 'https://www.club-savoy.de/events/',
                            source: "Savoy",
                            tags: ["Party", "Club", ...(badgeEl ? [badgeEl.innerText.trim()] : [])]
                        });
                    }
                } catch (err) {
                    // ignore item error
                }
            });
            return items;
        });
    } catch (e) {
        console.error("Savoy Scrape Error:", e);
        return [];
    }
};
