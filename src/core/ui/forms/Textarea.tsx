import type { BaseProps, ValidationProps } from '../types';
import { cn } from '../utils';

export interface TextareaProps extends BaseProps, ValidationProps {
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
    cols?: number;
    name?: string;
    id?: string;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
}

export function Textarea(props: TextareaProps) {
    const {
        placeholder,
        value,
        defaultValue,
        disabled = false,
        readonly = false,
        rows = 4,
        cols,
        resize = 'vertical',
        isValid,
        isInvalid,
        name,
        id,
        className = '',
        onChange,
        onInput,
        ...rest
    } = props;

    const resizeClasses = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
    };

    return (
        <textarea
            id={id}
            name={name}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readonly={readonly}
            rows={rows}
            cols={cols}
            class={cn(
                'ui-input',
                resizeClasses[resize],
                isValid && 'ui-valid',
                isInvalid && 'ui-invalid',
                className
            )}
            onChange={onChange}
            onInput={onInput}
            {...rest}
        />
    );
}
