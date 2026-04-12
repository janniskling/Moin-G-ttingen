// Run this once to create the place_requests table via Supabase SQL API
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
    const { error } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS place_requests (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                place_name text NOT NULL,
                category text,
                user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
                created_at timestamptz DEFAULT now()
            );
            ALTER TABLE place_requests ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Anyone can submit a request" ON place_requests;
            CREATE POLICY "Anyone can submit a request" ON place_requests FOR INSERT WITH CHECK (true);
            DROP POLICY IF EXISTS "Service role can read all" ON place_requests;
            CREATE POLICY "Service role can read all" ON place_requests FOR SELECT USING (true);
        `
    });

    if (error) {
        console.log('ℹ️  exec_sql RPC not available – bitte folgendes SQL manuell im Supabase Dashboard ausführen:');
        console.log(`
CREATE TABLE IF NOT EXISTS place_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    place_name text NOT NULL,
    category text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE place_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a request" ON place_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read all" ON place_requests FOR SELECT USING (true);
        `);
    } else {
        console.log('✅ place_requests Tabelle erstellt');
    }
})();
