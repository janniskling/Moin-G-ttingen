const fs = require('fs');
const puppeteer = require('puppeteer');

const URLs = [
    'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/zentralmensa',
    'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/mensa-am-nordcampus',
    'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/mensa-am-turm',
    'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/cgin' // Alternative for Nord
];

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    console.log("Checking URLs...");

    for (const url of URLs) {
        const page = await browser.newPage();
        try {
            const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const title = await page.title();
            const status = resp.status();
            console.log(`[${status}] ${url} -> ${title}`);
        } catch (e) {
            console.log(`[FAILED] ${url} -> ${e.message}`);
        }
        await page.close();
    }
    await browser.close();
}

run();
