import { useEffect, useState } from 'react';
import { base44 } from '../lib/base44';
import { type Place } from '../entities/types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Star, MapPin, ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { StarRating } from '../components/StarRating';

type CategoryView = 'doener' | 'bar' | 'restaurant' | null;

export default function Ranking() {
    const [view, setView] = useState<CategoryView>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});

    // Refresh data logic
    const refreshData = async () => {
        const allPlaces = await base44.places.find();
        setPlaces(allPlaces);

        // Fetch user's votes for all places
        const votes: Record<string, number> = {};
        for (const place of allPlaces) {
            const vote = await base44.getMyVote(place.id);
            if (vote) {
                votes[place.id] = vote.value;
            }
        }
        setUserVotes(votes);
    };

    useEffect(() => {
        base44.auth.login('guest@user.com'); // Auto-login as guest for now
        refreshData();
    }, []);

    const handleRate = async (placeId: string, value: number) => {
        // If user clicks the same rating they already have, maybe we could remove it?
        // For now, simpler: just update.
        await base44.vote(placeId, value);
        await refreshData(); // Refresh to show new averages and user vote
    };

    const getPlacesByCategory = (category: string) => {
        return places
            .filter(p => p.category === category)
            .sort((a, b) => b.ranking_score - a.ranking_score);
    };

    const CategoryCard = ({ title, icon, id, bgClass, textClass }: { title: string, icon: React.ReactNode, id: CategoryView, bgClass: string, textClass: string }) => (
        <Card
            className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary/50"
            onClick={() => setView(id)}
        >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className={cn("p-6 rounded-full transition-colors", bgClass)}>
                    <div className={cn("h-12 w-12 text-4xl flex items-center justify-center", textClass)}>{icon}</div>
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Zur Bestenliste</span>
                    <ChevronRight className="ml-1 h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );

    if (view === null) {
        return (
            <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-2 pt-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">Kategorien</h1>
                    <p className="text-lg text-muted-foreground">
                        Wähle eine Kategorie für das Ranking.
                    </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                    <CategoryCard
                        title="Bester Döner 🥙"
                        icon={<span>🥙</span>}
                        id="doener"
                        bgClass="bg-orange-100 dark:bg-orange-900/20"
                        textClass="text-orange-600 dark:text-orange-400"
                    />
                    <CategoryCard
                        title="Beste Bar 🍺"
                        icon={<span>🍺</span>}
                        id="bar"
                        bgClass="bg-yellow-100 dark:bg-yellow-900/20"
                        textClass="text-yellow-600 dark:text-yellow-400"
                    />
                    <CategoryCard
                        title="Bestes Restaurant 🍽️"
                        icon={<span>🍽️</span>}
                        id="restaurant"
                        bgClass="bg-red-100 dark:bg-red-900/20"
                        textClass="text-red-600 dark:text-red-400"
                    />
                </div>
            </div>
        );
    }

    const currentPlaces = getPlacesByCategory(view);
    const viewTitle = {
        doener: "Bester Döner 🥙",
        bar: "Beste Bar 🍺",
        restaurant: "Bestes Restaurant 🍽️"
    }[view];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center space-x-2 pt-4">
                <Button variant="ghost" size="icon" onClick={() => setView(null)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{viewTitle}</h1>
                </div>
            </div>

            <div className="space-y-6">
                {currentPlaces.map((place, index) => (
                    <Card key={place.id} className="overflow-hidden shadow-md">
                        <div className="relative h-48">
                            <img
                                src={place.image_url}
                                alt={place.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-sm">
                                <span className={cn(
                                    "font-bold text-lg",
                                    index < 3 ? "text-primary" : "text-muted-foreground"
                                )}>
                                    #{index + 1}
                                </span>
                            </div>
                        </div>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-2xl">{place.name}</h3>
                                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {place.address}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center bg-primary/10 px-2 py-1 rounded text-primary font-bold text-lg">
                                        <Star className="h-4 w-4 mr-1 fill-current" />
                                        {place.ranking_score.toFixed(1)}
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {place.vote_count} Bewertungen
                                    </span>
                                </div>
                            </div>

                            <p className="text-muted-foreground line-clamp-2">
                                {place.description}
                            </p>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Deine Bewertung:
                                    </span>
                                    <StarRating
                                        value={userVotes[place.id] || 0}
                                        onChange={(val) => handleRate(place.id, val)}
                                        size="lg"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {currentPlaces.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Keine Einträge in dieser Kategorie.
                    </div>
                )}
            </div>
        </div>
    );
}
