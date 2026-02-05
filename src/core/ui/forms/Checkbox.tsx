import { Check } from '@/core/icons';
import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface CheckboxProps extends BaseProps {
    checked?: boolean | (() => boolean);
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange?: (event: Event) => void;
}

export function Checkbox(props: CheckboxProps) {
    const isChecked = () => typeof props.checked === 'function' ? props.checked() : props.checked;

    return (
        <label class="inline-flex items-center gap-2 cursor-pointer group">
            <div class="relative h-5 w-5">
                <input
                    type="checkbox"
                    id={props.id}
                    name={props.name}
                    value={props.value}
                    {...(props.checked !== undefined ? { checked: isChecked() } : {})}
                    defaultChecked={props.defaultChecked}
                    disabled={props.disabled}
                    class={cn(
                        'peer absolute inset-0 opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed',
                        props.className
                    )}
                    onChange={props.onChange}
                />
                <div
                    class={cn(
                        'absolute inset-0 rounded border border-input transition-all duration-200',
                        'bg-background peer-checked:bg-primary peer-checked:border-primary',
                        'peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
                        'peer-disabled:opacity-50 peer-disabled:grayscale-[0.5]'
                    )}
                />
                <div class="absolute inset-0 flex items-center justify-center bg-primary text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none">
                    <Check size={14} strokeWidth={3.5} />
                </div>
            </div>
            {props.label && (
                <span class="select-none text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                    {props.label}
                </span>
            )}
        </label>
    );
}

export interface RadioProps extends BaseProps {
    checked?: boolean | (() => boolean);
    defaultChecked?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    value: string;
    label?: string;
    onChange?: (event: Event) => void;
}

export function Radio(props: RadioProps) {
    const isChecked = () => typeof props.checked === 'function' ? props.checked() : props.checked;

    return (
        <label class="inline-flex items-center gap-2 cursor-pointer group">
            <div class="relative h-5 w-5">
                <input
                    type="radio"
                    id={props.id}
                    name={props.name}
                    value={props.value}
                    {...(props.checked !== undefined ? { checked: isChecked() } : {})}
                    defaultChecked={props.defaultChecked}
                    disabled={props.disabled}
                    class={cn(
                        'peer absolute inset-0 opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed',
                        props.className
                    )}
                    onChange={props.onChange}
                />
                <div
                    class={cn(
                        'absolute inset-0 rounded-full border border-input transition-all duration-200',
                        'bg-background peer-checked:border-primary',
                        'peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
                        'peer-disabled:opacity-50 peer-disabled:grayscale-[0.5]'
                    )}
                />
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none transform scale-0 peer-checked:scale-100 transition-transform duration-200">
                    <div class="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
            </div>
            {props.label && (
                <span class="select-none text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                    {props.label}
                </span>
            )}
        </label>
    );
}
