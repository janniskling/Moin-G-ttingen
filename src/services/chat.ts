import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../entities/types';

export const MESSAGES_PER_PAGE = 15;

export async function getMessages(
    sortBy: 'new' | 'top' = 'new',
    offset = 0,
    limit = MESSAGES_PER_PAGE
): Promise<ChatMessage[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
        .from('chat_messages')
        .select('*')
        .is('parent_id', null)
        .gt('created_at', sevenDaysAgo)
        .range(offset, offset + limit - 1);

    query = sortBy === 'new'
        ? query.order('created_at', { ascending: false })
        : query.order('score', { ascending: false });

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
    return data as ChatMessage[];
}

export async function getReplies(parentId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });
    if (error) return [];
    return data as ChatMessage[];
}

export async function postMessage(content: string, parentId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to post');

    const payload: { user_id: string; content: string; parent_id?: string } = {
        user_id: user.id,
        content: content.slice(0, 250),
    };
    if (parentId) payload.parent_id = parentId;

    const { error } = await supabase.from('chat_messages').insert(payload);
    if (error) throw error;
}

export async function deleteMessage(messageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to delete');

    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);
    if (error) throw error;
}

export async function voteMessage(messageId: string, direction: 1 | -1): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to vote');

    const { error } = await supabase.from('chat_votes').upsert(
        { user_id: user.id, message_id: messageId, vote: direction },
        { onConflict: 'user_id, message_id' }
    );
    if (error) throw error;
}

export async function removeChatVote(messageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to remove vote');

    const { error } = await supabase
        .from('chat_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('message_id', messageId);
    if (error) throw error;
}

export async function getUserChatVotes(): Promise<Record<string, number>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

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
