import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, MapPin, Music, Beer, Users, Search, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

type EventCategory = 'Party' | 'Kultur' | 'Sport' | 'Sonstiges';

interface Event {
    id: string;
    title: string;
    date: Date;
    location: string;
    category: EventCategory;
    description: string;
    imageUrl?: string;
    emoji?: string;
    source?: string;
}

const EVENTS_PER_PAGE = 10;

function mapCategory(raw: string): EventCategory {
    const c = raw.toLowerCase();
    if (c === 'sports' || c === 'sport') return 'Sport';
    if (c === 'music' || c === 'culture' || c === 'kultur') return 'Kultur';
    if (c === 'party') return 'Party';
    return 'Sonstiges';
}

function mapEvent(item: Record<string, string>): Event {
    const rawImage = item.image_url;
    const isUrl = rawImage && (rawImage.startsWith('http') || rawImage.startsWith('/'));
    return {
        id: item.id,
        title: item.title,
        date: new Date(item.start_time),
        location: item.location,
        category: mapCategory(item.category || ''),
        description: item.description,
        imageUrl: isUrl ? rawImage : undefined,
        emoji: isUrl ? undefined : rawImage,
        source: item.location,
    };
}

export default function Events() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const fetchEvents = async (reset = false) => {
        const currentOffset = reset ? 0 : offset;
        if (reset) { setLoading(true); setError(null); }
        else setLoadingMore(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .range(currentOffset, currentOffset + EVENTS_PER_PAGE - 1);

            if (fetchError) throw fetchError;

            const processed = (data ?? []).map(item => mapEvent(item as Record<string, string>));
            setEvents(prev => reset ? processed : [...prev, ...processed]);
            setHasMore(processed.length === EVENTS_PER_PAGE);
            setOffset(currentOffset + processed.length);
        } catch {
            setError('Events konnten nicht geladen werden. Bitte versuche es erneut.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchEvents(true);
    }, []);

    const categories: (EventCategory | 'All')[] = ['All', 'Party', 'Kultur', 'Sport', 'Sonstiges'];

    const filteredEvents = events.filter(event => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category: EventCategory) => {
        switch (category) {
            case 'Party': return <Beer className="h-4 w-4" />;
            case 'Kultur': return <Music className="h-4 w-4" />;
            case 'Sport': return <Users className="h-4 w-4" />;
            default: return <Calendar className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Events</h1>
                <p className="text-muted-foreground">Entdecke was in Göttingen los ist.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Suche nach Events..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className="whitespace-nowrap"
                    >
                        {cat === 'All' ? 'Alle' : cat}
                    </Button>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => fetchEvents(true)} className="ml-auto underline hover:no-underline font-medium">
                        Neu laden
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            )}

            {/* Event List */}
            {!loading && (
                <div className="grid gap-4">
                    {filteredEvents.map(event => (
                        <Card key={event.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                            <div className="h-32 w-full overflow-hidden relative bg-muted/30 flex items-center justify-center">
                                {event.imageUrl ? (
                                    <>
                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </>
                                ) : (
                                    <span className="text-6xl animate-in zoom-in duration-300">{event.emoji || '📅'}</span>
                                )}
                                <span className={cn(
                                    "absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10",
                                    event.imageUrl ? "bg-black/50 backdrop-blur-md" : "bg-primary/90"
                                )}>
                                    {event.source?.toUpperCase() || 'EVENT'}
                                </span>
                                <span className="absolute bottom-2 left-2 text-white text-xs font-bold px-2 py-1 bg-black/60 rounded backdrop-blur-md z-10">
                                    {format(event.date, 'dd. MMM • HH:mm', { locale: de })} Uhr
                                </span>
                            </div>
                            <CardContent className="p-4 pt-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{event.title}</CardTitle>
                                        <div className="flex items-center text-muted-foreground text-sm mt-1">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {event.location}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-secondary rounded-full">
                                        {getCategoryIcon(event.category)}
                                    </div>
                                </div>
                                <CardDescription className="mt-2 line-clamp-2">{event.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredEvents.length === 0 && !error && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Keine Events gefunden.</p>
                        </div>
                    )}

                    {/* Load More – only shown when no active filter (filter is client-side) */}
                    {hasMore && !searchTerm && selectedCategory === 'All' && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => fetchEvents(false)}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Lade...' : 'Mehr laden'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
