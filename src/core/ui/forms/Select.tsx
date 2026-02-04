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
        <select
            id={id}
            name={name}
            value={value}
            defaultValue={defaultValue || (placeholder ? '' : undefined)}
            disabled={disabled}
            required={required}
            class={cn('ui-select', className)}
            onChange={onChange}
            {...rest}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
