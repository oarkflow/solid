/**
 * Typography utilities
 * Handles font-size, font-weight, line-height, letter-spacing and text properties
 */

import { resolveFontSize, resolveFontWeight, resolveLineHeight, resolveLetterSpacing } from '../resolvers';

export function resolveTypographyUtility(prefix: string, value: string): Record<string, any> | null {
    switch (prefix) {
        case 'text':
            // Only handle font sizes (xs, sm, base, lg, xl, 2xl, etc. or arbitrary values)
            // Let colors handle color values (red-500, blue-400, etc.)
            const fontSize = resolveFontSize(value);
            // Check if this is actually a font size (contains 'rem', 'px', 'em', or is a known size)
            if (fontSize && (fontSize.includes('rem') || fontSize.includes('px') || fontSize.includes('em') ||
                ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].includes(value))) {
                return { fontSize };
            }
            // Not a font size, return null to let color resolver handle it
            return null;

        case 'font':
            // Font weight
            return { fontWeight: resolveFontWeight(value) };

        case 'leading':
            // Line height
            return { lineHeight: resolveLineHeight(value) };

        case 'tracking':
            // Letter spacing
            return { letterSpacing: resolveLetterSpacing(value) };

        case 'indent':
            // Text indent
            return { textIndent: resolveLetterSpacing(value) };

        default:
            return null;
    }
}
