import type { BaseProps, InteractiveProps, LoadingProps } from '../types';
import { cn } from '../utils';

export interface ButtonProps extends BaseProps, InteractiveProps, LoadingProps {
    variant?: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'muted' | 'accent';
    mode?: 'solid' | 'outline' | 'ghost' | 'subtle' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    type?: 'button' | 'submit' | 'reset';
    href?: string;
}

export function Button(props: ButtonProps) {
    const {
        variant = 'primary',
        mode = 'solid',
        size = 'md',
        type = 'button',
        disabled = false,
        loading = false,
        className = '',
        children,
        onClick,
        href,
        ...rest
    } = props;

    const classes = cn(
        'ui-base',
        `ui-${variant}`,
        `ui-mode-${mode}`,
        `ui-size-${size}-padding`,
        `ui-size-${size}-text`,
        loading && 'ui-loading',
        className
    );

    // If href is provided, render as anchor
    if (href && !disabled) {
        return (
            <a
                href={href}
                class={classes}
                onClick={onClick}
                {...rest}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type={type}
            class={classes}
            disabled={disabled || loading}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}
