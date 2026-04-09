import { Home, Calendar, MessageCircle, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function BottomNavigation() {
    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/chats', icon: MessageCircle, label: 'Chats' },
        { to: '/ranking', icon: Trophy, label: 'Ranking' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16 px-safe">
                {navItems.map(({ to, icon: Icon, label }) => (
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
                        </div>
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
