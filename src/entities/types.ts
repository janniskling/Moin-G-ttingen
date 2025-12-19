export type BaseEntity = {
    id: string;
    created_date?: string; // ISO string
    updated_date?: string; // ISO string
    created_by?: string; // User ID
};

export type User = BaseEntity & {
    full_name: string;
    email: string;
    role: 'admin' | 'user';
};

export type PlaceCategory = 'restaurant' | 'cafe' | 'nightclub' | 'culture' | 'park' | 'other' | 'doener' | 'bar';

export type Place = BaseEntity & {
    name: string;
    description: string;
    address: string;
    category: PlaceCategory;
    image_url: string;
    ranking_score: number; // calculated score
    vote_count: number;
};

export type Vote = BaseEntity & {
    userId: string;
    placeId: string;
    value: number; // 1-5 stars
    comment?: string;
};
