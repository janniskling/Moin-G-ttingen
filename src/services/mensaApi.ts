import { format } from 'date-fns';

const API_BASE_URL = 'https://openmensa.org/api/v2';
// const CANTEEN_ID = 179; // Zentralmensa Göttingen

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

    // 1. Try to load from local scraper cache (public/mensa-data.json)
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
        console.log("Local mensa data not found or invalid, falling back to API.");
    }

    // 2. Fallback to OpenMensa API
    try {
        const response = await fetch(`${API_BASE_URL}/canteens/${canteenId}/days/${dateStr}/meals`);
        if (!response.ok) throw new Error('Failed to fetch meals');
        const data = await response.json();

        // Filter out side dishes if needed, or keeping them is fine.
        // User requested "Herausfiltern von Beilagen" (Filtering side dishes).
        // Usually side dishes have category "Beilage" or similar.
        return data.filter((meal: Meal) => !meal.category.toLowerCase().includes('beilage'));
    } catch (error) {
        console.warn("Failed to fetch meals", error);
        return [];
    }
}

export function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return '-';
    return `${price.toFixed(2)} €`;
}
