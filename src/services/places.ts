import { supabase } from '../lib/supabase';
import type { Place } from '../entities/types';

export async function getPlaces(): Promise<Place[]> {
    const { data, error } = await supabase.from('places').select('*');
    if (error) {
        console.error('Error loading places:', error);
        return [];
    }
    return data as Place[];
}

export async function getMyVotesForPlaces(placeIds: string[]): Promise<Record<string, number>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || placeIds.length === 0) return {};

    const { data, error } = await supabase
        .from('votes')
        .select('place_id, value')
        .eq('user_id', user.id)
        .in('place_id', placeIds);

    if (error || !data) return {};

    return data.reduce((acc, v) => {
        acc[v.place_id] = v.value;
        return acc;
    }, {} as Record<string, number>);
}

export async function vote(placeId: string, value: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to vote');

    const { error } = await supabase
        .from('votes')
        .upsert(
            { user_id: user.id, place_id: placeId, value },
            { onConflict: 'user_id, place_id' }
        );
    if (error) throw error;
    await recalculateStats(placeId);
}

export async function removeVote(placeId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to delete vote');

    const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', placeId);
    if (error) throw error;
    await recalculateStats(placeId);
}

async function recalculateStats(placeId: string) {
    const { data: votes } = await supabase
        .from('votes')
        .select('value')
        .eq('place_id', placeId);
    if (!votes) return;

    const count = votes.length;
    const sum = votes.reduce((acc, v) => acc + v.value, 0);
    await supabase
        .from('places')
        .update({ ranking_score: count > 0 ? sum / count : 0, vote_count: count })
        .eq('id', placeId);
}
