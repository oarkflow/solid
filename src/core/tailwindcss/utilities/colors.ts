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
    'ring-offset': '--tw-ring-offset-color', 'shadow': '--tw-shadow-color', accent: 'accentColor',
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

function hexToRgbParts(hex: string): string | null {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6) return null;
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
}

function hslToRgbParts(hsl: string): string | null {
    // Accepts: hsl(h s% l%), hsl(h, s%, l%), or hsl(h s l)
    const inner = hsl.replace(/hsla?\(|\)|/g, '').trim();
    // If contains var(--...), return that inner var raw
    if (inner.includes('var(')) {
        // extract var(...) content
        const varMatch = inner.match(/var\((--[\w-]+)\)/);
        if (varMatch) return `var(${varMatch[1]})`;
        return null;
    }

    // Extract numbers (including percentages)
    const parts = inner.split(/\s*,\s*|\s+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace('%', '')) / 100;
    const l = parseFloat(parts[2].replace('%', '')) / 100;

    // HSL to RGB conversion
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (0 <= hp && hp < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (1 <= hp && hp < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (2 <= hp && hp < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (3 <= hp && hp < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (4 <= hp && hp < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return `${r} ${g} ${b}`;
}

export function resolveColorUtility(prefix: string, value: string): Record<string, any> | null {
    const propString = colorPropMap[prefix];
    if (!propString) return null;

    const color = resolveColor(value);
    if (!color) return null;

    // If setting shadow color variable, convert to 'r g b' when possible
    if (propString === '--tw-shadow-color') {
        // Hex -> rgb parts
        if (color.startsWith('#')) {
            const parts = hexToRgbParts(color);
            if (parts) return { [propString]: parts };
        }

        // hsl(...) -> convert
        if (color.startsWith('hsl')) {
            const parts = hslToRgbParts(color);
            if (parts) return { [propString]: parts };
        }

        // rgb(...) or rgba(...), extract first three numeric components
        const numMatches = color.match(/(\d+(?:\.\d+)?)/g);
        if (numMatches && numMatches.length >= 3) {
            return { [propString]: `${numMatches[0]} ${numMatches[1]} ${numMatches[2]}` };
        }

        // Fallback: set raw value (may work for `0 0 0` or custom formats)
        return { [propString]: color };
    }

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
