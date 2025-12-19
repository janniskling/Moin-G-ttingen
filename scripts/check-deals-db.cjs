const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDeals() {
    const { data, error } = await supabase.from('deals').select('*');
    if (error) {
        console.error("Error fetching deals:", error);
        return;
    }
    console.log(`Found ${data.length} deals in DB:`);
    data.forEach((d, i) => {
        console.log(`${i + 1}. [${d.store}] ${d.title} (${d.price}€)`);
    });
}

checkDeals();
