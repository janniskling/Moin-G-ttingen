import { useState } from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, MapPin, Music, Beer, Users, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type EventCategory = 'Party' | 'Kultur' | 'Sport' | 'Sonstiges';

interface Event {
    id: string;
    title: string;
    date: Date;
    location: string;
    category: EventCategory;
    description: string;
    imageUrl?: string;
}

const MOCK_EVENTS: Event[] = [
    {
        id: '1',
        title: 'Semester Opening Party',
        date: new Date(new Date().setHours(22, 0)),
        location: 'Savoy Club',
        category: 'Party',
        description: 'Die größte Party zum Semesterstart!',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: '2',
        title: 'ThOP Theater Premiere',
        date: new Date(new Date().setDate(new Date().getDate() + 2)),
        location: 'Theater im OP',
        category: 'Kultur',
        description: 'Eine spannende Inszenierung im Unithater.',
        imageUrl: 'https://images.unsplash.com/photo-1503095392237-fa4221e358c9?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: '3',
        title: 'Karaoke Night',
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        location: 'Irish Pub',
        category: 'Party',
        description: 'Sing deine Lieblingssongs!',
    },
    {
        id: '4',
        title: 'Uni-Liga Fußball',
        date: new Date(new Date().setDate(new Date().getDate() + 3)),
        location: 'Unisportzentrum',
        category: 'Sport',
        description: 'Spannende Matches am Nachmittag.',
    }
];

export default function Events() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');

    const categories: (EventCategory | 'All')[] = ['All', 'Party', 'Kultur', 'Sport', 'Sonstiges'];

    const filteredEvents = MOCK_EVENTS.filter(event => {
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
                        {event.imageUrl && (
                            <div className="h-32 w-full overflow-hidden relative">
                                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <span className="absolute bottom-2 left-2 text-white text-xs font-bold px-2 py-1 bg-primary/80 rounded backdrop-blur-md">
                                    {format(event.date, 'dd. MMM • HH:mm', { locale: de })}
                                </span>
                            </div>
                        )}
                        <CardContent className={cn("p-4", event.imageUrl ? "pt-4" : "")}>
                            {!event.imageUrl && (
                                <div className="text-sm font-semibold text-primary mb-1">
                                    {format(event.date, 'dd. MMM • HH:mm', { locale: de })}
                                </div>
                            )}
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
