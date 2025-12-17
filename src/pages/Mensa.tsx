import { useEffect, useState } from 'react';
import { getMeals, type Meal, formatPrice } from '../services/mensaApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Utensils, AlertCircle } from 'lucide-react';
import { addDays, format, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
// import { cn } from '../lib/utils';

export default function Mensa() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedCanteen, setSelectedCanteen] = useState<number>(179); // 179: Zentralmensa, 180: Nordmensa

    // Skip weekends if today is weekend
    useEffect(() => {
        if (isWeekend(date)) {
            // Simple logic: if Sunday, go to Monday. If Saturday, go to Monday.
            // Actually, let's just let user pick and see empty list or handling it.
        }
    }, []);

    useEffect(() => {
        async function fetchMeals() {
            setLoading(true);
            setError('');
            try {
                const data = await getMeals(date, selectedCanteen);
                setMeals(data);
            } catch (err) {
                setError('Konnte Speiseplan nicht laden.');
            } finally {
                setLoading(false);
            }
        }
        fetchMeals();
    }, [date, selectedCanteen]);

    const handleDateChange = (offset: number) => {
        const newDate = addDays(new Date(), offset);
        setDate(newDate);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Mensa</h1>
                <div className="text-sm text-muted-foreground capitalize">
                    {format(date, 'EEEE, d. MMM', { locale: de })}
                </div>
            </div>

            <div className="flex space-x-2 pb-2">
                <Button
                    variant={selectedCanteen === 179 ? "default" : "outline"}
                    onClick={() => setSelectedCanteen(179)}
                >
                    Zentralmensa
                </Button>
                <Button
                    variant={selectedCanteen === 180 ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedCanteen(180)}
                >
                    Nord
                </Button>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
                <Button
                    variant={date.getDate() === new Date().getDate() ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setDate(new Date())}
                    className={date.getDate() === new Date().getDate() ? "border-primary text-primary" : ""}
                >
                    Heute
                </Button>
                <Button
                    variant={date.getDate() === addDays(new Date(), 1).getDate() ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleDateChange(1)}
                    className={date.getDate() === addDays(new Date(), 1).getDate() ? "border-primary text-primary" : ""}
                >
                    Morgen
                </Button>
            </div>

            {loading && <div className="text-center py-8 text-muted-foreground animate-pulse">Lade Speiseplan...</div>}

            {error && (
                <div className="flex items-center p-4 text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                    <AlertCircle className="flex-shrink-0 w-4 h-4" />
                    <div className="ml-3 text-sm font-medium">{error}</div>
                </div>
            )}

            {!loading && !error && meals.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Utensils className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>Keine Gerichte für diesen Tag gefunden.</p>
                </div>
            )}

            <div className="grid gap-4">
                {meals.map((meal) => (
                    <Card key={meal.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-4">
                                <CardTitle className="text-lg font-bold leading-tight">{meal.name}</CardTitle>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {formatPrice(meal.prices.students)}
                                </span>
                            </div>
                            <CardDescription className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs uppercase tracking-wider opacity-70 border px-1 rounded">{meal.category}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Notes could be shown here as pills */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {meal.notes.map((note, idx) => (
                                    <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{note}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
