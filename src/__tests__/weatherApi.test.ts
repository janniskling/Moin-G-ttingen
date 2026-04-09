import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for Node environment
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

const CACHE_KEY = 'weather_cache';

const mockWeatherResponse = {
    current_weather: { temperature: 12, weathercode: 0, windspeed: 15 },
};

describe('getWeather – caching', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorageMock.clear();
        vi.resetModules(); // ensure a fresh module import each test
    });

    it('fetches from API when no cache exists', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => mockWeatherResponse,
        } as Response);

        const { getWeather } = await import('../services/weatherApi');
        const data = await getWeather();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(data?.temperature).toBe(12);
        expect(data?.condition).toBe('Klar');
        expect(data?.windSpeed).toBe(15);
    });

    it('returns cached data within 30 minutes without fetching', async () => {
        const cached = {
            data: { temperature: 8, condition: 'Regen', windSpeed: 20, icon: '' },
            timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
        };
        localStorageMock.setItem(CACHE_KEY, JSON.stringify(cached));

        const fetchSpy = vi.spyOn(globalThis, 'fetch');

        const { getWeather } = await import('../services/weatherApi');
        const data = await getWeather();

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(data?.temperature).toBe(8);
    });

    it('re-fetches when cache is older than 30 minutes', async () => {
        const stale = {
            data: { temperature: 5, condition: 'Bewölkt', windSpeed: 10, icon: '' },
            timestamp: Date.now() - 35 * 60 * 1000, // 35 minutes ago
        };
        localStorageMock.setItem(CACHE_KEY, JSON.stringify(stale));

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => mockWeatherResponse,
        } as Response);

        const { getWeather } = await import('../services/weatherApi');
        const data = await getWeather();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(data?.temperature).toBe(12);
    });

    it('returns null when API call fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

        const { getWeather } = await import('../services/weatherApi');
        const data = await getWeather();

        expect(data).toBeNull();
    });
});
