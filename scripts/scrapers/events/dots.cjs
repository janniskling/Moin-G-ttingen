const DOTS_URL = 'https://tickettune.com/cafebardots/veranstaltungen/';

async function scrapeDots(page) {
    console.log("   Navigating to Dots (TicketTune)...");
    try {
        await page.goto(DOTS_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for product grid
        try {
            await page.waitForSelector('.product--box, .product--info, .listing', { timeout: 5000 });
        } catch (e) {
            console.log("   [Dots] No product grid found. Maybe no events online.");
        }

        const events = await page.evaluate(() => {
            const items = [];

            // TicketTune usually lists events as products
            const products = document.querySelectorAll('.product--box, .product--info');

            products.forEach(p => {
                const text = p.innerText;
                const linkEl = p.querySelector('a.product--title, a.product--image');
                const link = linkEl ? linkEl.href : window.location.href;

                // Extract Date from Title or Description
                // Title often: "Konzert: Bandname - 24.12.2024"
                const dateMatch = text.match(/(\d{2}\.\d{2}\.(\d{2,4})?)/);
                if (!dateMatch) return;

                let dateStr = dateMatch[0];
                const parts = dateStr.split('.');
                let day = parts[0];
                let month = parts[1];
                let year = parts[2];

                if (!year) year = new Date().getFullYear();
                if (year.length === 2) year = "20" + year;

                const isoDate = `${year}-${month}-${day}`;

                // Title cleanup
                let title = p.querySelector('.product--title') ? p.querySelector('.product--title').innerText : text.split('\n')[0];
                title = title.replace(dateStr, '').trim().replace(/[-–]$/, '').trim();

                if (title.length < 3) title = "Dots Event";

                items.push({
                    location: 'Dots',
                    title: `🎵 ${title}`,
                    date: isoDate,
                    time: "20:00", // Default
                    description: text.substring(0, 100).replace(/\n/g, ' '),
                    category: 'Music',
                    image: '🎵',
                    link: link
                });
            });
            return items;
        });

        return events;
    } catch (e) {
        console.error("   [Dots] Error:", e.message);
        return [];
    }
}

module.exports = scrapeDots;
