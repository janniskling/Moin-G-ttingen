export interface WeatherData {
    temperature: number;
    condition: string;
    windSpeed: number;
    icon: string; // url or icon name
}

const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=51.5413&longitude=9.9278&current_weather=true";

export async function getWeather(): Promise<WeatherData | null> {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Weather API failed');
        const data = await response.json();
        const current = data.current_weather;

        return {
            temperature: current.temperature,
            condition: getWeatherCondition(current.weathercode),
            windSpeed: current.windspeed,
            icon: '', // mapped in UI based on condition
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

function getWeatherCondition(code: number): string {
    // Simplified mapping
    if (code === 0) return 'Klar';
    if (code <= 3) return 'Bewölkt';
    if (code <= 48) return 'Nebel';
    if (code <= 67) return 'Regen';
    if (code <= 77) return 'Schnee';
    if (code <= 82) return 'Schauer';
    if (code <= 99) return 'Gewitter';
    return 'Unbekannt';
}
