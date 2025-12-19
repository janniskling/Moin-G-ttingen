import { Home, Calendar, Percent, CloudSun, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function BottomNavigation() {
    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/deals', icon: Percent, label: 'Deals' },
        { to: '/weather', icon: CloudSun, label: 'Wetter' },
        { to: '/ranking', icon: Trophy, label: 'Ranking' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-manipulation",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )
                        }
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
