import { supabase } from './supabase';
import type { Place, Vote, User } from '../entities/types';

// Migration: Using Real Supabase Backend instead of LocalStorage
// Legacy "storage key" prefix is no longer needed but kept for cleanup reference.

export class Base44SDK {
    // --- PLACES ---
    async getPlaces(): Promise<Place[]> {
        const { data, error } = await supabase
            .from('places')
            .select('*');

        if (error) {
            console.error('Error loading places:', error);
            return [];
        }
        return data as Place[];
    }

    async getPlaceById(id: string): Promise<Place | null> {
        const { data, error } = await supabase
            .from('places')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as Place;
    }

    // --- VOTING ---
    async getMyVote(placeId: string): Promise<Vote | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('votes')
            .select('*')
            .eq('user_id', user.id)
            .eq('place_id', placeId)
            .maybeSingle(); // Use maybeSingle to avoid 406 on no rows

        if (error) return null;
        return data as Vote;
    }

    async vote(placeId: string, value: number): Promise<Vote> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to vote");

        // Upsert Vote
        const { data, error } = await supabase
            .from('votes')
            .upsert({
                user_id: user.id,
                place_id: placeId,
                value: value
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger generic "update score" logic on client side 
        // (In a real app, this would be a DB function/trigger or Edge Function)
        // For simplicity, we just return the vote and let the UI optimistically update or re-fetch.

        return data as Vote;
    }

    // --- AUTH ---
    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
            role: profile?.role || 'user'
        };
    }

    async login(email: string) {
        // Fallback: Magic Link
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        return true;
    }

    async loginWithPassword(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return true;
    }

    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: email.split('@')[0] }
            }
        });
        if (error) throw error;
        return data;
    }

    async logout() {
        await supabase.auth.signOut();
        window.location.reload(); // Force refresh to clear state
    }
}

export const base44 = new Base44SDK();
