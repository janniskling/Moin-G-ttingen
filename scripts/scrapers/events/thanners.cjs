const THANNERS_URL = 'http://www.thanners-goettingen.de';

module.exports = async function scrapeThanners(page) {
    // Recurring Event: Weizenmittwoch
    // Every Wednesday

    const events = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        if (d.getDay() === 3) { // Wednesday
            const isoDate = d.toISOString().split('T')[0];
            events.push({
                location: 'Thanners',
                title: 'Weizenmittwoch',
                date: isoDate,
                time: '18:00',
                description: 'Weizen-Tag: Paulaner Hefeweizen (0,5l) für nur 3,20€!',
                category: 'Sonstiges', // Drinks -> Sonstiges
                image: '/images/wheat-beer.jpg',
                link: THANNERS_URL,
                source: 'Thanners'
            });
        }
    }

    return events;
};
