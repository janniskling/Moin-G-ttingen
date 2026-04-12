const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

const imageMap = {
    'bar-esprit':    '/images/esprit.jpg',
    'bar-herbarium': '/images/herbarium.png',
    'bar-exil':      '/images/exil.png',
    'bar-dots':      '/images/dots.png',
    'bar-queens':    '/images/queens_head.jpg',
    'bar-dukes':     '/images/dukes.jpg',
    'bar-monroes':   '/images/monros_park.png',
    'bar-nautibar':  '/images/nautibar.jpg',
    'bar-trou':      '/images/trou.png',
    'bar-thanners':  '/images/thanners.png',
    // bar-zak: no image available
};

(async () => {
    for (const [id, image_url] of Object.entries(imageMap)) {
        const { error } = await supabase.from('places').update({ image_url }).eq('id', id);
        if (error) {
            console.error(`❌ ${id}:`, error.message);
        } else {
            console.log(`✅ ${id} → ${image_url}`);
        }
    }
})();
