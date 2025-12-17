import { useEffect, useState } from 'react';
import { getWeather, type WeatherData } from '../services/weatherApi';
import { CloudSun, Wind, Thermometer, CloudRain, Sun, Cloud, CloudFog, CloudLightning, CloudSnow } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export default function Weather() {
    const [data, setData] = useState<WeatherData | null>(null);

    useEffect(() => {
        getWeather().then(setData);
    }, []);

    const getWeatherIcon = (condition: string) => {
        const c = condition.toLowerCase();
        if (c.includes('regen') || c.includes('schauer')) return <CloudRain className="h-24 w-24 text-blue-500" />;
        if (c.includes('sonne') || c.includes('klar')) return <Sun className="h-24 w-24 text-yellow-500" />;
        if (c.includes('bewölkt')) return <Cloud className="h-24 w-24 text-gray-500" />;
        if (c.includes('nebel')) return <CloudFog className="h-24 w-24 text-gray-400" />;
        if (c.includes('gewitter')) return <CloudLightning className="h-24 w-24 text-purple-500" />;
        if (c.includes('schnee')) return <CloudSnow className="h-24 w-24 text-blue-200" />;
        return <CloudSun className="h-24 w-24 text-yellow-400" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Wetter</h1>

            {data ? (
                <div className="mt-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-8 pb-8 flex flex-col items-center">
                            {getWeatherIcon(data.condition)}
                            <h2 className="text-5xl font-extrabold mt-6">{data.temperature}°C</h2>
                            <p className="text-xl font-medium text-muted-foreground mt-2">{data.condition}</p>

                            <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-xs">
                                <div className="flex flex-col items-center p-3 bg-background/50 rounded-xl backdrop-blur-sm">
                                    <Wind className="h-6 w-6 mb-2 text-primary" />
                                    <span className="text-sm text-muted-foreground">Wind</span>
                                    <span className="font-bold">{data.windSpeed} km/h</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-background/50 rounded-xl backdrop-blur-sm">
                                    <Thermometer className="h-6 w-6 mb-2 text-primary" />
                                    <span className="text-sm text-muted-foreground">Fühlt sich an wie</span>
                                    <span className="font-bold">{data.temperature}°C</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex justify-center p-12">
                    <CloudSun className="h-12 w-12 animate-bounce text-muted-foreground opacity-50" />
                </div>
            )}
        </div>
    );
}
