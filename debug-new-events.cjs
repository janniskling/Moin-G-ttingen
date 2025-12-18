const puppeteer = require('puppeteer');
const fs = require('fs');

const URLS = {
    'alpenmax': 'https://alpenmax-goettingen.com/events',
    'exil': 'https://exil-web.de/events/list/',
    'musa': 'https://www.musa.de' // Check homepage for links
};

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const [name, url] of Object.entries(URLS)) {
        try {
            console.log(`Navigating to ${name} (${url})...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            const html = await page.content();
            fs.writeFileSync(`debug-${name}.html`, html);
            console.log(`Saved debug-${name}.html`);
        } catch (e) {
            console.error(`Failed to dump ${name}:`, e);
        }
    }

    await browser.close();
}

run();
