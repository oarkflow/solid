/**
 * Transform utilities
 * Handles translate, rotate, scale, skew transformations
 */

import { resolveSpacing, parseArbitrary } from '../resolvers';

export function resolveTransformUtility(prefix: string, value: string): Record<string, any> | null {
    // Translate
    if (prefix === 'translate-x') {
        const val = resolveSpacing(value);
        return { transform: `translateX(${val})` };
    }
    if (prefix === 'translate-y') {
        const val = resolveSpacing(value);
        return { transform: `translateY(${val})` };
    }

    // Rotate
    if (prefix === 'rotate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { transform: `rotate(${val})` };
    }

    // Scale
    if (prefix === 'scale') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { transform: `scale(${val})` };
    }
    if (prefix === 'scale-x') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { transform: `scaleX(${val})` };
    }
    if (prefix === 'scale-y') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { transform: `scaleY(${val})` };
    }

    // Skew
    if (prefix === 'skew-x') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { transform: `skewX(${val})` };
    }
    if (prefix === 'skew-y') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { transform: `skewY(${val})` };
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
