import type { BaseProps, ValidationProps } from '../types';
import { cn } from '../utils';

export interface InputProps extends BaseProps, ValidationProps {
    type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
    placeholder?: string;
    value?: string | number;
    defaultValue?: string | number;
    disabled?: boolean;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    name?: string;
    id?: string;
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
    onFocus?: (event: Event) => void;
    onBlur?: (event: Event) => void;
}

export function Input(props: InputProps) {
    const {
        type = 'text',
        placeholder,
        value,
        defaultValue,
        disabled = false,
        readonly = false,
        size = 'md',
        isValid,
        isInvalid,
        name,
        id,
        className = '',
        onChange,
        onInput,
        onFocus,
        onBlur,
        ...rest
    } = props;

    const sizeClasses = {
        sm: 'ui-size-sm-padding ui-size-sm-text',
        md: 'ui-size-md-padding ui-size-md-text',
        lg: 'ui-size-lg-padding ui-size-lg-text',
    };

    return (
        <input
            type={type}
            id={id}
            name={name}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readonly={readonly}
            class={cn(
                'ui-input',
                sizeClasses[size],
                isValid && 'ui-valid',
                isInvalid && 'ui-invalid',
                className
            )}
            onChange={onChange}
            onInput={onInput}
            onFocus={onFocus}
            onBlur={onBlur}
            {...rest}
        />
    );
}
