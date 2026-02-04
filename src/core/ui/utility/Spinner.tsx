import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface SpinnerProps extends BaseProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'secondary' | 'white';
}

export function Spinner(props: SpinnerProps) {
    const {
        size = 'md',
        variant = 'primary',
        className = '',
        ...rest
    } = props;

    const sizeClasses = {
        xs: 'w-3 h-3 border',
        sm: 'w-4 h-4 border',
        md: 'w-5 h-5 border-2',
        lg: 'w-8 h-8 border-2',
        xl: 'w-12 h-12 border-[3px]',
    };

    const colorClasses = {
        primary: 'border-[hsl(var(--muted))] border-r-[hsl(var(--primary))]',
        secondary: 'border-[hsl(var(--muted))] border-r-[hsl(var(--foreground))]',
        white: 'border-white/30 border-r-white',
    };

    return (
        <div
            class={cn(
                'inline-block rounded-full animate-spin',
                sizeClasses[size],
                colorClasses[variant],
                className
            )}
            role="status"
            aria-label="Loading"
            {...rest}
        >
            <span class="sr-only">Loading...</span>
        </div>
    );
}
