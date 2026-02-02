/**
 * Layout utilities
 * Handles grid, flexbox, aspect-ratio, and object positioning
 */

import { resolveSpacing, parseArbitrary } from '../resolvers';

export function resolveLayoutUtility(prefix: string, value: string): Record<string, any> | null {
    // Grid columns
    if (prefix === 'grid-cols') {
        if (value.startsWith('[')) {
            return { gridTemplateColumns: parseArbitrary(value) };
        }
        if (value === 'none') {
            return { gridTemplateColumns: 'none' };
        }
        return { gridTemplateColumns: `repeat(${value}, minmax(0, 1fr))` };
    }

    // Grid rows
    if (prefix === 'grid-rows') {
        if (value.startsWith('[')) {
            return { gridTemplateRows: parseArbitrary(value) };
        }
        if (value === 'none') {
            return { gridTemplateRows: 'none' };
        }
        return { gridTemplateRows: `repeat(${value}, minmax(0, 1fr))` };
    }

    // Column span
    if (prefix === 'col-span') {
        if (value === 'full') {
            return { gridColumn: '1 / -1' };
        }
        if (value === 'auto') {
            return { gridColumn: 'auto' };
        }
        return { gridColumn: `span ${value} / span ${value}` };
    }

    // Row span
    if (prefix === 'row-span') {
        if (value === 'full') {
            return { gridRow: '1 / -1' };
        }
        if (value === 'auto') {
            return { gridRow: 'auto' };
        }
        return { gridRow: `span ${value} / span ${value}` };
    }

    // Column start/end
    if (prefix === 'col-start') {
        return { gridColumnStart: value === 'auto' ? 'auto' : value };
    }
    if (prefix === 'col-end') {
        return { gridColumnEnd: value === 'auto' ? 'auto' : value };
    }

    // Row start/end
    if (prefix === 'row-start') {
        return { gridRowStart: value === 'auto' ? 'auto' : value };
    }
    if (prefix === 'row-end') {
        return { gridRowEnd: value === 'auto' ? 'auto' : value };
    }

    // Auto flow
    if (prefix === 'grid-flow') {
        const flows: Record<string, string> = {
            'row': 'row',
            'col': 'column',
            'dense': 'dense',
            'row-dense': 'row dense',
            'col-dense': 'column dense',
        };
        return { gridAutoFlow: flows[value] || value };
    }

    // Auto columns/rows
    if (prefix === 'auto-cols') {
        const sizes: Record<string, string> = {
            'auto': 'auto',
            'min': 'min-content',
            'max': 'max-content',
            'fr': 'minmax(0, 1fr)',
        };
        return { gridAutoColumns: sizes[value] || parseArbitrary(value) };
    }
    if (prefix === 'auto-rows') {
        const sizes: Record<string, string> = {
            'auto': 'auto',
            'min': 'min-content',
            'max': 'max-content',
            'fr': 'minmax(0, 1fr)',
        };
        return { gridAutoRows: sizes[value] || parseArbitrary(value) };
    }

    // Flexbox
    if (prefix === 'flex') {
        if (value === '1') return { flex: '1 1 0%' };
        if (value === 'auto') return { flex: '1 1 auto' };
        if (value === 'initial') return { flex: '0 1 auto' };
        if (value === 'none') return { flex: 'none' };
        return { flex: parseArbitrary(value) };
    }

    if (prefix === 'grow') {
        if (value === '') return { flexGrow: '1' };
        return { flexGrow: value };
    }

    if (prefix === 'shrink') {
        if (value === '') return { flexShrink: '1' };
        return { flexShrink: value };
    }

    // Order
    if (prefix === 'order') {
        if (value === 'first') return { order: '-9999' };
        if (value === 'last') return { order: '9999' };
        if (value === 'none') return { order: '0' };
        return { order: value };
    }

    // Aspect ratio
    if (prefix === 'aspect') {
        if (value === 'auto') return { aspectRatio: 'auto' };
        if (value === 'square') return { aspectRatio: '1 / 1' };
        if (value === 'video') return { aspectRatio: '16 / 9' };
        if (value.includes('/')) return { aspectRatio: value.replace('-', ' / ') };
        return { aspectRatio: parseArbitrary(value) };
    }

    // Object fit
    if (prefix === 'object') {
        const fits: Record<string, string> = {
            'contain': 'contain',
            'cover': 'cover',
            'fill': 'fill',
            'none': 'none',
            'scale-down': 'scale-down',
        };
        return { objectFit: fits[value] };
    }

    // Object position
    if (prefix === 'object-position') {
        return { objectPosition: value.replace('-', ' ') };
    }

    // Columns
    if (prefix === 'columns') {
        if (value === 'auto') return { columns: 'auto' };
        if (value.startsWith('[')) return { columns: parseArbitrary(value) };
        // Could be number or size
        if (!isNaN(parseInt(value))) return { columns: value };
        return { columns: value };
    }

    // Break (column/page break)
    if (prefix === 'break') {
        const breaks: Record<string, any> = {
            'normal': { breakBefore: 'auto', breakAfter: 'auto', breakInside: 'auto' },
            'words': { overflowWrap: 'break-word' },
            'all': { wordBreak: 'break-all' },
            'keep': { wordBreak: 'keep-all' },
            'before': { breakBefore: 'auto' },
            'after': { breakAfter: 'auto' },
            'inside': { breakInside: 'auto' },
            'avoid': { breakInside: 'avoid' },
            'avoid-page': { breakInside: 'avoid-page' },
            'avoid-column': { breakInside: 'avoid-column' },
        };
        return breaks[value] || null;
    }

    // Box decoration break
    if (prefix === 'box-decoration') {
        return { boxDecorationBreak: value };
    }

    // Box sizing
    if (prefix === 'box') {
        if (value === 'border') return { boxSizing: 'border-box' };
        if (value === 'content') return { boxSizing: 'content-box' };
    }

    return null;
}
