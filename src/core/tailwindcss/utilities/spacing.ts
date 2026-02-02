/**
 * Dynamic spacing utilities
 * Handles padding, margin, gap, inset, width, height and related properties
 */

import { resolveSpacing } from '../resolvers';

export interface SpacingProps {
    [key: string]: string[];
}

export const spacingPropMap: SpacingProps = {
    // Padding
    p: ['padding'],
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    pt: ['paddingTop'],
    pr: ['paddingRight'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    ps: ['paddingInlineStart'],
    pe: ['paddingInlineEnd'],

    // Margin
    m: ['margin'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
    mt: ['marginTop'],
    mr: ['marginRight'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    ms: ['marginInlineStart'],
    me: ['marginInlineEnd'],

    // Gap
    gap: ['gap'],
    'gap-x': ['columnGap'],
    'gap-y': ['rowGap'],

    // Inset positioning
    inset: ['top', 'right', 'bottom', 'left'],
    'inset-x': ['left', 'right'],
    'inset-y': ['top', 'bottom'],
    top: ['top'],
    right: ['right'],
    bottom: ['bottom'],
    left: ['left'],
    start: ['insetInlineStart'],
    end: ['insetInlineEnd'],

    // Sizing
    w: ['width'],
    h: ['height'],
    'min-w': ['minWidth'],
    'max-w': ['maxWidth'],
    'min-h': ['minHeight'],
    'max-h': ['maxHeight'],
    size: ['width', 'height'],

    // Flex/Grid
    basis: ['flexBasis'],
    'space-x': [],  // Special handling
    'space-y': [],  // Special handling
};

export function resolveSpacingUtility(prefix: string, value: string): Record<string, any> | null {
    // Handle auto values for margin
    const autoProps: Record<string, string[]> = {
        mx: ['marginLeft', 'marginRight'],
        my: ['marginTop', 'marginBottom'],
        m: ['margin'],
        mt: ['marginTop'],
        mr: ['marginRight'],
        mb: ['marginBottom'],
        ml: ['marginLeft'],
    };

    if (autoProps[prefix] && value === 'auto') {
        return Object.fromEntries(autoProps[prefix].map(p => [p, 'auto']));
    }

    // Handle space-x and space-y utilities
    if (prefix === 'space-x') {
        const val = resolveSpacing(value);
        return { '> * + *': { marginLeft: val } };
    }
    if (prefix === 'space-y') {
        const val = resolveSpacing(value);
        return { '> * + *': { marginTop: val } };
    }

    // Regular spacing utilities
    const props = spacingPropMap[prefix];
    if (props && props.length > 0) {
        const val = resolveSpacing(value);
        return Object.fromEntries(props.map(p => [p, val]));
    }

    return null;
}
