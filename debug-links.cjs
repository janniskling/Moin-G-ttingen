const fs = require('fs');
const puppeteer = require('puppeteer');

const URL = 'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/zentralmensa';

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    // Extract all links that contain "mensa" or "cafeteria"
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .map(a => ({ text: a.innerText, href: a.href }))
            .filter(l => l.href.includes('mensen') || l.href.includes('mensa'));
    });

    console.log("Found links:", links);
    await browser.close();
}

run();
