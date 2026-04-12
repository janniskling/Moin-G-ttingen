
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

// Public client that never attaches a user session — always reads as anon.
// Use this for public data (events, deals) so RLS anon policies always apply,
// regardless of whether the user is logged in.
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
