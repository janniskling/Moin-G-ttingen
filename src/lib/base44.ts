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
            .upsert(
                {
                    user_id: user.id,
                    place_id: placeId,
                    value: value
                },
                { onConflict: 'user_id, place_id' }
            )
            .select()
            .single();

        if (error) throw error;

        // Recalculate stats
        await this.recalculateStats(placeId);

        return data as Vote;
    }

    async removeVote(placeId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to delete vote");

        const { error } = await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('place_id', placeId);

        if (error) throw error;

        // Recalculate stats
        await this.recalculateStats(placeId);
    }

    private async recalculateStats(placeId: string) {
        // Fetch all votes to calculate authoritative average/count
        const { data: votes } = await supabase
            .from('votes')
            .select('value')
            .eq('place_id', placeId);

        if (!votes) return;

        const count = votes.length;
        const sum = votes.reduce((acc, v) => acc + v.value, 0);
        const average = count > 0 ? sum / count : 0;

        // Update place stats
        await supabase
            .from('places')
            .update({
                ranking_score: average,
                vote_count: count
            })
            .eq('id', placeId);
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

    // --- CHAT ---
    async getMessages(sortBy: 'new' | 'top' = 'new'): Promise<any[]> {
        const query = supabase
            .from('chat_messages')
            .select('*')
            .is('parent_id', null) // Only fetch top-level messages
            .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Max 7 days old

        if (sortBy === 'new') {
            query.order('created_at', { ascending: false });
        } else {
            query.order('score', { ascending: false });
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data;
    }

    async getReplies(parentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching replies:', error);
            return [];
        }
        return data;
    }

    async postMessage(content: string, parentId?: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to post");

        const payload: any = {
            user_id: user.id,
            content: content.slice(0, 250) // Enforce limit
        };

        if (parentId) {
            payload.parent_id = parentId;
        }

        const { error } = await supabase
            .from('chat_messages')
            .insert(payload);

        if (error) throw error;
    }

    async deleteMessage(messageId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to delete");

        const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('id', messageId)
            .eq('user_id', user.id); // Double check ownership safely

        if (error) throw error;
    }

    async voteMessage(messageId: string, direction: 1 | -1): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to vote");

        const { error } = await supabase
            .from('chat_votes')
            .upsert(
                {
                    user_id: user.id,
                    message_id: messageId,
                    vote: direction
                },
                { onConflict: 'user_id, message_id' }
            );

        if (error) throw error;
    }

    async removeChatVote(messageId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to remove vote");

        const { error } = await supabase
            .from('chat_votes')
            .delete()
            .eq('user_id', user.id)
            .eq('message_id', messageId);

        if (error) throw error;
    }

    async getUserChatVotes(): Promise<Record<string, number>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {};

        // Fetch votes for recent messages (optimization: limit by time or just fetch all for now)
        const { data, error } = await supabase
            .from('chat_votes')
            .select('message_id, vote')
            .eq('user_id', user.id);

        if (error || !data) return {};

        return data.reduce((acc, curr) => {
            acc[curr.message_id] = curr.vote;
            return acc;
        }, {} as Record<string, number>);
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
