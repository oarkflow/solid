// Headless utility functions for UI components using CSS variables

/**
 * Merge class names, filtering out falsy values.
 * Evaluates functions to support reactive signals in classes.
 */
export function cn(...classes: any[]): string {
    return classes
        .map(c => typeof c === 'function' ? c() : c)
        .flat(Infinity)
        .filter(Boolean)
        .join(' ');
}

/**
 * Conditionally add classes based on a condition
 */
export function cx(condition: boolean, trueClass: string, falseClass?: string): string {
    return condition ? trueClass : (falseClass || '');
}

/**
 * Generate CSS variable style object
 * This allows components to be truly headless while supporting theming
 */
export function cssVar(variable: string, fallback?: string): string {
    return fallback ? `var(${variable}, ${fallback})` : `var(${variable})`;
}

/**
 * Create inline styles from CSS variables
 */
export function varStyles(vars: Record<string, string>): Record<string, string> {
    return Object.entries(vars).reduce((acc, [key, value]) => {
        acc[key] = value.startsWith('--') ? cssVar(value) : value;
        return acc;
    }, {} as Record<string, string>);
}

/**
 * Get size-specific CSS variable classes
 * These reference the design system spacing variables
 */
export const SIZE_VARIANTS = {
    xs: {
        padding: 'ui-size-xs-padding',
        fontSize: 'ui-size-xs-text',
        height: 'ui-size-xs-height',
    },
    sm: {
        padding: 'ui-size-sm-padding',
        fontSize: 'ui-size-sm-text',
        height: 'ui-size-sm-height',
    },
    md: {
        padding: 'ui-size-md-padding',
        fontSize: 'ui-size-md-text',
        height: 'ui-size-md-height',
    },
    lg: {
        padding: 'ui-size-lg-padding',
        fontSize: 'ui-size-lg-text',
        height: 'ui-size-lg-height',
    },
    xl: {
        padding: 'ui-size-xl-padding',
        fontSize: 'ui-size-xl-text',
        height: 'ui-size-xl-height',
    },
} as const;

/**
 * Color variant classes using semantic CSS variables
 */
export const COLOR_VARIANTS = {
    primary: 'ui-primary',
    secondary: 'ui-secondary',
    success: 'ui-success',
    destructive: 'ui-destructive',
    warning: 'ui-warning',
    info: 'ui-info',
    muted: 'ui-muted',
    accent: 'ui-accent',
} as const;

/**
 * Style mode classes for interactive elements
 */
export const STYLE_MODES = {
    solid: 'ui-mode-solid',
    outline: 'ui-mode-outline',
    ghost: 'ui-mode-ghost',
    subtle: 'ui-mode-subtle',
    link: 'ui-mode-link',
} as const;

/**
 * Get component variant class names
 */
export function getVariantClasses(
    color: keyof typeof COLOR_VARIANTS = 'primary',
    mode: keyof typeof STYLE_MODES = 'solid',
    size: keyof typeof SIZE_VARIANTS = 'md'
): string {
    return cn(
        COLOR_VARIANTS[color],
        STYLE_MODES[mode],
        SIZE_VARIANTS[size].padding,
        SIZE_VARIANTS[size].fontSize
    );
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = 'ui'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
