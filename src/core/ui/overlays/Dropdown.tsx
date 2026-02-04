import { signal } from '../jsx-runtime';
import type { BaseProps, DropdownItem } from '../types';
import { cn } from '../utils';

export interface DropdownProps extends BaseProps {
    items: DropdownItem[];
    trigger?: any;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

export function Dropdown(props: DropdownProps) {
    const [isOpen, setIsOpen] = signal(false);

    const placementClasses = {
        'bottom-start': 'top-full left-0 mt-1',
        'bottom-end': 'top-full right-0 mt-1',
        'top-start': 'bottom-full left-0 mb-1',
        'top-end': 'bottom-full right-0 mb-1',
    };

    const handleItemClick = (item: DropdownItem) => {
        if (!item.disabled) {
            item.onClick?.();
            setIsOpen(false);
        }
    };

    const variantClasses = {
        default: 'hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--foreground))]',
        destructive: 'hover:bg-red-500/10 text-red-600',
        success: 'hover:bg-green-500/10 text-green-600',
        warning: 'hover:bg-yellow-500/10 text-yellow-600',
        info: 'hover:bg-blue-500/10 text-blue-600',
    };

    return (
        <div class={cn('relative inline-block', props.class, props.className)}>
            <div onClick={() => setIsOpen(!isOpen())}>
                {props.trigger || props.children}
            </div>

            {() => isOpen() && (
                <>
                    <div
                        class="fixed inset-0 z-10"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div
                        class={cn(
                            'absolute z-20 min-w-[12rem] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1',
                            placementClasses[props.placement || 'bottom-start']
                        )}
                    >
                        {(props.items || []).map(item => (
                            <button
                                key={item.id}
                                class={cn(
                                    'w-full flex items-center gap-2 px-4 py-2 text-left text-sm ui-transition',
                                    item.disabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : variantClasses[item.variant || 'default']
                                )}
                                onClick={() => handleItemClick(item)}
                                disabled={item.disabled}
                            >
                                {item.icon && <span class="inline-flex">{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
