import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, MapPin, Music, Beer, Users, Search } from 'lucide-react';
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
    emoji?: string; // Add emoji support
    source?: string;
}

export default function Events() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .gte('start_time', new Date().toISOString()) // Only future events
                    .order('start_time', { ascending: true });

                if (error) {
                    console.error("Error fetching events:", error);
                    return;
                }

                if (data) {
                    const processedEvents: Event[] = data.map((item: any) => {
                        const dateObj = new Date(item.start_time);

                        // Map Category
                        let cat: EventCategory = 'Sonstiges';
                        const c = (item.category || '').toLowerCase();
                        if (c === 'sports' || c === 'sport') cat = 'Sport';
                        else if (c === 'music' || c === 'culture' || c === 'kultur') cat = 'Kultur';
                        else if (c === 'party') cat = 'Party';
                        else if (c === 'food' || c === 'drinks') cat = 'Sonstiges';

                        // Emoji vs Image URL detection
                        let imgUrl = undefined;
                        let emoji = undefined;
                        // DB 'image_url' column stores mixed content (url or emoji)
                        const rawImage = item.image_url;

                        if (rawImage && (rawImage.startsWith('http') || rawImage.startsWith('/'))) {
                            imgUrl = rawImage;
                        } else {
                            emoji = rawImage;
                        }

                        return {
                            id: item.id,
                            title: item.title,
                            date: dateObj,
                            location: item.location,
                            category: cat,
                            description: item.description,
                            imageUrl: imgUrl,
                            emoji: emoji,
                            source: item.location
                        };
                    });

                    setEvents(processedEvents);
                }
            } catch (e) {
                console.error("Failed to load events", e);
            }
        };

        fetchEvents();
    }, []);

    const categories: (EventCategory | 'All')[] = ['All', 'Party', 'Kultur', 'Sport', 'Sonstiges'];

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

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
                        variant={selectedCategory === cat ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className="whitespace-nowrap"
                    >
                        {cat === 'All' ? 'Alle' : cat}
                    </Button>
                ))}
            </div>

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
                                {event.source?.toUpperCase() || "EVENT"}
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
                            <CardDescription className="mt-2 line-clamp-2">
                                {event.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
                {filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Keine Events gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
