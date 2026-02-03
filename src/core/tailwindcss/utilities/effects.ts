/**
 * Effect utilities
 * Handles filters, backdrop-filters, opacity, and mix-blend-mode
 */

import { resolveOpacity, parseArbitrary } from '../resolvers';

// Blur size map for named sizes
const blurSizes: Record<string, string> = {
    'none': '0',
    'sm': '4px',
    '': '8px',
    'md': '12px',
    'lg': '16px',
    'xl': '24px',
    '2xl': '40px',
    '3xl': '64px',
};

export function resolveEffectUtility(prefix: string, value: string): Record<string, any> | null {
    // Opacity
    if (prefix === 'opacity') {
        return { opacity: resolveOpacity(value) };
    }

    // Blur filter - simplified direct approach
    if (prefix === 'blur') {
        let blurVal: string;
        if (value.startsWith('[')) {
            blurVal = parseArbitrary(value);
        } else if (blurSizes[value] !== undefined) {
            blurVal = blurSizes[value];
        } else if (!isNaN(parseInt(value))) {
            blurVal = value + 'px';
        } else {
            blurVal = '8px'; // default
        }
        return { '--tw-blur': `blur(${blurVal})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'brightness') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-brightness': `brightness(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'contrast') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-contrast': `contrast(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'grayscale') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { '--tw-grayscale': `grayscale(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'hue-rotate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value + 'deg';
        return { '--tw-hue-rotate': `hue-rotate(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'invert') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { '--tw-invert': `invert(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'saturate') {
        const val = value.startsWith('[') ? parseArbitrary(value) : (parseInt(value) / 100).toString();
        return { '--tw-saturate': `saturate(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
    }
    if (prefix === 'sepia') {
        const val = value.startsWith('[') ? parseArbitrary(value) : value === '' ? '1' : (parseInt(value) / 100).toString();
        return { '--tw-sepia': `sepia(${val})`, filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
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
        return { '--tw-drop-shadow': shadows[value] ?? parseArbitrary(value), filter: 'var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, )' };
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
