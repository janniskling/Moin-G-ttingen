import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';

interface Deal {
    id: string;
    title: string;
    store: string;
    price: string;
    image: string | null;
    isStudentDeal: boolean;
    description?: string;
    link?: string;
}

export default function Deals() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

    useEffect(() => {
        async function fetchDeals() {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error loading deals:", error);
                setLoading(false);
                return;
            }

            if (data) {
                const mappedDeals: Deal[] = data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    store: d.store,
                    price: d.price ? `${d.price} €` : 'N/A', // Restore display format
                    image: d.image_url,
                    isStudentDeal: d.is_student_deal, // snake_case -> camelCase
                    description: d.description,
                    link: d.link
                }));
                setDeals(mappedDeals);
                setLoading(false);
            }
        }

        fetchDeals();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Lade Rewe Angebote...</div>;
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight">Angebote</h1>
                    <span className="text-xs text-muted-foreground mt-1">
                        Nur die wichtigsten Deals für Studenten (Bier, Pesto, Nudeln, Pizza)
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">Göttingen</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {deals.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">
                        Keine Studenten-Deals gefunden (Bier/Pizza).
                    </div>
                ) : (
                    deals.map(deal => (
                        <Card
                            key={deal.id}
                            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setSelectedDeal(deal)}
                        >
                            <CardContent className="p-0">
                                <div className="aspect-square w-full overflow-hidden relative bg-stone-100 flex items-center justify-center p-2 text-7xl">
                                    {/* Render Emoji directly if image string is short (emoji), else img tag */}
                                    {deal.image && deal.image.length < 10 ? (
                                        <span role="img" aria-label={deal.title}>{deal.image}</span>
                                    ) : deal.image ? (
                                        <img src={deal.image} alt={deal.title} className="w-full h-full object-contain" />
                                    ) : (
                                        <span>🛒</span>
                                    )}

                                    <div className="absolute top-2 right-2 z-10">
                                        <Badge variant="destructive" className="shadow-md text-base px-2 py-1 font-extrabold bg-red-600">
                                            {deal.price} €
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-sm leading-tight line-clamp-2 h-10 mb-1">
                                        {deal.title}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            {deal.store}
                                        </span>
                                        {deal.isStudentDeal && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-yellow-100 text-yellow-800">
                                                Studenten-Hit
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Simple Detail Modal/Dialog Overlay */}
            {selectedDeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedDeal(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-stone-100 p-8 flex justify-center text-8xl">
                            {selectedDeal.image && selectedDeal.image.length < 10 ? selectedDeal.image : "🛒"}
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold leading-tight mb-2">{selectedDeal.title}</h2>
                                <p className="text-sm text-muted-foreground">{selectedDeal.description || "Details im Markt prüfen."}</p>
                            </div>

                            <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg">
                                <span className="text-muted-foreground font-medium">Preis:</span>
                                <span className="text-2xl font-black text-red-600">{selectedDeal.price} €</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedDeal(null)}
                                    className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Schließen
                                </button>
                                {selectedDeal.link && (
                                    <a
                                        href={selectedDeal.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        Zum Angebot <ExternalLink size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
