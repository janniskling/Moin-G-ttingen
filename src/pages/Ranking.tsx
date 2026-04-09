import { useEffect, useState } from 'react';
import { type Place } from '../entities/types';
import { useAuth } from '../context/AuthContext';
import { getPlaces, vote as votePlace, removeVote, getMyVotesForPlaces } from '../services/places';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AuthForm } from '../components/AuthForm';
import { Star, MapPin, ArrowLeft, ChevronRight, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { StarRating } from '../components/StarRating';

type CategoryView = 'doener' | 'bar' | 'restaurant' | null;

export default function Ranking() {
    const { user, profile, signOut } = useAuth();
    const [view, setView] = useState<CategoryView>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [placesLoading, setPlacesLoading] = useState(true);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [showLogin, setShowLogin] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPlaces = async () => {
        setError(null);
        setPlacesLoading(true);
        try {
            const allPlaces = await getPlaces();
            setPlaces(allPlaces);
            if (user) {
                const votes = await getMyVotesForPlaces(allPlaces.map(p => p.id));
                setUserVotes(votes);
            }
        } catch {
            setError('Fehler beim Laden der Daten. Bitte versuche es erneut.');
        } finally {
            setPlacesLoading(false);
        }
    };

    useEffect(() => {
        loadPlaces();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Logout failed', e);
        }
        setUserVotes({});
    };

    const handleRate = async (placeId: string, value: number) => {
        if (!user) {
            setShowLogin(true);
            return;
        }
        const prevVotes = userVotes;
        setUserVotes(prev => ({ ...prev, [placeId]: value })); // Optimistic update
        try {
            await votePlace(placeId, value);
            await loadPlaces();
        } catch {
            setUserVotes(prevVotes); // Rollback
            setError('Bewertung konnte nicht gespeichert werden.');
        }
    };

    const handleRemoveVote = async (placeId: string) => {
        const prevVotes = userVotes;
        setUserVotes(prev => { const next = { ...prev }; delete next[placeId]; return next; });
        try {
            await removeVote(placeId);
            await loadPlaces();
        } catch {
            setUserVotes(prevVotes);
            setError('Bewertung konnte nicht gelöscht werden.');
        }
    };

    const getPlacesByCategory = (category: string) =>
        places.filter(p => p.category === category).sort((a, b) => b.ranking_score - a.ranking_score);

    const CategoryCard = ({ title, icon, id, bgClass, textClass }: {
        title: string; icon: React.ReactNode; id: CategoryView; bgClass: string; textClass: string;
    }) => (
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

    // Login Modal
    if (showLogin && !user) {
        return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-md animate-in zoom-in-95">
                    <CardHeader>
                        <CardTitle>Abstimmen & Mitmachen</CardTitle>
                        <CardDescription>Logge dich ein, um deine Meinung zu teilen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuthForm onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === null) {
        return (
            <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex justify-between items-start pt-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight">Kategorien</h1>
                        <p className="text-lg text-muted-foreground">Wähle eine Kategorie für das Ranking.</p>
                    </div>
                    <div>
                        {user ? (
                            <Button variant="outline" size="sm" onClick={handleLogout} title="Abmelden">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout ({profile?.email?.split('@')[0] ?? user.email?.split('@')[0]})
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
                                <LogIn className="h-4 w-4 mr-2" />
                                Login
                            </Button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                        <button onClick={loadPlaces} className="ml-auto underline hover:no-underline font-medium">
                            Neu laden
                        </button>
                    </div>
                )}

                <div className="space-y-4 max-w-md mx-auto">
                    <CategoryCard title="Bester Döner 🥙" icon={<span>🥙</span>} id="doener" bgClass="bg-orange-100 dark:bg-orange-900/20" textClass="text-orange-600 dark:text-orange-400" />
                    <CategoryCard title="Beste Bar 🍺" icon={<span>🍺</span>} id="bar" bgClass="bg-yellow-100 dark:bg-yellow-900/20" textClass="text-yellow-600 dark:text-yellow-400" />
                    <CategoryCard title="Bestes Restaurant 🍽️" icon={<span>🍽️</span>} id="restaurant" bgClass="bg-red-100 dark:bg-red-900/20" textClass="text-red-600 dark:text-red-400" />
                </div>
            </div>
        );
    }

    const currentPlaces = getPlacesByCategory(view);
    const viewTitle = { doener: 'Bester Döner 🥙', bar: 'Beste Bar 🍺', restaurant: 'Bestes Restaurant 🍽️' }[view];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setView(null)}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{viewTitle}</h1>
                </div>
                {user ? (
                    <Button variant="ghost" size="sm" onClick={handleLogout} title="Abmelden">
                        <LogOut className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>
                        <LogIn className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {placesLoading && (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            )}

            <div className="space-y-6">
                {!placesLoading && currentPlaces.map((place, index) => (
                    <Card key={place.id} className="overflow-hidden shadow-md">
                        <div className="relative h-48">
                            <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-sm">
                                <span className={cn("font-bold text-lg", index < 3 ? "text-primary" : "text-muted-foreground")}>
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

                            <p className="text-muted-foreground line-clamp-2">{place.description}</p>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {user ? 'Deine Bewertung:' : 'Bewertung:'}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <StarRating
                                            value={userVotes[place.id] || 0}
                                            onChange={(val) => handleRate(place.id, val)}
                                            size="lg"
                                            readonly={false}
                                        />
                                        {!user ? (
                                            <span className="text-xs text-red-500 mt-1 cursor-pointer hover:underline" onClick={() => setShowLogin(true)}>
                                                Du musst dich zuerst einloggen um abstimmen zu können.
                                            </span>
                                        ) : userVotes[place.id] ? (
                                            <span
                                                className="text-xs text-red-500 mt-1 cursor-pointer hover:underline font-medium"
                                                onClick={() => handleRemoveVote(place.id)}
                                            >
                                                Bewertung löschen
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!placesLoading && currentPlaces.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Keine Einträge in dieser Kategorie.
                    </div>
                )}
            </div>
        </div>
    );
}
