/**
 * Base44SDK – thin compatibility wrapper.
 * Logic lives in src/services/places.ts and src/services/chat.ts.
 * Auth is handled by src/context/AuthContext.tsx.
 */
import type { Place, Vote, User, ChatMessage } from '../entities/types';
import { supabase } from './supabase';
import {
    getPlaces,
    getMyVotesForPlaces,
    vote,
    removeVote,
} from '../services/places';
import {
    getMessages,
    getReplies,
    postMessage,
    deleteMessage,
    voteMessage,
    removeChatVote,
    getUserChatVotes,
} from '../services/chat';

export class Base44SDK {
    // --- PLACES ---
    getPlaces(): Promise<Place[]> { return getPlaces(); }

    async getPlaceById(id: string): Promise<Place | null> {
        const { data, error } = await supabase.from('places').select('*').eq('id', id).single();
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
            .maybeSingle();
        if (error) return null;
        return data as Vote;
    }

    getMyVotesForPlaces(placeIds: string[]): Promise<Record<string, number>> {
        return getMyVotesForPlaces(placeIds);
    }

    vote(placeId: string, value: number): Promise<void> { return vote(placeId, value); }
    removeVote(placeId: string): Promise<void> { return removeVote(placeId); }

    // --- AUTH ---
    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return {
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
            role: profile?.role || 'user',
        };
    }

    async loginWithPassword(email: string, password: string): Promise<boolean> {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return true;
    }

    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: email.split('@')[0] } },
        });
        if (error) throw error;
        return data;
    }

    async logout(): Promise<void> {
        await supabase.auth.signOut();
    }

    // --- CHAT ---
    getMessages(sortBy: 'new' | 'top' = 'new', offset = 0, limit = 15): Promise<ChatMessage[]> {
        return getMessages(sortBy, offset, limit);
    }

    getReplies(parentId: string): Promise<ChatMessage[]> { return getReplies(parentId); }
    postMessage(content: string, parentId?: string): Promise<void> { return postMessage(content, parentId); }
    deleteMessage(messageId: string): Promise<void> { return deleteMessage(messageId); }
    voteMessage(messageId: string, direction: 1 | -1): Promise<void> { return voteMessage(messageId, direction); }
    removeChatVote(messageId: string): Promise<void> { return removeChatVote(messageId); }
    getUserChatVotes(): Promise<Record<string, number>> { return getUserChatVotes(); }
}

export const base44 = new Base44SDK();
