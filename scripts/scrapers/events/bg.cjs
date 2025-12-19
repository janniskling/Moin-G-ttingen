const BG_URL = 'https://www.bggoettingen.de/spielplan/';

async function scrapeBG(page) {
    console.log("   Navigating to BG Göttingen...");
    try {
        await page.goto(BG_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for potential content
        try {
            await page.waitForSelector('.match-row, table, .schedule', { timeout: 5000 });
        } catch (e) { }

        const events = await page.evaluate(() => {
            const items = [];
            // Strategy: Look for "Tickets" links which indicate upcoming games.
            // In the markdown structure we saw: "#### -:-\n[Tickets]..."
            // In DOM, this is likely a container with a ticket link.

            // Find all anchor tags with "Tickets" text
            const ticketLinks = Array.from(document.querySelectorAll('a')).filter(a => a.innerText.includes('Tickets'));

            ticketLinks.forEach(link => {
                // Traverse up to find the match container (row or div)
                // Heuristic: Go up 2-3 levels
                let container = link.parentElement;
                let foundMatch = false;
                let text = "";

                for (let i = 0; i < 4; i++) {
                    if (!container) break;
                    if (container.innerText.includes('vs.') || container.innerText.includes(' - ')) {
                        text = container.innerText;
                        foundMatch = true;
                        break;
                    }
                    container = container.parentElement;
                }

                if (!foundMatch && container) text = container.innerText; // Fallback

                // Parse Details
                // Text usually: "01.01.2024 \n BG Göttingen vs ... \n 20:00 Uhr"

                const dateMatch = text.match(/(\d{2}\.\d{2}\.?(\d{4})?)/);
                if (!dateMatch) return;

                const timeMatch = text.match(/(\d{2}:\d{2})\s*Uhr?/);
                const time = timeMatch ? timeMatch[1] : "20:00";

                // Normalize Date
                let dateStr = dateMatch[1];
                const parts = dateStr.split('.');
                const day = parts[0];
                const month = parts[1];
                let year = parts[2] || new Date().getFullYear();

                if (month < new Date().getMonth() + 1 && !parts[2]) {
                    year = new Date().getFullYear() + 1;
                }
                const isoDate = `${year}-${month}-${day}`;

                // 14-Day Limit Check
                const eventDate = new Date(isoDate);
                const limitDate = new Date();
                limitDate.setDate(limitDate.getDate() + 14);

                if (eventDate > limitDate) return;

                // Title and Opponent
                const simpleTitle = "Heimspiel";
                let opponent = text.replace(/BG Göttingen|Göttingen|\d{2}\.\d{2}\.?|Uhr|\d{2}:\d{2}|Tickets/gi, '').trim();
                opponent = opponent.split('\n')[0].replace(/[-:]/g, '').trim();

                // Deduplicate check
                if (items.some(e => e.date === isoDate)) return;

                items.push({
                    location: 'Sparkassen-Arena',
                    title: `🏀 ${simpleTitle}`,
                    date: isoDate,
                    time: time,
                    description: `BBL Heimspiel gegen ${opponent}. Jetzt Tickets sichern!`,
                    category: 'Sports',
                    image: '/images/bg-logo.png',
                    link: link.href || 'https://www.bggoettingen.de/spielplan/'
                });
            });

            return items;
        });

        return events;

    } catch (e) {
        console.error("   [BG] Error:", e.message);
        return [];
    }
}

module.exports = scrapeBG;
