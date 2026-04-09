import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../entities/types';

interface AuthContextValue {
    user: SupabaseUser | null;
    profile: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ session: unknown }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
    const { data: supabaseUser } = await supabase.auth.getUser();
    const rawUser = supabaseUser?.user;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return {
        id: userId,
        email: rawUser?.email || '',
        full_name: data?.full_name || rawUser?.user_metadata?.full_name || 'User',
        role: data?.role || 'user',
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await fetchProfile(session.user.id);
                setProfile(p);
            }
            setLoading(false);
        });

        // React to auth state changes (login/logout, token refresh, other tabs)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await fetchProfile(session.user.id);
                setProfile(p);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: email.split('@')[0] } },
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
