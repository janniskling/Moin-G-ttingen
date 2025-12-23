import { useEffect, useState } from 'react';
import { base44 } from '../lib/base44';
import { type Place, type User } from '../entities/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Star, MapPin, ArrowLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { StarRating } from '../components/StarRating';

type CategoryView = 'doener' | 'bar' | 'restaurant' | null;

export default function Ranking() {
    const [view, setView] = useState<CategoryView>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(false);

    // Auth Form Component
    const AuthForm = ({ onClose }: { onClose: () => void }) => {
        const [mode, setMode] = useState<'login' | 'signup'>('login');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
        const [errorMsg, setErrorMsg] = useState('');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setStatus('loading');
            setErrorMsg('');

            try {
                if (mode === 'login') {
                    await base44.loginWithPassword(email, password);
                    // Login successful -> Parent effect will catch user change or we reload
                    window.location.reload();
                } else {
                    const data = await base44.signUp(email, password);

                    // If Email Confirmation is disabled, we get a session immediately.
                    if (data?.session) {
                        window.location.reload();
                    } else {
                        setStatus('success'); // Still need to confirm email
                    }
                }
            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setErrorMsg(err.message || 'Ein Fehler ist aufgetreten.');
            }
        };

        if (status === 'success' && mode === 'signup') {
            return (
                <div className="text-center space-y-4 py-4">
                    <span className="text-4xl">📧</span>
                    <p className="font-medium text-green-600">Bestätigung gesendet!</p>
                    <p className="text-sm text-muted-foreground">
                        Bitte bestätige deine Email ({email}), um dich einzuloggen.
                    </p>
                    <Button onClick={() => setMode('login')} variant="outline" className="w-full">
                        Zum Login
                    </Button>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="text-lg p-5"
                    />
                    <Input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="text-lg p-5"
                        minLength={6}
                    />
                </div>

                {status === 'error' && (
                    <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                        {errorMsg}
                    </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                    <Button type="submit" size="lg" className="w-full text-lg" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Lade...' : (mode === 'login' ? 'Einloggen' : 'Registrieren')}
                    </Button>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {mode === 'login' ? 'Neu hier?' : 'Schon dabei?'}
                        </span>
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto font-semibold"
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setErrorMsg('');
                            }}
                        >
                            {mode === 'login' ? 'Account erstellen' : 'Anmelden'}
                        </Button>
                    </div>

                    <Button type="button" variant="ghost" onClick={onClose}>
                        Abbrechen
                    </Button>
                </div>
            </form>
        );
    };

    // Refresh data logic
    const refreshData = async () => {
        const allPlaces = await base44.getPlaces();

        // Manual Sort: Döner places should be verified first? 
        // Actually find() returns everything. Let's rely on DB or UI sorting.
        setPlaces(allPlaces);

        // Fetch user's votes if logged in
        const user = await base44.getCurrentUser();
        setCurrentUser(user);

        if (user) {
            const votes: Record<string, number> = {};
            for (const place of allPlaces) {
                const vote = await base44.getMyVote(place.id);
                if (vote) {
                    votes[place.id] = vote.value;
                }
            }
            setUserVotes(votes);
        }
    };

    useEffect(() => {
        refreshData();

        // Subscribe to Auth Changes locally if Base44 supported it, 
        // but simple refresh on mount is okay for now.
    }, []);



    const handleLogout = async () => {
        await base44.logout();
        setCurrentUser(null);
        setUserVotes({});
    };

    const handleRate = async (placeId: string, value: number) => {
        if (!currentUser) {
            setShowLogin(true);
            return;
        }

        try {
            await base44.vote(placeId, value);
            // Optimistic Update
            setUserVotes(prev => ({ ...prev, [placeId]: value }));
            // Refresh to get new averages
            refreshData();
        } catch (err) {
            console.error("Voting failed", err);
        }
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

    // LOGIN DIALOG (Email/Password)
    if (showLogin && !currentUser) {
        return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-md animate-in zoom-in-95">
                    <CardHeader>
                        <CardTitle>Abstimmen & Mitmachen</CardTitle>
                        <CardDescription>
                            Logge dich ein, um deine Meinung zu teilen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuthForm onClose={() => setShowLogin(false)} />
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
                        <p className="text-lg text-muted-foreground">
                            Wähle eine Kategorie für das Ranking.
                        </p>
                    </div>
                    <div>
                        {currentUser ? (
                            <Button variant="outline" size="sm" onClick={handleLogout} title="Abmelden">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout ({currentUser.email?.split('@')[0]})
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
                                <LogIn className="h-4 w-4 mr-2" />
                                Login
                            </Button>
                        )}
                    </div>
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
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {currentUser ? 'Deine Bewertung:' : 'Bewertung:'}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <StarRating
                                            value={userVotes[place.id] || 0}
                                            onChange={(val) => handleRate(place.id, val)}
                                            size="lg"
                                            readonly={false}
                                        />
                                        {!currentUser ? (
                                            <span className="text-xs text-red-500 mt-1 cursor-pointer hover:underline" onClick={() => setShowLogin(true)}>
                                                Du musst dich zuerst einloggen um abstimmen zu können.
                                            </span>
                                        ) : userVotes[place.id] ? (
                                            <span
                                                className="text-xs text-red-500 mt-1 cursor-pointer hover:underline font-medium"
                                                onClick={async () => {
                                                    try {
                                                        await base44.removeVote(place.id);
                                                        setUserVotes(prev => {
                                                            const next = { ...prev };
                                                            delete next[place.id];
                                                            return next;
                                                        });
                                                        refreshData();
                                                    } catch (e) {
                                                        console.error("Failed to remove vote", e);
                                                    }
                                                }}
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
                {currentPlaces.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Keine Einträge in dieser Kategorie.
                    </div>
                )}
            </div>
        </div>
    );
}
