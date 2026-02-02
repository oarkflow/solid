/**
 * Core configuration utilities for Tailwind CSS
 * Handles theme merging and configuration resolution
 */

import type { Theme, TailwindConfig } from './tailwind.defaults';
import { defaultTheme } from './tailwind.defaults';
import userConfig from './tailwind.config';

/**
 * Deep merge utility for combining theme configurations
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        if (source[key] !== undefined) {
            if (
                typeof source[key] === 'object' &&
                source[key] !== null &&
                !Array.isArray(source[key]) &&
                typeof target[key] === 'object' &&
                target[key] !== null
            ) {
                result[key] = deepMerge(target[key], source[key] as any);
            } else {
                result[key] = source[key] as T[typeof key];
            }
        }
    }
    return result;
}

/**
 * Resolve user config with defaults
 */
export function resolveConfig(config: TailwindConfig): Theme {
    let theme = { ...defaultTheme };
    if (config.theme) {
        const themeConfig = config.theme;
        const keys: (keyof Omit<Theme, 'extend'>)[] = [
            'colors', 'spacing', 'fontSize', 'fontWeight', 'borderRadius',
            'boxShadow', 'maxWidth', 'lineHeight', 'letterSpacing'
        ];

        keys.forEach(key => {
            if (themeConfig[key]) (theme as any)[key] = themeConfig[key];
        });

        if (themeConfig.extend) {
            keys.forEach(key => {
                if (themeConfig.extend?.[key]) {
                    (theme as any)[key] = deepMerge((theme as any)[key], themeConfig.extend[key] as any);
                }
            });
        }
    }
    return theme;
}

export const resolvedTheme = resolveConfig(userConfig);
