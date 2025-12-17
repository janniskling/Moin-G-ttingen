const fs = require('fs');
const puppeteer = require('puppeteer');

const URL = 'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/zentralmensa';
const OUT = 'debug-html.html';

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync(OUT, html);
    console.log('HTML dumped to ' + OUT);
    await browser.close();
}

run();
