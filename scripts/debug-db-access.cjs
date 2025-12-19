const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("🔍 Checking 'events' table...");
    const { data: events, error: eventError } = await supabase
        .from('events')
        .select('*')
        .limit(5);

    if (eventError) {
        console.error("❌ Events Error:", eventError);
    } else {
        console.log(`✅ Found ${events.length} events.`);
        if (events.length > 0) console.log("Sample Event:", events[0]);
    }

    console.log("\n🔍 Checking 'deals' table...");
    const { data: deals, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .limit(5);

    if (dealError) {
        console.error("❌ Deals Error:", dealError);
    } else {
        console.log(`✅ Found ${deals.length} deals.`);
        if (deals.length > 0) console.log("Sample Deal:", deals[0]);
    }
}

checkData();
