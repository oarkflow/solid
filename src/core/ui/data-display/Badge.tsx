import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface BadgeProps extends BaseProps {
    variant?: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'muted' | 'accent';
    mode?: 'solid' | 'outline' | 'subtle';
    size?: 'sm' | 'md' | 'lg';
    rounded?: boolean;
}

export function Badge(props: BadgeProps) {
    const {
        variant = 'primary',
        mode = 'subtle',
        size = 'sm',
        rounded = false,
        className = '',
        children,
        ...rest
    } = props;

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    return (
        <span
            class={cn(
                'ui-badge inline-flex items-center font-medium',
                `ui-${variant}`,
                `ui-mode-${mode}`,
                sizeClasses[size],
                rounded ? 'rounded-full' : 'rounded',
                className
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
