import { signal } from '../jsx-runtime';
import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface TooltipProps extends BaseProps {
    content: string | any;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children: any;
}

export function Tooltip(props: TooltipProps) {
    const {
        content,
        placement = 'top',
        delay = 200,
        className = '',
        children,
        ...rest
    } = props;

    const [isVisible, setIsVisible] = signal(false);
    let timeoutId: number | null = null;

    const placementClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[hsl(var(--popover))]',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[hsl(var(--popover))]',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[hsl(var(--popover))]',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[hsl(var(--popover))]',
    };

    const handleMouseEnter = () => {
        timeoutId = window.setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        setIsVisible(false);
    };

    return (
        <div
            class={cn('relative inline-block', className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...rest}
        >
            {children}

            {() => isVisible() && (
                <div
                    class={cn(
                        'absolute z-50 px-3 py-2 text-sm bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] rounded-md shadow-lg whitespace-nowrap',
                        placementClasses[placement]
                    )}
                    role="tooltip"
                >
                    {content}
                    <div
                        class={cn(
                            'absolute w-0 h-0 border-4',
                            arrowClasses[placement]
                        )}
                    />
                </div>
            )}
        </div>
    );
}
