import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase automatically parses the token from the URL hash.
        // We just wait for the session to be established, then redirect back.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                const redirectTo = sessionStorage.getItem('auth_redirect') || '/ranking';
                sessionStorage.removeItem('auth_redirect');
                navigate(redirectTo, { replace: true });
            }
        });

        // Fallback: if already signed in (session in hash already processed)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const redirectTo = sessionStorage.getItem('auth_redirect') || '/ranking';
                sessionStorage.removeItem('auth_redirect');
                navigate(redirectTo, { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Anmeldung wird abgeschlossen…</p>
            </div>
        </div>
    );
}
