import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface FormGroupProps extends BaseProps {
    label?: string;
    htmlFor?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export function FormGroup(props: FormGroupProps) {
    const {
        label,
        htmlFor,
        error,
        helperText,
        required = false,
        className = '',
        children,
        ...rest
    } = props;

    return (
        <div class={cn('space-y-1.5', className)} {...rest}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    class="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                    {label}
                    {required && <span class="text-[hsl(var(--destructive))] ml-1">*</span>}
                </label>
            )}

            {children}

            {error && (
                <p class="text-sm text-[hsl(var(--destructive))]">
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                    {helperText}
                </p>
            )}
        </div>
    );
}

export interface FieldsetProps extends BaseProps {
    legend?: string;
}

export function Fieldset(props: FieldsetProps) {
    const { legend, className = '', children, ...rest } = props;

    return (
        <fieldset
            class={cn('border border-[hsl(var(--border))] rounded-lg p-4', className)}
            {...rest}
        >
            {legend && (
                <legend class="px-2 text-sm font-medium text-[hsl(var(--foreground))]">
                    {legend}
                </legend>
            )}
            {children}
        </fieldset>
    );
}
