/**
 * Color and spacing resolver utilities
 * Handles theme value resolution and arbitrary value parsing
 */

import { resolvedTheme } from './config';

/**
 * Resolve color values from theme or arbitrary values
 */
export function resolveColor(str: string): string | null {
    if (!str) return null;

    // Arbitrary value: [color]
    if (str.startsWith('[') && str.endsWith(']')) {
        return str.slice(1, -1).replace(/_/g, ' ');
    }

    const colors = resolvedTheme.colors;
    const directColor = colors[str];
    if (directColor && typeof directColor === 'string') return directColor;

    const [color, shade] = str.split('-');
    const colorValue = colors[color];
    if (colorValue && typeof colorValue === 'object' && shade) {
        return (colorValue as Record<string, string>)[shade] || null;
    }

    if (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl') || str.startsWith('var(')) return str;
    return null;
}

/**
 * Resolve spacing/sizing values from theme or arbitrary values
 */
export function resolveSpacing(v: string): string {
    if (!v) return '0';

    // Arbitrary value: [20px], [calc(100%-1rem)], [2.5rem]
    if (v.startsWith('[') && v.endsWith(']')) {
        return v.slice(1, -1).replace(/_/g, ' ');
    }

    const themeValue = resolvedTheme.spacing[v];
    if (themeValue) return themeValue;

    // Fractions: 1/2 -> 50%
    if (v.includes('/')) {
        const [num, den] = v.split('/').map(Number);
        if (num && den) return `${(num / den) * 100}%`;
    }

    // Default to value if it looks like a CSS unit (supports px, rem, em, vh, vw, %, pt, ch, ex, etc.)
    if (/\d+(px|rem|em|vh|vw|%|pt|ch|ex|cm|mm|in|pc)$/i.test(v)) return v;

    // Support decimal values with units: 2.5rem, 1.5em, etc.
    if (/^\d+(\.\d+)?(px|rem|em|vh|vw|%|pt|ch|ex|cm|mm|in|pc)$/i.test(v)) return v;

    // Handle numeric values as rem (4 -> 1rem)
    const num = parseFloat(v);
    if (!isNaN(num)) return `${num * 0.25}rem`;

    return v;
}

/**
 * Resolve font size values
 */
export function resolveFontSize(value: string): string {
    if (value.startsWith('[')) return resolveSpacing(value);
    return resolvedTheme.fontSize[value] || value;
}

/**
 * Resolve font weight values
 */
export function resolveFontWeight(value: string): string {
    return resolvedTheme.fontWeight[value] || value;
}

/**
 * Resolve line height values
 */
export function resolveLineHeight(value: string): string {
    if (value.startsWith('[')) return resolveSpacing(value);
    return resolvedTheme.lineHeight[value] || value;
}

/**
 * Resolve letter spacing values
 */
export function resolveLetterSpacing(value: string): string {
    if (value.startsWith('[')) return resolveSpacing(value);
    return resolvedTheme.letterSpacing[value] || value;
}

/**
 * Resolve border radius values
 */
export function resolveBorderRadius(value: string): string {
    if (value.startsWith('[')) return resolveSpacing(value);
    return resolvedTheme.borderRadius[value] || resolveSpacing(value);
}

/**
 * Resolve opacity values (0-100 or arbitrary)
 */
export function resolveOpacity(value: string): string {
    return value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString();
}

/**
 * Parse arbitrary values and handle underscores as spaces
 */
export function parseArbitrary(value: string): string {
    if (value.startsWith('[') && value.endsWith(']')) {
        return value.slice(1, -1).replace(/_/g, ' ');
    }
    return value;
}
