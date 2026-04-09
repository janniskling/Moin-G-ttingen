export interface WeatherData {
    temperature: number;
    condition: string;
    windSpeed: number;
    icon: string;
}

const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=51.5413&longitude=9.9278&current_weather=true';
const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getWeatherCondition(code: number): string {
    if (code === 0) return 'Klar';
    if (code <= 3) return 'Bewölkt';
    if (code <= 48) return 'Nebel';
    if (code <= 67) return 'Regen';
    if (code <= 77) return 'Schnee';
    if (code <= 82) return 'Schauer';
    if (code <= 99) return 'Gewitter';
    return 'Unbekannt';
}

export async function getWeather(): Promise<WeatherData | null> {
    // Return cached data if still fresh
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached) as { data: WeatherData; timestamp: number };
            if (Date.now() - timestamp < CACHE_DURATION) return data;
        }
    } catch {
        // Ignore corrupt cache
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Weather API failed');
        const json = await response.json();
        const current = json.current_weather;

        const weatherData: WeatherData = {
            temperature: current.temperature,
            condition: getWeatherCondition(current.weathercode),
            windSpeed: current.windspeed,
            icon: '',
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: weatherData, timestamp: Date.now() }));
        return weatherData;
    } catch (e) {
        console.error(e);
        return null;
    }
}
