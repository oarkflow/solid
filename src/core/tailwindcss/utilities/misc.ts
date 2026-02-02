/**
 * Miscellaneous utilities
 * Handles z-index, visibility, and other special properties
 */

import { parseArbitrary } from '../resolvers';

export function resolveMiscUtility(prefix: string, value: string): Record<string, any> | null {
    // Z-index
    if (prefix === 'z') {
        if (value === 'auto') return { zIndex: 'auto' };
        return { zIndex: value.startsWith('[') ? parseArbitrary(value) : value };
    }

    // Vertical align
    if (prefix === 'align') {
        const aligns: Record<string, string> = {
            'baseline': 'baseline',
            'top': 'top',
            'middle': 'middle',
            'bottom': 'bottom',
            'text-top': 'text-top',
            'text-bottom': 'text-bottom',
            'sub': 'sub',
            'super': 'super',
        };
        return { verticalAlign: aligns[value] || parseArbitrary(value) };
    }

    // Content
    if (prefix === 'content') {
        if (value === 'none') return { content: 'none' };
        return { content: parseArbitrary(value) || `"${value}"` };
    }

    // List style
    if (prefix === 'list') {
        const listStyles: Record<string, any> = {
            'none': { listStyleType: 'none' },
            'disc': { listStyleType: 'disc' },
            'decimal': { listStyleType: 'decimal' },
            'inside': { listStylePosition: 'inside' },
            'outside': { listStylePosition: 'outside' },
        };
        return listStyles[value] || { listStyleType: parseArbitrary(value) };
    }

    // Table layout
    if (prefix === 'table') {
        if (value === 'auto') return { tableLayout: 'auto' };
        if (value === 'fixed') return { tableLayout: 'fixed' };
    }

    // Caption side
    if (prefix === 'caption') {
        if (value === 'top') return { captionSide: 'top' };
        if (value === 'bottom') return { captionSide: 'bottom' };
    }

    // Border collapse
    if (prefix === 'border-collapse') {
        return { borderCollapse: 'collapse' };
    }
    if (prefix === 'border-separate') {
        return { borderCollapse: 'separate' };
    }

    // Border spacing
    if (prefix === 'border-spacing') {
        return { borderSpacing: parseArbitrary(value) };
    }

    // Touch action
    if (prefix === 'touch') {
        const touches: Record<string, string> = {
            'auto': 'auto',
            'none': 'none',
            'pan-x': 'pan-x',
            'pan-left': 'pan-left',
            'pan-right': 'pan-right',
            'pan-y': 'pan-y',
            'pan-up': 'pan-up',
            'pan-down': 'pan-down',
            'pinch-zoom': 'pinch-zoom',
            'manipulation': 'manipulation',
        };
        return { touchAction: touches[value] };
    }

    // Overscroll behavior
    if (prefix === 'overscroll') {
        const behaviors: Record<string, string> = {
            'auto': 'auto',
            'contain': 'contain',
            'none': 'none',
        };
        return { overscrollBehavior: behaviors[value] };
    }
    if (prefix === 'overscroll-x') {
        const behaviors: Record<string, string> = {
            'auto': 'auto',
            'contain': 'contain',
            'none': 'none',
        };
        return { overscrollBehaviorX: behaviors[value] };
    }
    if (prefix === 'overscroll-y') {
        const behaviors: Record<string, string> = {
            'auto': 'auto',
            'contain': 'contain',
            'none': 'none',
        };
        return { overscrollBehaviorY: behaviors[value] };
    }

    // Accent color (already in colors, but alternative handling)
    if (prefix === 'accent') {
        return { accentColor: parseArbitrary(value) };
    }

    // Caret color (already in colors, but alternative handling)
    if (prefix === 'caret') {
        return { caretColor: parseArbitrary(value) };
    }

    // Forced color adjust
    if (prefix === 'forced-color-adjust') {
        if (value === 'auto') return { forcedColorAdjust: 'auto' };
        if (value === 'none') return { forcedColorAdjust: 'none' };
    }

    return null;
}
