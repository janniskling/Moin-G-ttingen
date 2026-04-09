import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MESSAGES_PER_PAGE } from '../services/chat';

// Build a fully chainable query mock that resolves as a Promise
function makeQuery(resolvedValue = { data: [], error: null }) {
    const query: Record<string, unknown> = {};
    const chainable = ['select', 'is', 'gt', 'eq', 'in', 'order', 'delete', 'upsert'];
    chainable.forEach(method => {
        query[method] = vi.fn().mockReturnValue(query);
    });
    // range returns the same chainable query so .order() can follow
    query['range'] = vi.fn().mockReturnValue(query);
    // insert and upsert resolve
    query['insert'] = vi.fn().mockResolvedValue({ error: null });
    query['upsert'] = vi.fn().mockResolvedValue({ error: null });
    // Make the query itself awaitable
    query['then'] = (resolve: (v: unknown) => unknown) => Promise.resolve(resolvedValue).then(resolve);
    query['catch'] = (reject: (e: unknown) => unknown) => Promise.resolve(resolvedValue).catch(reject);
    return query;
}

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
        },
        from: vi.fn().mockImplementation(() => makeQuery()),
    },
}));

describe('MESSAGES_PER_PAGE', () => {
    it('is 15', () => {
        expect(MESSAGES_PER_PAGE).toBe(15);
    });
});

describe('getMessages', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an empty array when supabase returns no data', async () => {
        const { getMessages } = await import('../services/chat');
        const result = await getMessages('new', 0, 15);
        expect(Array.isArray(result)).toBe(true);
    });

    it('calls range with correct offset and limit', async () => {
        const { supabase } = await import('../lib/supabase');
        const { getMessages } = await import('../services/chat');

        await getMessages('new', 15, 15);

        const fromResult = (supabase.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
        expect(fromResult?.range).toHaveBeenCalledWith(15, 29);
    });

    it('uses score ordering for "top" sort', async () => {
        const { supabase } = await import('../lib/supabase');
        const { getMessages } = await import('../services/chat');

        await getMessages('top', 0, 15);

        const fromResult = (supabase.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
        expect(fromResult?.order).toHaveBeenCalledWith('score', { ascending: false });
    });
});

describe('postMessage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('truncates content to 250 characters', async () => {
        const { supabase } = await import('../lib/supabase');
        const { postMessage } = await import('../services/chat');

        const longText = 'a'.repeat(300);
        await postMessage(longText);

        const fromResult = (supabase.from as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
        const insertCall = (fromResult?.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(insertCall.content.length).toBe(250);
    });

    it('includes parent_id when provided', async () => {
        const { supabase } = await import('../lib/supabase');
        const { postMessage } = await import('../services/chat');

        await postMessage('Hallo!', 'parent-123');

        const fromResult = (supabase.from as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
        const insertCall = (fromResult?.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(insertCall.parent_id).toBe('parent-123');
    });
});
