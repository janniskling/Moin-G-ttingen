module.exports = function getThannersEvents() {
    console.log("Generating Thanners events...");
    const events = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        if (d.getDay() === 3) { // Wednesday
            // ISO Date for easy sorting
            const isoDate = new Date(d.setHours(20, 0, 0, 0)).toISOString();

            events.push({
                title: "Weizenmittwoch 🍺",
                description: "Der Klassiker: Paulaner Hefeweizen 0,5l für nur 3,20 €!",
                location: "Thanners",
                date: isoDate,
                imageUrl: "/images/beer.jpg", // Local image
                link: "https://www.thanners-goettingen.de/",
                source: "Thanners",
                tags: ["Bar", "Students", "Deal", "Party"]
            });
        }
    }
    return events;
};
