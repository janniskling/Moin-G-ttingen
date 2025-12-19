const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testDelete() {
    // Find Suppenfleisch
    const { data: deals } = await supabase.from('deals').select('id, title').ilike('title', '%suppenfleisch%');

    if (!deals || deals.length === 0) {
        console.log("Suppenfleisch not found in DB.");
        return;
    }

    const id = deals[0].id;
    console.log(`Attempting to delete Suppenfleisch (ID: ${id})...`);

    const { data, error, count } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)
        .select();

    if (error) {
        console.error("Delete Error:", error);
    } else {
        console.log("Delete Result Data:", data);
        console.log("Delete Count:", count); // Note: count is only present if requested usually, but .select() returns data
        if (data.length === 0) {
            console.log("⚠️ Deletion returned 0 rows! Likely RLS policy preventing delete.");
        } else {
            console.log("✅ Successfully deleted row.");
        }
    }
}

testDelete();
