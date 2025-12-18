import { format } from 'date-fns';

export interface Meal {
    id: number;
    name: string;
    category: string;
    prices: {
        students: number;
        employees: number;
        pupils: number;
        others: number;
    };
    notes: string[];
}

export async function getMeals(date: Date = new Date(), canteenId: number = 179): Promise<Meal[]> {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Load from local scraper cache (public/mensa-data.json)
    try {
        const localResponse = await fetch('/mensa-data.json');
        if (localResponse.ok) {
            const allData = await localResponse.json();

            // Structure is { "YYYY-MM-DD": { "179": [...], "180": [...] } }
            if (allData[dateStr] && allData[dateStr][canteenId]) {
                const meals = allData[dateStr][canteenId];
                if (meals && meals.length > 0) {
                    return meals;
                }
            }
        }
    } catch (e) {
        console.error("Failed to load local mensa data:", e);
    }

    return [];
}

export function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || price === 0) return '-';
    return `${price.toFixed(2)} €`;
}
