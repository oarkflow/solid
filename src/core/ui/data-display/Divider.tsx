import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface DividerProps extends BaseProps {
    orientation?: 'horizontal' | 'vertical';
    text?: string;
}

export function Divider(props: DividerProps) {
    const {
        orientation = 'horizontal',
        text,
        className,
        class: clazz, // Extract class specifically
        ...rest
    } = props;

    const combinedClass = cn(className, clazz);

    if (text && orientation === 'horizontal') {
        return (
            <div class={cn('relative flex items-center', combinedClass)} {...rest}>
                <div class="flex-grow border-t border-border h-px" />
                <span class="px-3 text-sm text-muted-foreground whitespace-nowrap">{text}</span>
                <div class="flex-grow border-t border-border h-px" />
            </div>
        );
    }

    if (orientation === 'vertical') {
        return (
            <div
                class={cn('inline-block self-stretch w-px min-h-[1em] bg-border mx-2', combinedClass)}
                role="separator"
                aria-orientation="vertical"
                {...rest}
            />
        );
    }

    return (
        <hr
            class={cn('border-t border-border w-full my-4', combinedClass)}
            role="separator"
            {...rest}
        />
    );
}
