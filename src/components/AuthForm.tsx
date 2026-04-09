import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AuthForm({ onClose, onSuccess }: AuthFormProps) {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            if (mode === 'login') {
                await signIn(email, password);
                onSuccess();
            } else {
                const data = await signUp(email, password);
                if ((data as { session?: unknown })?.session) {
                    onSuccess();
                } else {
                    setStatus('success');
                }
            }
        } catch (err: unknown) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
        }
    };

    if (status === 'success' && mode === 'signup') {
        return (
            <div className="text-center space-y-4 py-4">
                <span className="text-4xl">📧</span>
                <p className="font-medium text-green-600">Bestätigung gesendet!</p>
                <p className="text-sm text-muted-foreground">
                    Bitte bestätige deine Email ({email}), um dich einzuloggen.
                </p>
                <Button onClick={() => setMode('login')} variant="outline" className="w-full">
                    Zum Login
                </Button>
            </div>
        );
    }

    const handleGoogleSignIn = async () => {
        setStatus('loading');
        setErrorMsg('');
        try {
            await signInWithGoogle();
            // Redirect happens automatically; onSuccess called via onAuthStateChange
        } catch (err: unknown) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Google-Login fehlgeschlagen.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full text-base flex items-center gap-3"
                onClick={handleGoogleSignIn}
                disabled={status === 'loading'}
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Mit Google anmelden
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">oder</span>
                </div>
            </div>

            <div className="space-y-3">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="text-lg p-5"
                />
                <Input
                    type="password"
                    placeholder="Passwort"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="text-lg p-5"
                    minLength={6}
                />
            </div>

            {status === 'error' && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                    {errorMsg}
                </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" size="lg" className="w-full text-lg" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Lade...' : (mode === 'login' ? 'Einloggen' : 'Registrieren')}
                </Button>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{mode === 'login' ? 'Neu hier?' : 'Schon dabei?'}</span>
                    <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto font-semibold"
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrorMsg(''); setStatus('idle'); }}
                    >
                        {mode === 'login' ? 'Account erstellen' : 'Anmelden'}
                    </Button>
                </div>

                <Button type="button" variant="ghost" onClick={onClose}>
                    Abbrechen
                </Button>
            </div>
        </form>
    );
}
