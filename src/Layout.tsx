import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './components/BottomNavigation';
import { Moon, Sun } from 'lucide-react';
// import { cn } from './lib/utils';

export function Layout() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
            {/* Header / Top Bar (Optional but good for Dark Mode toggle) */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4">
                    <span className="font-bold text-lg tracking-tight text-primary">Göttingen Guide</span>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 container px-4 py-4 pb-24 overflow-x-hidden">
                <div className="mx-auto max-w-md w-full"> {/* Constrain width for a "mobile app" feel on desktop */}
                    <Outlet />
                </div>
            </main>

            <BottomNavigation />
        </div>
    );
}
