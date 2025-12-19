
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing Supabase Connection...');

    const { data, error } = await supabase
        .from('places')
        .select('*')
        .limit(3);

    if (error) {
        console.error('Error fetching places:', error);
        process.exit(1);
    }

    console.log(`Success! Found ${data.length} places.`);
    data.forEach((place) => {
        console.log(`- ${place.name} (${place.category})`);
    });
}

testConnection();
