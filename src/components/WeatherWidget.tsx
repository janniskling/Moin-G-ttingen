import { useEffect, useState } from 'react';
import { getWeather, type WeatherData } from '../services/weatherApi';
import { CloudSun, Wind, Thermometer, CloudRain, Sun, Cloud, CloudFog, CloudLightning, CloudSnow } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface WeatherWidgetProps {
    className?: string;
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
    const [data, setData] = useState<WeatherData | null>(null);

    useEffect(() => {
        getWeather().then(setData);
    }, []);

    const getWeatherIcon = (condition: string) => {
        const c = condition.toLowerCase();
        if (c.includes('regen') || c.includes('schauer')) return <CloudRain className="h-16 w-16 text-blue-500" />;
        if (c.includes('sonne') || c.includes('klar')) return <Sun className="h-16 w-16 text-yellow-500" />;
        if (c.includes('bewölkt')) return <Cloud className="h-16 w-16 text-gray-500" />;
        if (c.includes('nebel')) return <CloudFog className="h-16 w-16 text-gray-400" />;
        if (c.includes('gewitter')) return <CloudLightning className="h-16 w-16 text-purple-500" />;
        if (c.includes('schnee')) return <CloudSnow className="h-16 w-16 text-blue-200" />;
        return <CloudSun className="h-16 w-16 text-yellow-400" />;
    };

    if (!data) {
        return (
            <div className={cn("flex justify-center p-8", className)}>
                <CloudSun className="h-8 w-8 animate-bounce text-muted-foreground opacity-50" />
            </div>
        );
    }

    return (
        <Card className={cn("bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-800", className)}>
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
                <div className="flex items-center justify-between w-full px-4 mb-4">
                    <h3 className="text-xl font-bold text-primary">Wetter</h3>
                    <div className="text-right">
                        <span className="text-sm text-muted-foreground block">{data.condition}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {getWeatherIcon(data.condition)}
                    <h2 className="text-5xl font-extrabold">{data.temperature}°</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                    <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg backdrop-blur-sm">
                        <Wind className="h-4 w-4 mb-1 text-primary" />
                        <span className="text-xs text-muted-foreground">Wind</span>
                        <span className="font-semibold text-sm">{data.windSpeed} km/h</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg backdrop-blur-sm">
                        <Thermometer className="h-4 w-4 mb-1 text-primary" />
                        <span className="text-xs text-muted-foreground">Gefühlt</span>
                        <span className="font-semibold text-sm">{data.temperature}°</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
