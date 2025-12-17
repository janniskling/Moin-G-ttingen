import { Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface StarRatingProps {
    value: number; // 0-5
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue ?? value;

    const starSize = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    }[size];

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    className={cn(
                        "focus:outline-none transition-transform hover:scale-110",
                        readonly ? "cursor-default hover:scale-100" : "cursor-pointer"
                    )}
                    onMouseEnter={() => !readonly && setHoverValue(star)}
                    onMouseLeave={() => !readonly && setHoverValue(null)}
                    onClick={() => !readonly && onChange?.(star)}
                >
                    <Star
                        className={cn(
                            starSize,
                            "transition-colors",
                            star <= displayValue
                                ? "fill-primary text-primary"
                                : "fill-none text-muted-foreground/30"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
