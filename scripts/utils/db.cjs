const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for now, purely client-side logic really, but for scripts usually service_role key is better if we have it. Assuming we only have anon key available in .env as previously seen.

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase credentials missing!");
    console.error("   VITE_SUPABASE_URL present:", !!supabaseUrl);
    console.error("   VITE_SUPABASE_ANON_KEY present:", !!supabaseKey);
    console.error("   If running in GitHub Actions, ensure 'VITE_SUPABASE_URL' and 'VITE_SUPABASE_ANON_KEY' are set in Repository Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateEventId(event) {
    // specific logic to ensure uniqueness: date + location + title
    const data = `${event.date}-${event.location}-${event.title}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Upserts events into the 'events' table
 * @param {Array} events 
 */
async function upsertEvents(events) {
    console.log(`📡 Uploading ${events.length} events to Supabase...`);

    const preparedEvents = events.map(e => {
        // Map scraper fields to DB columns
        // Scraper: title, date (YYYY-MM-DD), time (HH:MM), location, category, description, image, link, source
        // DB Schema (assumed/proposed): id, title, start_time, location, category, description, image_url, source_url

        let start_time = e.date;
        if (e.time) {
            start_time = `${e.date}T${e.time}:00`;
        } else {
            // Default to noon if no time, or keep as date string? 
            // Better to make it a valid ISO timestamp if column is timestamp
            start_time = `${e.date}T12:00:00`;
        }

        return {
            id: generateEventId(e), // Deterministic ID for upsert
            title: e.title,
            description: e.description,
            start_time: start_time,
            location: e.location,
            category: e.category,
            image_url: e.image,
            source_url: e.link || e.source,
            updated_at: new Date().toISOString()
        };
    });

    const { data, error } = await supabase
        .from('events')
        .upsert(preparedEvents, { onConflict: 'id' });

    if (error) {
        console.error("❌ Supabase Upsert Error:", error);
    } else {
        console.log("✅ Events synced to DB successfully.");
    }
}

function generateDealId(deal) {
    const data = `${deal.store}-${deal.title}-${deal.price}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Upserts deals into the 'deals' table
 * @param {Array} deals 
 */
async function upsertDeals(deals) {
    console.log(`📡 Uploading ${deals.length} deals to Supabase...`);

    // First, clear existing deals to avoid stale data (false positives from previous runs)
    const { data: existingDeals, error: fetchError } = await supabase
        .from('deals')
        .select('id');

    if (existingDeals && existingDeals.length > 0) {
        const idsToDelete = existingDeals.map(d => d.id);
        const { error: deleteError } = await supabase
            .from('deals')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error("❌ Error clearing deals table:", deleteError);
        } else {
            console.log(`🧹 Cleared ${idsToDelete.length} old deals from DB.`);
        }
    }

    const preparedDeals = deals.map(d => ({
        id: generateDealId(d),
        title: d.title,
        store: d.store,
        price: d.price ? d.price.toString().replace(' €', '') : null, // Ensure clean price
        old_price: d.oldPrice || null,
        discount: d.discount || null,
        image_url: d.image || d.emoji || '🛒',
        description: d.description,
        is_student_deal: d.isStudentDeal || false, // Use snake_case for DB
        link: d.link,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('deals')
        .upsert(preparedDeals, { onConflict: 'id' });

    if (error) {
        console.error("❌ Supabase Upsert Deals Error:", error);
    } else {
        console.log("✅ Deals synced to DB successfully.");
    }
}

module.exports = { upsertEvents, upsertDeals };
