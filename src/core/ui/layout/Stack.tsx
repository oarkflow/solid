import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface StackProps extends BaseProps {
    spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Alias for spacing
    divider?: boolean;
}

export function Stack(props: StackProps) {
    const {
        spacing = 'md',
        gap,
        divider = false,
        className = '',
        children,
        ...rest
    } = props;

    const currentSpacing = gap || spacing;

    const spacingClasses = {
        none: 'space-y-0',
        xs: 'space-y-1',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
        xl: 'space-y-8',
    };

    return (
        <div
            class={cn(
                'flex flex-col',
                spacingClasses[currentSpacing],
                divider && 'divide-y divide-[hsl(var(--border))]',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}
