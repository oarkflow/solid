/**
 * Tailwind CSS Runtime
 *
 * A modular, lightweight implementation of Tailwind CSS utilities with:
 * - Full support for latest CSS properties
 * - CSS variable integration
 * - Dynamic runtime style injection
 * - Modifier support (hover, focus, dark mode, responsive)
 * - Arbitrary value support [value]
 *
 * Architecture:
 * - config.ts: Configuration and theme resolution
 * - resolvers.ts: Value resolution for colors, spacing, etc.
 * - style-manager.ts: Runtime CSS injection
 * - engine.ts: Core utility processing
 * - utilities/: Modular utility resolvers
 */

import { resolvedTheme } from './config';
import { TailwindEngine } from './engine';
import { StyleManager } from './style-manager';

export { resolvedTheme as theme };
export { TailwindEngine } from './engine';

/**
 * Convert utility classes to inline styles (for static usage)
 */
export function tw(classString: string): Record<string, any> {
    const { style } = TailwindEngine.toStyles(classString);
    return style;
}

/**
 * Reactive version of tw() that accepts a getter function
 */
export function twReactive(getClass: () => string): () => Record<string, any> {
    return () => TailwindEngine.toStyles(getClass()).style;
}

/**
 * Install Tailwind CSS runtime
 * Wraps createElement to automatically process class names
 */
export function installTailwind(): void {
    const orig = (globalThis as any).createElement as Function | undefined;
    if (!orig || (orig as any).__twInstalled) return;

    // Initialize StyleManager for runtime CSS injection
    StyleManager.init();

    const wrapper = function (tag: any, props: any, ...children: any[]) {
        if (props) {
            const cls = props.class ?? props.className;
            if (cls && typeof cls === 'string') {
                // Process classes through engine to inject CSS rules
                const { classes } = TailwindEngine.toStyles(cls);
                props = { ...props, class: classes.join(' ') };
            } else if (typeof cls === 'function') {
                // Reactive classes
                props = {
                    ...props,
                    class: () => {
                        const { classes } = TailwindEngine.toStyles(cls());
                        return classes.join(' ');
                    }
                };
            }
        }
        return orig(tag, props, ...children);
    } as any;

    (wrapper as any).__twInstalled = true;
    (globalThis as any).createElement = wrapper;
}
