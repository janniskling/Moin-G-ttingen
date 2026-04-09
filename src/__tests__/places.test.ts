import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    return {
        supabase: {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
            },
            from: vi.fn().mockReturnValue({
                ...mockQuery,
                // allow chaining: supabase.from('votes').select('value').eq('place_id', id)
                select: vi.fn().mockReturnValue({ ...mockQuery, data: [], error: null }),
            }),
        },
    };
});

describe('getMyVotesForPlaces', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns empty object for empty placeIds array', async () => {
        const { getMyVotesForPlaces } = await import('../services/places');
        const result = await getMyVotesForPlaces([]);
        expect(result).toEqual({});
    });

    it('returns empty object when user is not logged in', async () => {
        const { supabase } = await import('../lib/supabase');
        (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { user: null },
        });

        const { getMyVotesForPlaces } = await import('../services/places');
        const result = await getMyVotesForPlaces(['place-1']);
        expect(result).toEqual({});
    });

    it('maps vote data to a place_id → value record', async () => {
        const { supabase } = await import('../lib/supabase');
        const mockIn = vi.fn().mockResolvedValueOnce({
            data: [
                { place_id: 'place-1', value: 4 },
                { place_id: 'place-2', value: 5 },
            ],
            error: null,
        });
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: mockIn,
        });

        const { getMyVotesForPlaces } = await import('../services/places');
        const result = await getMyVotesForPlaces(['place-1', 'place-2']);

        expect(result).toEqual({ 'place-1': 4, 'place-2': 5 });
    });
});
