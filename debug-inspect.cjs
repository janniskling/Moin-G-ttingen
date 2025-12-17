const fs = require('fs');
const puppeteer = require('puppeteer');

const URL = 'https://www.studierendenwerk-goettingen.de/campusgastronomie/mensen/zentralmensa';

async function run() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(URL, { waitUntil: 'networkidle2' });

    console.log("Analyzing page navigation...");

    const navItems = await page.evaluate(() => {
        // Look for typical date selectors
        const potentialDates = [];

        // Strategy 1: Look for "tabs" or lists with day names
        document.querySelectorAll('li, div, span, a').forEach(el => {
            const text = el.innerText?.trim();
            if (text && (
                text.match(/^(Mo|Di|Mi|Do|Fr|Sa|So)\.?\s*\d+/i) || // Mo 18.12.
                text.match(/^\d{2}\.\d{2}\.?$/) || // 18.12.
                ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Heute', 'Morgen'].some(d => text.includes(d))
            )) {
                // Ignore long texts, look for short labels
                if (text.length < 30) {
                    potentialDates.push({
                        text: text,
                        tag: el.tagName,
                        class: el.className,
                        href: el.href || ''
                    });
                }
            }
        });
        return potentialDates;
    });

    console.log("Found potential date elements:", navItems);

    // Also log all H1, H2 to see structure
    const headers = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
            tag: h.tagName,
            text: h.innerText,
            class: h.className
        }));
    });
    console.log("Headers:", headers);

    await browser.close();
}

run();
