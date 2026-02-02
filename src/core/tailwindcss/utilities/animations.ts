/**
 * Animation utilities
 * Handles animations, transitions, and scroll behavior
 */

import { parseArbitrary } from '../resolvers';

export function resolveAnimationUtility(prefix: string, value: string): Record<string, any> | null {
    // Animations
    if (prefix === 'animate') {
        const animations: Record<string, string> = {
            'none': 'none',
            'spin': 'spin 1s linear infinite',
            'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
            'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'bounce': 'bounce 1s infinite',
        };
        return { animation: animations[value] || parseArbitrary(value) };
    }

    // Scroll behavior
    if (prefix === 'scroll') {
        if (value === 'auto') return { scrollBehavior: 'auto' };
        if (value === 'smooth') return { scrollBehavior: 'smooth' };
    }

    // Scroll snap
    if (prefix === 'snap') {
        const snaps: Record<string, any> = {
            'none': { scrollSnapType: 'none' },
            'x': { scrollSnapType: 'x var(--tw-scroll-snap-strictness)' },
            'y': { scrollSnapType: 'y var(--tw-scroll-snap-strictness)' },
            'both': { scrollSnapType: 'both var(--tw-scroll-snap-strictness)' },
            'mandatory': { '--tw-scroll-snap-strictness': 'mandatory' },
            'proximity': { '--tw-scroll-snap-strictness': 'proximity' },
            'start': { scrollSnapAlign: 'start' },
            'end': { scrollSnapAlign: 'end' },
            'center': { scrollSnapAlign: 'center' },
            'align-none': { scrollSnapAlign: 'none' },
            'normal': { scrollSnapStop: 'normal' },
            'always': { scrollSnapStop: 'always' },
        };
        return snaps[value] || null;
    }

    // Scroll margin/padding
    if (prefix === 'scroll-m' || prefix === 'scroll-p') {
        const property = prefix === 'scroll-m' ? 'scrollMargin' : 'scrollPadding';
        return { [property]: parseArbitrary(value) };
    }

    // Will change
    if (prefix === 'will-change') {
        const changes: Record<string, string> = {
            'auto': 'auto',
            'scroll': 'scroll-position',
            'contents': 'contents',
            'transform': 'transform',
        };
        return { willChange: changes[value] || parseArbitrary(value) };
    }

    return null;
}
