/**
 * Border utilities
 * Handles border-width, border-radius, and border-style properties
 */

import { resolveBorderRadius, resolveSpacing } from '../resolvers';

export function resolveBorderUtility(prefix: string, value: string): Record<string, any> | null {
    // Border radius
    if (prefix === 'rounded') {
        if (!value || value === '') {
            return { borderRadius: resolveBorderRadius('DEFAULT') };
        }

        // Directional radius
        const directionMap: Record<string, string[]> = {
            't': ['borderTopLeftRadius', 'borderTopRightRadius'],
            'r': ['borderTopRightRadius', 'borderBottomRightRadius'],
            'b': ['borderBottomLeftRadius', 'borderBottomRightRadius'],
            'l': ['borderTopLeftRadius', 'borderBottomLeftRadius'],
            'tl': ['borderTopLeftRadius'],
            'tr': ['borderTopRightRadius'],
            'br': ['borderBottomRightRadius'],
            'bl': ['borderBottomLeftRadius'],
            's': ['borderStartStartRadius', 'borderEndStartRadius'],
            'e': ['borderStartEndRadius', 'borderEndEndRadius'],
            'ss': ['borderStartStartRadius'],
            'se': ['borderStartEndRadius'],
            'ee': ['borderEndEndRadius'],
            'es': ['borderEndStartRadius'],
        };

        const parts = value.split('-');
        const direction = parts[0];
        const size = parts.slice(1).join('-');

        if (directionMap[direction]) {
            const radiusValue = resolveBorderRadius(size || 'DEFAULT');
            return Object.fromEntries(directionMap[direction].map(p => [p, radiusValue]));
        }

        return { borderRadius: resolveBorderRadius(value) };
    }

    // Border width
    if (prefix === 'border') {
        if (!value || value === '') {
            return { borderWidth: '1px', borderStyle: 'solid' };
        }

        // Numeric border width
        if (!isNaN(parseInt(value))) {
            const width = value + 'px';
            return { borderWidth: width, borderStyle: 'solid' };
        }

        // Directional borders
        const dirMap: Record<string, string[]> = {
            't': ['borderTopWidth'],
            'r': ['borderRightWidth'],
            'b': ['borderBottomWidth'],
            'l': ['borderLeftWidth'],
            'x': ['borderLeftWidth', 'borderRightWidth'],
            'y': ['borderTopWidth', 'borderBottomWidth'],
            's': ['borderInlineStartWidth'],
            'e': ['borderInlineEndWidth'],
        };

        if (dirMap[value]) {
            return Object.fromEntries(dirMap[value].map(p => [p, '1px']));
        }
    }

    // Border-t, border-r, border-b, border-l, border-s, border-e specific
    const borderDirMatch = prefix.match(/^border-([trblxyes])$/);
    if (borderDirMatch) {
        const dir = borderDirMatch[1];
        const dirMap: Record<string, string[]> = {
            't': ['borderTopWidth'],
            'r': ['borderRightWidth'],
            'b': ['borderBottomWidth'],
            'l': ['borderLeftWidth'],
            'x': ['borderLeftWidth', 'borderRightWidth'],
            'y': ['borderTopWidth', 'borderBottomWidth'],
            's': ['borderInlineStartWidth'],
            'e': ['borderInlineEndWidth'],
        };

        const styleValues = new Set(['solid', 'dashed', 'dotted', 'double', 'none', 'hidden', 'groove', 'ridge', 'inset', 'outset']);
        if (dirMap[dir]) {
            // If value is a style keyword, set style properties instead of widths
            if (value && styleValues.has(value)) {
                return Object.fromEntries(dirMap[dir].map(p => {
                    const styleProp = p.replace(/Width$/, 'Style');
                    return [styleProp, value];
                }));
            }

            // Determine width value, support arbitrary bracket values, numeric px shorthand, or raw units
            let width: string;
            if (!value || value === '') {
                width = '1px';
            } else if (value.startsWith('[')) {
                width = resolveSpacing(value);
            } else if (!isNaN(parseInt(value))) {
                width = value + 'px';
            } else {
                width = value;
            }

            return Object.fromEntries(dirMap[dir].map(p => [p, width]));
        }
    }

    // Divide utilities
    if (prefix === 'divide-x' || prefix === 'divide-y') {
        const width = !value ? '1px' : resolveSpacing(value);
        const property = prefix === 'divide-x' ? 'borderLeftWidth' : 'borderTopWidth';
        return { '> * + *': { [property]: width } };
    }

    // Ring width
    if (prefix === 'ring') {
        if (!value || value === '') {
            return {
                '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
                '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
                boxShadow: 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'
            };
        }
        if (!isNaN(parseInt(value))) {
            const width = value + 'px';
            return {
                '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
                '--tw-ring-shadow': `var(--tw-ring-inset) 0 0 0 calc(${width} + var(--tw-ring-offset-width)) var(--tw-ring-color)`,
                boxShadow: 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'
            };
        }
        // Support arbitrary values like [3px] or spacing tokens
        if (value && value.startsWith('[')) {
            const width = resolveSpacing(value);
            return {
                '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
                '--tw-ring-shadow': `var(--tw-ring-inset) 0 0 0 calc(${width} + var(--tw-ring-offset-width)) var(--tw-ring-color)`,
                boxShadow: 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'
            };
        }
        if (value === 'inset') {
            return { '--tw-ring-inset': 'inset' };
        }
    }

    // Ring offset width
    if (prefix === 'ring-offset') {
        if (!isNaN(parseInt(value))) {
            return { '--tw-ring-offset-width': value + 'px' };
        }
        if (value && value.startsWith('[')) {
            return { '--tw-ring-offset-width': resolveSpacing(value) };
        }
    }

    // Ring opacity
    if (prefix === 'ring-opacity') {
        if (value && value.startsWith('[')) {
            return { '--tw-ring-opacity': value.slice(1, -1) };
        }
        if (!isNaN(parseInt(value))) {
            return { '--tw-ring-opacity': (parseInt(value) / 100).toString() };
        }
    }

    // Outline width
    if (prefix === 'outline') {
        if (value && value.startsWith('[')) {
            return { outlineWidth: resolveSpacing(value) };
        }
        if (!isNaN(parseInt(value))) {
            return { outlineWidth: value + 'px' };
        }
    }

    // Outline offset
    if (prefix === 'outline-offset') {
        return { outlineOffset: resolveSpacing(value) };
    }

    return null;
}
