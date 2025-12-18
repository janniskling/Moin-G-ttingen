const cheerio = require('cheerio');
const he = require('he');

module.exports = async function scrapeExil(page) {
    console.log('Scraping Exil...');
    const url = 'https://exil-web.de/events/list/';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);
    const events = [];

    // Prioritize JSON-LD
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
        try {
            const data = JSON.parse(jsonLd);
            // data can be an array or single object
            const list = Array.isArray(data) ? data : [data];

            list.forEach(item => {
                if (item['@type'] === 'Event') {
                    // Clean description: Decode entities, then strip tags
                    let rawDesc = item.description || '';
                    // First decode any entities (e.g. &lt;p&gt; -> <p>, &#8217; -> ’)
                    let decoded = he.decode(rawDesc);

                    // Now strip HTML tags and decode AGAIN just in case (some are double encoded)
                    // But usually stripping tags is enough.
                    // We can use cheerio to get text content if it's HTML
                    // Or simple regex if we trust it's flat.
                    // Let's use regex for tags.
                    let cleanDesc = decoded.replace(/<[^>]*>?/gm, '');

                    // Decode again to be safe (if &amp;lt; existed)
                    cleanDesc = he.decode(cleanDesc);

                    // Normalize whitespace
                    cleanDesc = cleanDesc.replace(/\s+/g, ' ').trim();

                    events.push({
                        title: he.decode(item.name), // Decode title too
                        date: item.startDate, // ISO format
                        description: cleanDesc,
                        location: 'Exil',
                        imageUrl: item.image,
                        link: item.url,
                        source: 'Exil',
                        tags: ['Live', 'Club', 'Konzert']
                    });
                }
            });
        } catch (e) {
            console.error('Error parsing JSON-LD for Exil:', e);
        }
    }

    // Fallback? (Maybe not needed if JSON-LD works well)
    return events;
};
