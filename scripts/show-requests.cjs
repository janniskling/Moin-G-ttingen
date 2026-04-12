const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
    const { data, error } = await supabase
        .from('place_requests')
        .select('place_name, category, created_at')
        .order('created_at', { ascending: false });

    if (error) { console.error('❌', error.message); process.exit(1); }
    if (!data.length) { console.log('Noch keine Requests eingegangen.'); return; }

    console.log(`\n📋 ${data.length} Place-Request(s):\n`);
    data.forEach((r, i) => {
        const date = new Date(r.created_at).toLocaleString('de-DE');
        const cat = r.category ? ` [${r.category}]` : '';
        console.log(`${i + 1}. "${r.place_name}"${cat}  –  ${date}`);
    });
})();
