
import { createClient } from '@supabase/supabase-js';

// Environment variables must be set in .env
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
