import type { Place, Vote, User, BaseEntity } from '../entities/types';

const STORAGE_KEY_PREFIX = 'base44_v7_';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();

// Generic CRUD Mock
class EntityCollection<T extends BaseEntity> {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    private load(): T[] {
        const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${this.name}`);
        return data ? JSON.parse(data) : [];
    }

    private save(data: T[]) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${this.name}`, JSON.stringify(data));
    }

    async find(predicate?: (item: T) => boolean): Promise<T[]> {
        const data = this.load();
        return predicate ? data.filter(predicate) : data;
    }

    async findOne(predicate: (item: T) => boolean): Promise<T | null> {
        const data = this.load();
        return data.find(predicate) || null;
    }

    async getById(id: string): Promise<T | null> {
        return this.findOne(item => item.id === id);
    }

    async create(data: Omit<T, keyof BaseEntity> & Partial<BaseEntity>): Promise<T> {
        const items = this.load();
        const newItem = {
            ...data,
            id: data.id || generateId(),
            created_date: now(),
            updated_date: now(),
        } as T;

        items.push(newItem);
        this.save(items);
        return newItem;
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        const items = this.load();
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;

        const updatedItem = {
            ...items[index],
            ...data,
            updated_date: now(),
        };

        items[index] = updatedItem;
        this.save(items);
        return updatedItem;
    }
}

// Auth Mock
class Auth {
    private currentUser: User | null = null;
    private users: EntityCollection<User>;

    constructor(usersCollection: EntityCollection<User>) {
        this.users = usersCollection;
        // Simple persistence for "logged in" state
        const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    async login(email: string): Promise<User> {
        // Mock login: just find user by email or create if not exists (for simplicity)
        let user = await this.users.findOne(u => u.email === email);
        if (!user) {
            user = await this.users.create({
                full_name: email.split('@')[0],
                email,
                role: 'user'
            } as any);
        }
        this.currentUser = user;
        localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(user));
        return user;
    }

    async logout() {
        this.currentUser = null;
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    }

    me(): User | null {
        return this.currentUser;
    }
}

