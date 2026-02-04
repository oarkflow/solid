import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface ContainerProps extends BaseProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    centered?: boolean;
    padding?: boolean;
}

export function Container(props: ContainerProps) {
    const {
        size = 'xl',
        centered = true,
        padding = true,
        className = '',
        children,
        ...rest
    } = props;

    const sizeClasses = {
        sm: 'max-w-[var(--container-sm)]',
        md: 'max-w-[var(--container-md)]',
        lg: 'max-w-[var(--container-lg)]',
        xl: 'max-w-[var(--container-xl)]',
        '2xl': 'max-w-[var(--container-2xl)]',
        full: 'max-w-full',
    };

    return (
        <div
            class={cn(
                'w-full',
                sizeClasses[size],
                centered && 'mx-auto',
                padding && 'px-4 sm:px-6 lg:px-8',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

export interface SectionProps extends BaseProps {
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    centered?: boolean;
}

export function Section(props: SectionProps) {
    const {
        padding = 'md',
        centered = false,
        className = '',
        children,
        ...rest
    } = props;

    const paddingClasses = {
        none: '',
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
        xl: 'py-24',
    };

    return (
        <section
            class={cn(
                paddingClasses[padding],
                centered && 'text-center',
                className
            )}
            {...rest}
        >
            {children}
        </section>
    );
}
