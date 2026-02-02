/**
 * Tailwind CSS Engine
 * Core engine that processes utility classes and generates styles
 */

import { resolveColor, resolveSpacing } from './resolvers';
import { StyleManager } from './style-manager';
import {
    staticUtilities,
    resolveSpacingUtility,
    resolveColorUtility,
    resolveTypographyUtility,
    resolveBorderUtility,
    resolveTransformUtility,
    resolveEffectUtility,
    resolveLayoutUtility,
    resolveAnimationUtility,
    resolveMiscUtility,
    applyOpacity,
} from './utilities';

export const TailwindEngine = {
    statics: staticUtilities,

    /**
     * Parse a single utility class and return CSS properties
     */
    parseUtility(current: string): Record<string, any> | null {
        // Handle single word utilities first
        if (current === 'border') {
            return { borderWidth: '1px', borderStyle: 'solid' };
        }

        // Match utility patterns including arbitrary values
        // Supports: prefix-value, prefix-[arbitrary], -prefix-value (negative)
        // Special handling for compound prefixes (space-x, space-y, gap-x, gap-y, inset-x, inset-y)
        const compoundMatch = current.match(/^(-?)(space-[xy]|gap-[xy]|inset-[xy])-(.+)$/);
        if (compoundMatch) {
            const [, negative, prefix, value] = compoundMatch;
            const result = resolveSpacingUtility(prefix, value);
            if (result && negative === '-') {
                for (const k in result) {
                    if (k !== '> * + *') {
                        const v = result[k];
                        if (typeof v === 'string' && (v.includes('rem') || v.includes('px') || v.includes('em') || v.includes('%'))) {
                            result[k] = `-${v}`;
                        }
                    }
                }
            }
            return result;
        }

        // Regular pattern matching
        const match = current.match(/^(-?)([a-z][a-z0-9-]*?)(?:-(.+))?$/);
        if (!match) return null;

        const [, negative, prefix, value] = match;

        // If no value, check if it's a valid valueless utility
        if (!value) {
            if (prefix === 'border') {
                return { borderWidth: '1px', borderStyle: 'solid' };
            }
            return null;
        }

        // Try all utility resolvers in order
        // Note: Color resolver must come before typography for 'text' prefix
        let result =
            resolveSpacingUtility(prefix, value) ||
            resolveColorUtility(prefix, value) ||
            resolveTypographyUtility(prefix, value) ||
            resolveBorderUtility(prefix, value) ||
            resolveTransformUtility(prefix, value) ||
            resolveEffectUtility(prefix, value) ||
            resolveLayoutUtility(prefix, value) ||
            resolveAnimationUtility(prefix, value) ||
            resolveMiscUtility(prefix, value);

        // Apply negative prefix if needed
        if (result && negative === '-') {
            for (const k in result) {
                const v = result[k];
                if (typeof v === 'string') {
                    if (v.includes('rem') || v.includes('px') || v.includes('em') || v.includes('%')) {
                        result[k] = `-${v}`;
                    } else if (!isNaN(parseFloat(v))) {
                        result[k] = `-${v}`;
                    }
                }
            }
        }

        return result;
    },

    /**
     * Process class string and convert to styles
     */
    toStyles(classString: string): { style: Record<string, any>, classes: string[] } {
        if (!classString) return { style: {}, classes: [] };

        const classes: string[] = [];

        const tokens = classString.trim().split(/\s+/);

        for (const token of tokens) {
            let current = token;
            let modifier: string | undefined;
            const important = current.startsWith('!');
            if (important) current = current.slice(1);

            // Extract modifier: hover:bg-red-500 -> hover, bg-red-500
            const modMatch = current.match(/^([a-z0-9]+):(.+)$/);
            if (modMatch) {
                modifier = modMatch[1];
                current = modMatch[2];
            }

            // Parse utility
            let utilityStyle: Record<string, any> | null = null;

            // Check static utilities first
            if (this.statics[current]) {
                utilityStyle = { ...this.statics[current] };
            } else {
                // Handle opacity modifiers: bg-red-500/50
                const opacityMatch = current.match(/^(.+)\/(.+)$/);
                if (opacityMatch) {
                    const [, baseClass, opacityValue] = opacityMatch;
                    const baseStyle = this.parseUtility(baseClass);
                    if (baseStyle) {
                        utilityStyle = { ...baseStyle };
                        // Apply opacity to color properties
                        const opacity = opacityValue.startsWith('[')
                            ? opacityValue.slice(1, -1)
                            : (parseInt(opacityValue) / 100);

                        for (const [prop, val] of Object.entries(utilityStyle)) {
                            if (prop === 'backgroundColor' || prop === 'color' || prop === 'borderColor') {
                                if (typeof val === 'string') {
                                    utilityStyle[prop] = applyOpacity(val, opacity);
                                }
                            }
                        }
                    }
                } else {
                    utilityStyle = this.parseUtility(current);
                }
            }

            if (utilityStyle) {
                for (const [prop, val] of Object.entries(utilityStyle)) {
                    // Handle space utilities with child selectors
                    if (prop === '> * + *') {
                        StyleManager.injectChildRule(token, val as Record<string, string>);
                    } else {
                        StyleManager.inject(token, prop, val as string, modifier);
                    }
                }
                // Keep original token (with modifiers) in classes array
                classes.push(token);
            } else {
                // Unknown utility - pass through
                classes.push(token);
            }
        }

        // Return empty style object - styling is handled via StyleManager runtime injection
        return { style: {}, classes };
    },

    // Helper methods for external access
    getColor: resolveColor,
    getSpacing: resolveSpacing,
};
