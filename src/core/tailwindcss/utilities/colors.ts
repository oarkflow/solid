/**
 * Color utilities
 * Handles background, text, border colors and related properties
 */

import { resolveColor } from '../resolvers';

export const colorPropMap: Record<string, string> = {
    bg: 'backgroundColor',
    text: 'color',
    border: 'borderColor',
    'border-t': 'borderTopColor',
    'border-r': 'borderRightColor',
    'border-b': 'borderBottomColor',
    'border-l': 'borderLeftColor',
    'border-x': 'borderLeftColor,borderRightColor',
    'border-y': 'borderTopColor,borderBottomColor',
    ring: '--tw-ring-color',
    'ring-offset': '--tw-ring-offset-color',
    accent: 'accentColor',
    caret: 'caretColor',
    outline: 'outlineColor',
    fill: 'fill',
    stroke: 'stroke',
    'decoration': 'textDecorationColor',
    'divide': 'borderColor',  // Special handling for divide utilities
    'from': '--tw-gradient-from',
    'via': '--tw-gradient-via',
    'to': '--tw-gradient-to',
};

export function resolveColorUtility(prefix: string, value: string): Record<string, any> | null {
    const propString = colorPropMap[prefix];
    if (!propString) return null;

    const color = resolveColor(value);
    if (!color) return null;

    // Handle multiple properties (border-x, border-y)
    if (propString.includes(',')) {
        const props = propString.split(',');
        return Object.fromEntries(props.map(p => [p, color]));
    }

    return { [propString]: color };
}

/**
 * Apply opacity to a color value
 */
export function applyOpacity(colorValue: string, opacity: number | string): string {
    const opacityValue = typeof opacity === 'string' ? opacity : opacity.toString();

    if (colorValue.startsWith('rgb(')) {
        return colorValue.replace('rgb(', 'rgba(').replace(')', `, ${opacityValue})`);
    }

    if (colorValue.startsWith('hsl(')) {
        return colorValue.replace('hsl(', 'hsla(').replace(')', `, ${opacityValue})`);
    }

    if (colorValue.startsWith('#')) {
        const hex = colorValue.slice(1);
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacityValue})`;
    }

    return colorValue;
}
