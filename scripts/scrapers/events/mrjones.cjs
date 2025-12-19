const JONES_URL = 'https://www.mrjones.de';

async function scrapeMrJones(page) {
    // Strategy:
    // 1. Generate confirmed recurring events for the next 30 days.
    // 2. (Optional) Scrape homepage for one-off specials (TODO later if needed).

    const events = [];
    const today = new Date();

    // Loop next 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed, 4=Thu
        const isoDate = d.toISOString().split('T')[0];

        // Wednesday: Aperol Night
        if (dayOfWeek === 3) {
            events.push({
                id: `jones-ap-${isoDate}`,
                location: 'Mr. Jones',
                title: 'Aperol Mittwoch',
                date: isoDate,
                time: '17:00',
                description: 'Aperol Spritz Special Deal (meist ca. 4,50€). Der perfekte Bergfest-Start!',
                category: 'Sonstiges', // Drinks/Food -> Sonstiges (Party/Kultur/Sport/Sonstiges)
                image: '/images/mrjones-logo.png',
                link: JONES_URL
            });
        }

        // Thursday: Wings Night
        if (dayOfWeek === 4) {
            events.push({
                id: `jones-wings-${isoDate}`,
                location: 'Mr. Jones',
                title: 'Wings Thursday',
                date: isoDate,
                time: '18:00',
                description: 'All You Can Eat Chicken Wings! Reservierung empfohlen.',
                category: 'Sonstiges', // Food -> Sonstiges
                image: '/images/chicken-wings.jpg',
                link: JONES_URL
            });
        }
    }

    return events;
}

module.exports = scrapeMrJones;
