const KEYWORDS = [
    // Strict Categories
    'bier', 'pils', 'beer', 'alkoholfrei', 'helles', 'weizen', 'sixpack',
    'pesto', 'pizza', 'pasta', 'nudeln', 'spaghetti', 'fusilli', 'penne',
    // Brands
    'nörten', 'hardenberger', 'einbecker', 'göttinger', 'augustiner', 'bayreuther',
    'tegernseer', 'mönchshof', 'chiemseer', 'spaten', 'krombacher', "beck's", 'becks',
    'jever', 'veltins', 'hasseröder', 'warsteiner', 'bitburger', 'radeberger', 'lübzer',
    'paulaner', 'erdinger', 'franziskaner', 'schöfferhofer', 'oettinger', 'astra',
    'sternburg', 'paderborner', 'corona', 'desperados', 'barilla', 'wagner', 'gustavo gusto'
];

const BLACKLIST = [
    'weißbrot', 'brot', 'brötchen', 'baguette', 'aufstrich', 'ticket', 'gutschein',
    'butter', 'kerrygold', 'käse', 'heidelbeere', 'erdbeere', 'beere', 'gemüse', 'obst',
    'sortiment', 'günstig', 'billig', 'pizzatasche', 'gültig vom'
];

const EMOJI_MAP = {
    'bier': '🍺', 'pils': '🍺', 'beer': '🍺', 'corona': '🍺', 'desperados': '🍺', 'einbecker': '🍺',
    'pizza': '🍕', 'wagner': '🍕', 'gustavo': '🍕',
    'pesto': '🍝', 'pasta': '🍝', 'nudeln': '🍝', 'spaghetti': '🍝', 'barilla': '🍝',
    'cola': '🥤', 'fanta': '🥤', 'sprite': '🥤'
};

const FOOD_KEYWORDS = ['pesto', 'pizza', 'pasta', 'nudeln', 'spaghetti'];

function getEmoji(title) {
    const t = title.toLowerCase();

    if (t.includes('brot') || t.includes('butter') || t.includes('beere')) return '🍞'; // Should be filtered

    if (t.includes('pizza') || t.includes('wagner') || t.includes('flammkuchen')) return '🍕';
    if (t.includes('pesto') || t.includes('pasta') || t.includes('nudeln') || t.includes('barilla')) return '🍝';
    if (t.includes('cola') || t.includes('fanta') || t.includes('sprite')) return '🥤';

    return '🍺';
}

function cleanTitle(title) {
    if (!title) return "";
    let clean = title.replace(/knüller/gi, '')
        .replace(/aktion/gi, '')
        .replace(/top-preis/gi, '')
        .replace(/wochenend-knüller/gi, '')
        .replace(/mehr kaufen/gi, '')
        .replace(/mehr sparen/gi, '');

    clean = clean.replace(/\s+/g, ' ').trim();

    // Reject titles that are just numbers or very short
    if (clean.length < 3 || clean.match(/^[\d,.]+€?$/)) {
        return "";
    }

    // Reject titles that have no letters (e.g. ". .")
    if (!clean.match(/[a-zA-Z]/)) return "";

    return clean;
}

function processBarilla(title, text) {
    let newTitle = title;
    let newDesc = "";
    let forcePrice = null;

    const lowerText = text.toLowerCase();

    // Pesto Bundle Logic
    if (lowerText.includes('pesto') && (lowerText.includes('3 stück') || lowerText.includes('3 für') || text.includes('5,00'))) {
        newTitle = "Barilla Pesto";
        newDesc = "Kaufe 3 für 5€";
        forcePrice = "1,67";
    }
    // Pasta Rename Logic
    else if (!lowerText.includes('pesto') && (lowerText.includes('barilla') || lowerText.includes('nudeln'))) {
        if (newTitle.trim() === 'BARILLA' || newTitle.trim() === 'Barilla') {
            newTitle = "Barilla Classic Nudeln";
        }
    }

    return { title: newTitle, description: newDesc, price: forcePrice };
}

function parsePrice(text, title, forcedVal = null) {
    if (forcedVal) {
        return { price: forcedVal, oldPrice: null, discount: null };
    }

    // 1. Clean text of base prices to prevent false positives
    const cleanText = text.replace(/\(1\s*[lkg]+\s*=.*?\)/gi, '')
        .replace(/1\s*[lkg]+\s*=\s*[\d,.-]+/gi, '');

    // Finds potential prices
    const priceMatches = cleanText.matchAll(/(\d{1,2})[,\.](\d{2,})/g);
    const prices = [];

    for (const m of priceMatches) {
        const val = parseFloat(m[0].replace(',', '.'));
        // Sanity Check: 0.80 - 30.00
        if (val > 0.80 && val < 40.00) {
            prices.push({
                str: m[0].replace('.', ','),
                val: val
            });
        }
    }

    if (prices.length === 0) return null;

    // Smart Selection:
    const t = title.toLowerCase();
    const isCrate = (t.includes('kasten') || text.match(/2[04]\s*x/));

    // Heuristic:
    // With "Strike through" prices, we usually have TWO prices in the text.
    // Low = Deal. High = Old.
    // Filter by context (Crate vs Single)

    let validCandidates = [];
    if (isCrate) {
        // Crates > 8.00
        validCandidates = prices.filter(p => p.val > 8.00);
    } else {
        // Single Items > 0.60
        validCandidates = prices.filter(p => p.val > 0.60);
    }

    if (validCandidates.length === 0) {
        // Fallback to all if strict filter killed everything
        validCandidates = prices;
    }

    // Sort by value
    validCandidates.sort((a, b) => a.val - b.val);

    // Best Price (Deal) is likely the LOWEST valid candidate
    // Old Price is likely the HIGHEST valid candidate (if significantly higher)

    const dealPrice = validCandidates[0];
    let oldPrice = null;
    let discount = null;

    if (validCandidates.length > 1) {
        const potentialOld = validCandidates[validCandidates.length - 1];
        // Only accept if old is at least 10% higher than deal (avoid minor variety diffs like 1.49 vs 1.59)
        if (potentialOld.val > dealPrice.val * 1.10) {
            oldPrice = potentialOld;
            discount = Math.round(((oldPrice.val - dealPrice.val) / oldPrice.val) * 100) + "%";
        }
    }

    return {
        price: dealPrice.str,
        oldPrice: oldPrice ? oldPrice.str : null,
        discount: discount
    };
}

function getDescription(text) {
    let description = "";
    const descRegex = /(\d+\s*x\s*[\d,]+\s*-?l)|(\d+[,\.]\d+\s*l)|(\d+\s*Flasche)|(Sixpack)|(Kasten)|(Packung)|(\d+er Träger)/i;

    const lines = text.split('\n');
    for (const line of lines) {
        if (descRegex.test(line) || line.includes('zzgl. Pfand')) {
            description = line.trim();
            break;
        }
    }

    if (!description) {
        const basePriceLine = lines.find(l => l.includes('1 l =') || l.includes('1 kg ='));
        if (basePriceLine) description = basePriceLine.trim();
    }

    return description || "";
}

module.exports = { KEYWORDS, BLACKLIST, getEmoji, parsePrice, getDescription, cleanTitle, processBarilla };
