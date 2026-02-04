import { type BaseProps, type MaybeReactive } from '../types';
import { cn } from '../utils';

export interface SwitchProps extends BaseProps {
    checked?: MaybeReactive<boolean>;
    defaultChecked?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    label?: string;
    size?: MaybeReactive<'sm' | 'md' | 'lg'>;
    onChange?: (event: Event) => void;
}

export function Switch(props: SwitchProps) {
    const sizeClasses = {
        sm: {
            track: 'w-8 h-4',
            thumb: 'w-3 h-3',
            translate: 'translate-x-4',
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-5',
        },
        lg: {
            track: 'w-14 h-7',
            thumb: 'w-6 h-6',
            translate: 'translate-x-7',
        },
    };

    const size = () => (typeof props.size === 'function' ? (props.size as any)() : props.size) || 'md';
    const checked = () => typeof props.checked === 'function' ? (props.checked as any)() : props.checked;

    return (
        <label
            class={() => cn(
                'relative inline-flex items-center cursor-pointer',
                props.disabled && 'opacity-50 cursor-not-allowed',
                props.class,
                props.className
            )}
        >
            <input
                type="checkbox"
                role="switch"
                id={props.id}
                name={props.name}
                checked={checked}
                onChange={props.onChange}
                disabled={props.disabled}
                class="sr-only peer"
            />
            <div
                class={() => cn(
                    'rounded-full ui-transition',
                    'bg-[hsl(var(--muted))] peer-checked:bg-[hsl(var(--primary))]',
                    'peer-focus:ring-2 peer-focus:ring-[hsl(var(--ring))]',
                    (sizeClasses as any)[size()].track
                )}
            />
            <div
                class={() => cn(
                    'absolute top-0.5 left-0.5 bg-white rounded-full ui-transition',
                    'peer-checked:' + (sizeClasses as any)[size()].translate,
                    (sizeClasses as any)[size()].thumb
                )}
            />
            {props.label && (
                <span class={() => cn('ml-3', size() === 'sm' ? 'text-sm' : size() === 'lg' ? 'text-base' : 'text-sm')}>
                    {props.label}
                </span>
            )}
        </label>
    );
}
