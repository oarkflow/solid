import { ChevronDown } from '@/core/icons';
import type { BaseProps, SelectOption } from '../types';
import { cn } from '../utils';

export interface SelectProps extends BaseProps {
    options: SelectOption[];
    value?: string | number;
    defaultValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    onChange?: (event: Event) => void;
}

export function Select(props: SelectProps) {
    const {
        options,
        value,
        defaultValue,
        placeholder,
        disabled = false,
        required = false,
        name,
        id,
        className = '',
        onChange,
        ...rest
    } = props;

    return (
        <div class={cn('relative inline-block w-full group', className)}>
            <select
                id={id}
                name={name}
                value={value}
                defaultValue={defaultValue || (placeholder ? '' : undefined)}
                disabled={disabled}
                required={required}
                class={cn(
                    'ui-select w-full appearance-none pr-10 h-10 px-3',
                    'bg-background border border-input rounded-md text-sm',
                    'transition-all duration-200 outline-none cursor-pointer',
                    'focus:ring-1 focus:ring-ring focus:border-ring/50',
                    'hover:border-input/80',
                    disabled && 'opacity-50 cursor-not-allowed grayscale-[0.5]'
                )}
                onChange={onChange}
                {...rest}
            >
                {placeholder && (
                    <option value="" disabled selected={!value && !defaultValue}>
                        {placeholder}
                    </option>
                )}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled} selected={opt.value === value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div class="absolute right-3 inset-y-0 flex items-center pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                <ChevronDown size={16} strokeWidth={2.5} />
            </div>
        </div>
    );
}
