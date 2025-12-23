import { Home, Calendar, Percent, MessageCircle, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function BottomNavigation() {
    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/chats', icon: MessageCircle, label: 'Chats' },
        { to: '/ranking', icon: Trophy, label: 'Ranking' },
        { to: '/deals', icon: Percent, label: 'Deals', beta: true },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ to, icon: Icon, label, beta }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-manipulation relative",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )
                        }
                    >
                        <div className="relative">
                            <Icon className="w-5 h-5" />
                            {beta && (
                                <span className="absolute -top-3 -right-6 text-[8px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded-full z-10">
                                    Beta
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
