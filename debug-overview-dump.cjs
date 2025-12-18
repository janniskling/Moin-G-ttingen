const puppeteer = require('puppeteer');
const fs = require('fs');

const OVERVIEW_URL = 'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/speiseplaene-der-mensen';

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();

    console.log(`Navigating to ${OVERVIEW_URL}...`);
    await page.goto(OVERVIEW_URL, { waitUntil: 'networkidle0', timeout: 60000 });

    const html = await page.content();
    fs.writeFileSync('debug-overview-full.html', html);
    console.log("Saved debug-overview-full.html");

    await browser.close();
}

run();
