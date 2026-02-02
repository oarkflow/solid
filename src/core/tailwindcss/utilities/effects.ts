/**
 * Effect utilities
 * Handles filters, backdrop-filters, opacity, and mix-blend-mode
 */

import { resolveOpacity, parseArbitrary } from '../resolvers';

export function resolveEffectUtility(prefix: string, value: string): Record<string, any> | null {
    // Opacity
    if (prefix === 'opacity') {
        return { opacity: resolveOpacity(value) };
    }

    // Filters
    if (prefix === 'blur') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'px';
        return { filter: `blur(${val})` };
    }
    if (prefix === 'brightness') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { filter: `brightness(${val})` };
    }
    if (prefix === 'contrast') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { filter: `contrast(${val})` };
    }
    if (prefix === 'grayscale') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { filter: `grayscale(${val})` };
    }
    if (prefix === 'hue-rotate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { filter: `hue-rotate(${val})` };
    }
    if (prefix === 'invert') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { filter: `invert(${val})` };
    }
    if (prefix === 'saturate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { filter: `saturate(${val})` };
    }
    if (prefix === 'sepia') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { filter: `sepia(${val})` };
    }
    if (prefix === 'drop-shadow') {
        const shadows: Record<string, string> = {
            'sm': 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
            '': 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))',
            'md': 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))',
            'lg': 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))',
            'xl': 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))',
            '2xl': 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
            'none': 'drop-shadow(0 0 #0000)',
        };
        return { filter: shadows[value] || parseArbitrary(value) };
    }

    // Backdrop filters
    if (prefix === 'backdrop-blur') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'px';
        return { backdropFilter: `blur(${val})` };
    }
    if (prefix === 'backdrop-brightness') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { backdropFilter: `brightness(${val})` };
    }
    if (prefix === 'backdrop-contrast') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { backdropFilter: `contrast(${val})` };
    }
    if (prefix === 'backdrop-grayscale') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { backdropFilter: `grayscale(${val})` };
    }
    if (prefix === 'backdrop-hue-rotate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { backdropFilter: `hue-rotate(${val})` };
    }
    if (prefix === 'backdrop-invert') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { backdropFilter: `invert(${val})` };
    }
    if (prefix === 'backdrop-opacity') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { backdropFilter: `opacity(${val})` };
    }
    if (prefix === 'backdrop-saturate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { backdropFilter: `saturate(${val})` };
    }
    if (prefix === 'backdrop-sepia') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { backdropFilter: `sepia(${val})` };
    }

    return null;
}
