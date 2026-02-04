import { type BaseProps, type MaybeReactive } from '../types';
import { cn } from '../utils';

export interface ProgressProps extends BaseProps {
    value: MaybeReactive<number>;
    max?: MaybeReactive<number>;
    variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function Progress(props: ProgressProps) {
    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const percentage = () => {
        const val = typeof (props as any).value === 'function' ? (props as any).value() : props.value;
        const m = (typeof (props as any).max === 'function' ? (props as any).max() : props.max) || 100;
        return Math.min(Math.max((val / m) * 100, 0), 100);
    };

    return (
        <div class={cn('w-full', props.class, props.className)}>
            {props.showLabel && (
                <div class="flex justify-between items-center mb-1 text-sm">
                    <span>{() => Math.round(percentage())}%</span>
                </div>
            )}
            <div
                class={cn(
                    'w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden',
                    sizeClasses[props.size || 'md']
                )}
                role="progressbar"
                aria-valuenow={() => typeof (props as any).value === 'function' ? (props as any).value() : props.value}
                aria-valuemin="0"
                aria-valuemax={props.max || 100}
            >
                <div
                    class={cn(
                        'h-full ui-transition-slow',
                        `ui-${props.variant || 'primary'}`,
                        'ui-mode-solid'
                    )}
                    style={() => ({ width: `${percentage()}%` })}
                />
            </div>
        </div>
    );
}
