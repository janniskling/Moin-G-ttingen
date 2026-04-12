const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

const restaurants = [
    {
        id: 'rest-intuu',
        name: 'INTUU',
        address: 'Berliner Straße 30, 37073 Göttingen',
        description: 'Japanese & South American Nikkei Fusion – Sushi, Josper-Grill-Spezialitäten und Omakase-Erlebnisse im FREIgeist Hotel.',
        image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-fellini',
        name: 'Ristorante Fellini',
        address: 'Groner-Tor-Straße 28, 37073 Göttingen',
        description: 'Familienbetrieb seit 2002 – authentische Pizza und Pasta nach traditionellen italienischen Rezepten.',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-gaudi',
        name: 'Restaurant Gaudí',
        address: 'Rote Straße 16, 37073 Göttingen',
        description: 'Spanisch-mediterranes Restaurant mit Tapas-Bar, gegrilltem Tintenfisch und Terrasse im Börner-Viertel.',
        image_url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-kartoffelhaus',
        name: 'Kartoffelhaus',
        address: 'Goethe-Allee 8, 37073 Göttingen',
        description: 'Traditionelle deutsche Küche in einem Gebäude von 1739 – Schnitzel, Kartoffelgerichte und herzhafte Portionen.',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-maharadscha',
        name: 'Maharadscha',
        address: 'Gartenstraße 25, 37073 Göttingen',
        description: 'Authentische nordindische Küche mit großen Portionen, aromatischen Currys und vielen vegetarischen Optionen.',
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-szueltenburger',
        name: 'Zum Szültenbürger',
        address: 'Prinzenstraße 7, 37073 Göttingen',
        description: 'Rustikales Fachwerkhaus mit beeindruckenden Schnitzeln und Grillspezialitäten – ein Göttingen-Klassiker.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-gamie',
        name: 'GÄMIE',
        address: 'Weender Straße 29, 37073 Göttingen',
        description: 'Asiatische Fusion aus Japan, Vietnam, Thailand und China – Sushi, Udon, Gyoza, Pho und Bao Buns.',
        image_url: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-abessina',
        name: 'Abessina',
        address: 'Ritterplan 2, 37073 Göttingen',
        description: 'Authentische äthiopisch-eritreische Küche mit traditionellen Gewürzen und Injera-Brot seit 2013.',
        image_url: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-rice',
        name: 'Rice Restaurant',
        address: 'Weender Straße 35, 37073 Göttingen',
        description: 'Vietnamesisch-japanische Küche in der Fußgängerzone – Pho, Sushi und asiatische Fusion täglich frisch.',
        image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
    {
        id: 'rest-eastofitaly',
        name: 'East of Italy',
        address: 'Weender Landstraße 100, 37075 Göttingen',
        description: 'Neapolitanische Pizza aus dem Holzofen und mediterrane Mezze-Platten im FREIgeist Nordstadt Hotel.',
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
        category: 'restaurant',
        ranking_score: 0,
        vote_count: 0,
    },
];

(async () => {
    // Delete old entries
    const { error: delError } = await supabase.from('places').delete().in('id', ['rest-1', 'rest-2']);
    if (delError) console.error('❌ Delete error:', delError.message);
    else console.log('🗑️  Alte Restaurants (rest-1, rest-2) gelöscht');

    // Insert new restaurants
    const { error: insError } = await supabase.from('places').upsert(restaurants, { onConflict: 'id' });
    if (insError) {
        console.error('❌ Insert error:', insError.message);
    } else {
        console.log(`✅ ${restaurants.length} Restaurants eingefügt:`);
        restaurants.forEach(r => console.log(`   • ${r.name} – ${r.address}`));
    }
})();