// Initial Data Seeding
const seedData = () => {
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}places`)) {
        const places: EntityCollection<Place> = new EntityCollection('places');

        // --- DÖNER 🥙 ---
        const doenerPlaces = [
            { id: "doener-1", name: "Crunchy-Kebab-Vegan", address: "Goethe-Allee 16", ranking_score: 0, description: "Sehr beliebt, bietet auch vegane Optionen.", image_url: "https://images.unsplash.com/photo-1619535860434-7f086338528e?q=80&w=600&auto=format&fit=crop" }, // Meat skewer
            { id: "doener-2", name: "Afghan Kebab House", address: "Groner Str. 41", ranking_score: 0, description: "Leckerer Döner und afghanische Spezialitäten.", image_url: "https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=600&auto=format&fit=crop" }, // Food styling kebab
            { id: "doener-3", name: "Döner Haus", address: "Theodor-Heuss-Straße 66", ranking_score: 0, description: "Große Portionen und frische Zutaten.", image_url: "https://images.unsplash.com/photo-1709054767468-b30206138676?q=80&w=600&auto=format&fit=crop" }, // Doner with fries
            { id: "doener-4", name: "CRUNCHY KEBAB", address: "Bahnhofsallee 1C", ranking_score: 0, description: "Knuspriges Brot und würziges Fleisch.", image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=600&auto=format&fit=crop" }, // Wrap/Durum
            { id: "doener-5", name: "Döner King", address: "Weender Str. 90", ranking_score: 0, description: "Bekannt bei Nachtschwärmern.", image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=600&auto=format&fit=crop" }, // Doner Sandwich
            { id: "doener-6", name: "Profi Döner", address: "Güterbahnhofstraße 4", ranking_score: 0, description: "Guter Standard-Döner in Bahnhofsnähe.", image_url: "https://images.unsplash.com/photo-1619535860434-7f086338528e?q=80&w=600&auto=format&fit=crop" }, // Platter
            { id: "doener-7", name: "Efendi", address: "Königsstieg 2", ranking_score: 0, description: "Ein Klassiker in Göttingen.", image_url: "https://images.unsplash.com/photo-1662116850275-c0525d886616?q=80&w=600&auto=format&fit=crop" }, // Classic Kebab
            { id: "doener-8", name: "Efes Döner seit 1996", address: "Groner Str. 35", ranking_score: 0, description: "Traditionsreicher Dönerladen.", image_url: "https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=600&auto=format&fit=crop" }, // Doner Meat
            { id: "doener-9", name: "Europic", address: "Burgstraße 9", ranking_score: 0, description: "Zentral gelegen und beliebt.", image_url: "https://images.unsplash.com/photo-1625938145744-e38051524294?q=80&w=600&auto=format&fit=crop" }, // Plate
            { id: "doener-10", name: "Tunnel Döner", address: "Bahnhofspl. 1", ranking_score: 0, description: "Direkt am Bahnhof.", image_url: "https://images.unsplash.com/photo-1606850780554-b55ef662f085?q=80&w=600&auto=format&fit=crop" }, // Wrap closeup
            { id: "doener-11", name: "Haus des Döners", address: "Groner Str. 51", ranking_score: 0, description: "Franchise.", image_url: "https://plus.unsplash.com/premium_photo-1661600135805-4c07d30d1254?q=80&w=600&auto=format&fit=crop" } // Premium Kebab
        ];

        doenerPlaces.forEach(d => {
            places.create({
                id: d.id, // Explicit ID
                name: d.name,
                description: d.description,
                address: d.address,
                category: "doener",
                image_url: d.image_url,
                ranking_score: d.ranking_score,
                vote_count: 0
            } as any);
        });

        // --- BAR 🍺 ---
        places.create({
            id: "bar-1",
            name: "Monster Bar",
            description: "Kultige Bar mit großer Cocktailauswahl.",
            address: "Goethe-Allee",
            category: "bar",
            image_url: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=600&auto=format&fit=crop",
            ranking_score: 0,
            vote_count: 0
        } as any);

        places.create({
            id: "bar-2",
            name: "Trou",
            description: "Gemütliche Kellerkneipe mit Geschichte.",
            address: "Burgstraße",
            category: "bar",
            image_url: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=600&auto=format&fit=crop",
            ranking_score: 0,
            vote_count: 0
        } as any);

        // --- RESTAURANT 🍽️ ---
        places.create({
            id: "rest-1",
            name: "Bullerjahn",
            description: "Im alten Rathaus. Gute deutsche Küche.",
            address: "Markt",
            category: "restaurant",
            image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop",
            ranking_score: 0,
            vote_count: 0
        } as any);

        places.create({
            id: "rest-2",
            name: "Zentralmensa",
            description: "Die größte Mensa der Universität.",
            address: "Platz der Göttinger Sieben 4",
            category: "restaurant",
            image_url: "https://images.unsplash.com/photo-1555243575-b6d31191316b?q=80&w=600&auto=format&fit=crop",
            ranking_score: 0,
            vote_count: 0
        } as any);

        // --- OTHER ---
        places.create({
            id: "other-1",
            name: "Gänseliesel",
            description: "Das Wahrzeichen von Göttingen auf dem Marktplatz.",
            address: "Markt, 37073 Göttingen",
            category: "culture",
            image_url: "https://images.unsplash.com/photo-1574347432697-7e615da2a94f?q=80&w=600&auto=format&fit=crop",
            ranking_score: 0,
            vote_count: 0
        } as any);

        places.create({
            id: "other-2",
            name: "Kiessee",
            description: "Beliebtes Naherholungsgebiet im Süden.",
            address: "Sandweg",
            category: "park",
            image_url: "https://images.unsplash.com/photo-1596707301072-a4e9b7201c52?q=80&w=600&auto=format&fit=crop", // Lake image
            ranking_score: 0,
            vote_count: 0
        } as any);
    }
}

class Base44SDK {
    public places: EntityCollection<Place>;
    public votes: EntityCollection<Vote>;
    public users: EntityCollection<User>;
    public auth: Auth;

    constructor() {
        this.places = new EntityCollection<Place>('places');
        this.votes = new EntityCollection<Vote>('votes');
        this.users = new EntityCollection<User>('users');
        this.auth = new Auth(this.users);

        seedData();
    }
    async getMyVote(placeId: string): Promise<Vote | null> {
        const user = this.auth.me();
        if (!user) return null;
        return this.votes.findOne(v => v.userId === user.id && v.placeId === placeId);
    }

    async vote(placeId: string, value: number): Promise<Vote> {
        const user = this.auth.me();
        if (!user) throw new Error("Must be logged in to vote");

        // 1. Check if user already voted for this place
        const existingVote = await this.votes.findOne(v => v.userId === user.id && v.placeId === placeId);

        let vote: Vote;
        if (existingVote) {
            // Update existing vote
            vote = (await this.votes.update(existingVote.id, { value })) as Vote;
        } else {
            // Create new vote
            vote = await this.votes.create({
                userId: user.id,
                placeId,
                value
            } as any);
        }

        // 2. Recalculate Place Ranking Score (Average)
        const allVotesForPlace = await this.votes.find(v => v.placeId === placeId);
        const totalScore = allVotesForPlace.reduce((sum, v) => sum + v.value, 0);
        const averageScore = totalScore / allVotesForPlace.length;

        // 3. Update Place
        await this.places.update(placeId, {
            ranking_score: averageScore,
            vote_count: allVotesForPlace.length
        });

        return vote;
    }
}

export const base44 = new Base44SDK();
