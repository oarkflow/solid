import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface GridProps extends BaseProps {
    cols?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    responsive?: boolean;
}

export function Grid(props: GridProps) {
    const {
        cols = 1,
        sm,
        md,
        lg,
        xl,
        gap = 'md',
        responsive = true,
        className = '',
        children,
        ...rest
    } = props;

    const gapClasses = {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
    };

    const getColClass = () => {
        if (!responsive && !sm && !md && !lg && !xl) {
            return `grid-cols-${cols}`;
        }
        let classes = `grid-cols-${cols}`;
        if (sm) classes += ` sm:grid-cols-${sm}`;
        if (md) classes += ` md:grid-cols-${md}`;
        if (lg) classes += ` lg:grid-cols-${lg}`;
        if (xl) classes += ` xl:grid-cols-${xl}`;

        // Default responsive behavior if nothing specific provided
        if (responsive && !sm && !md && !lg && !xl) {
            classes = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`;
        }
        return classes;
    };

    return (
        <div
            class={cn('grid', getColClass(), gapClasses[gap], className)}
            {...rest}
        >
            {children}
        </div>
    );
}
