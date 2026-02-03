/**
 * Transform utilities
 * Handles translate, rotate, scale, skew transformations
 */

import { resolveSpacing, parseArbitrary } from '../resolvers';

export function resolveTransformUtility(prefix: string, value: string): Record<string, any> | null {
    const compose = () => 'translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))';

    // Translate
    if (prefix === 'translate-x') {
        const val = resolveSpacing(value);
        return { '--tw-translate-x': val, transform: compose() };
    }
    if (prefix === 'translate-y') {
        const val = resolveSpacing(value);
        return { '--tw-translate-y': val, transform: compose() };
    }

    // Rotate
    if (prefix === 'rotate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { '--tw-rotate': val, transform: compose() };
    }

    // Scale
    if (prefix === 'scale') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-scale-x': val, '--tw-scale-y': val, transform: compose() };
    }
    if (prefix === 'scale-x') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-scale-x': val, transform: compose() };
    }
    if (prefix === 'scale-y') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-scale-y': val, transform: compose() };
    }

    // Skew
    if (prefix === 'skew-x') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { '--tw-skew-x': val, transform: compose() };
    }
    if (prefix === 'skew-y') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { '--tw-skew-y': val, transform: compose() };
    }

    // Transform origin
    if (prefix === 'origin') {
        const origins: Record<string, string> = {
            'center': 'center',
            'top': 'top',
            'top-right': 'top right',
            'right': 'right',
            'bottom-right': 'bottom right',
            'bottom': 'bottom',
            'bottom-left': 'bottom left',
            'left': 'left',
            'top-left': 'top left',
        };
        return { transformOrigin: origins[value] || value };
    }

    return null;
}
