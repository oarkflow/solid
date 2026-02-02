import {
    type Theme,
    type TailwindConfig,
    defaultTheme
} from './tailwind.defaults';
import userConfig from './tailwind.config';

// ============================================================================
// Types & Configuration
// ============================================================================

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
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

function resolveConfig(config: TailwindConfig): Theme {
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

const resolvedTheme = resolveConfig(userConfig);

// ============================================================================
// Runtime Style Manager (for modifiers)
// ============================================================================

const StyleManager = {
    cache: new Set<string>(),
    styleTag: null as HTMLStyleElement | null,

    init() {
        if (typeof document === 'undefined' || this.styleTag) return;
        this.styleTag = document.createElement('style');
        this.styleTag.id = 'tailwind-runtime';
        document.head.appendChild(this.styleTag);
    },

    inject(className: string, prop: string, value: string, modifier?: string) {
        this.init();
        if (!this.styleTag) return;

        // Escape class name for CSS selector
        const selector = className
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\//g, '\\/')
            .replace(/#/g, '\\#')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/%/g, '\\%')
            .replace(/\./g, '\\.')
            .replace(/,/g, '\\,');

        let rule = '';
        const important = className.startsWith('!') ? ' !important' : '';
        const body = `{ ${prop}: ${value}${important}; }`;

        switch (modifier) {
            case 'hover': rule = `.${selector}:hover ${body}`; break;
            case 'focus': rule = `.${selector}:focus ${body}`; break;
            case 'active': rule = `.${selector}:active ${body}`; break;
            case 'sm': rule = `@media (min-width: 640px) { .${selector} ${body} }`; break;
            case 'md': rule = `@media (min-width: 768px) { .${selector} ${body} }`; break;
            case 'lg': rule = `@media (min-width: 1024px) { .${selector} ${body} }`; break;
            case 'xl': rule = `@media (min-width: 1280px) { .${selector} ${body} }`; break;
            case '2xl': rule = `@media (min-width: 1536px) { .${selector} ${body} }`; break;
            default: rule = `.${selector} ${body}`;
        }

        if (rule && !this.cache.has(rule)) {
            try {
                this.styleTag.sheet?.insertRule(rule, this.styleTag.sheet.cssRules.length);
                this.cache.add(rule);
            } catch (e) {
                console.warn(`[Tailwind] Failed to inject rule: ${rule}`, e);
            }
        }
    }
};

// ============================================================================
// Tailwind Engine
// ============================================================================

const TailwindEngine = {
    theme: resolvedTheme,

    // Helper to resolve colors
    getColor(str: string): string | null {
        if (!str) return null;

        // Arbitrary value: [color]
        if (str.startsWith('[') && str.endsWith(']')) {
            return str.slice(1, -1).replace(/_/g, ' ');
        }

        const colors = this.theme.colors;
        const directColor = colors[str];
        if (directColor && typeof directColor === 'string') return directColor;

        const [color, shade] = str.split('-');
        const colorValue = colors[color];
        if (colorValue && typeof colorValue === 'object' && shade) {
            return (colorValue as Record<string, string>)[shade] || null;
        }

        if (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl') || str.startsWith('var(')) return str;
        return null;
    },

    // Helper to resolve spacing/sizing
    getSpacing(v: string): string {
        if (!v) return '0';

        // Arbitrary value: [20px], [calc(100%-1rem)]
        if (v.startsWith('[') && v.endsWith(']')) {
            return v.slice(1, -1).replace(/_/g, ' ');
        }

        const themeValue = this.theme.spacing[v];
        if (themeValue) return themeValue;

        // Fractions: 1/2 -> 50%
        if (v.includes('/')) {
            const [num, den] = v.split('/').map(Number);
            if (num && den) return `${(num / den) * 100}%`;
        }

        // Default to value if it looks like a CSS unit
        if (/\d(px|rem|em|vh|vw|%|pt)$/.test(v)) return v;

        // Handle numeric values as rem (4 -> 1rem)
        const num = parseFloat(v);
        if (!isNaN(num)) return `${num * 0.25}rem`;

        return v;
    },

    // Core utility mapping logic
    resolveUtility(prefix: string, value: string): Record<string, string> | null {
        // Spacing: p, m, gap, top, left, etc.
        const spacingProps: Record<string, string[]> = {
            p: ['padding'], px: ['paddingLeft', 'paddingRight'], py: ['paddingTop', 'paddingBottom'],
            pt: ['paddingTop'], pr: ['paddingRight'], pb: ['paddingBottom'], pl: ['paddingLeft'],
            m: ['margin'], mx: ['marginLeft', 'marginRight'], my: ['marginTop', 'marginBottom'],
            mt: ['marginTop'], mr: ['marginRight'], mb: ['marginBottom'], ml: ['marginLeft'],
            gap: ['gap'], 'gap-x': ['columnGap'], 'gap-y': ['rowGap'],
            top: ['top'], right: ['right'], bottom: ['bottom'], left: ['left'],
            inset: ['top', 'right', 'bottom', 'left'], 'inset-x': ['left', 'right'], 'inset-y': ['top', 'bottom'],
            w: ['width'], h: ['height'], 'min-w': ['minWidth'], 'max-w': ['maxWidth'],
            'min-h': ['minHeight'], 'max-h': ['maxHeight'], 'basis': ['flexBasis']
        };

        if (spacingProps[prefix]) {
            const val = this.getSpacing(value);
            return Object.fromEntries(spacingProps[prefix].map(p => [p, val]));
        }

        // Colors: bg, text, border, ring, accent, outline
        const colorProps: Record<string, string> = {
            bg: 'backgroundColor', text: 'color', border: 'borderColor',
            ring: '--tw-ring-color', accent: 'accentColor', outline: 'outlineColor'
        };

        if (colorProps[prefix]) {
            const color = this.getColor(value);
            if (color) return { [colorProps[prefix]]: color };
        }

        // Typography extra
        if (prefix === 'text' && (this.theme.fontSize[value] || value.startsWith('['))) {
            return { fontSize: this.theme.fontSize[value] || this.getSpacing(value) };
        }
        if (prefix === 'font') {
            return { fontWeight: this.theme.fontWeight[value] || value };
        }
        if (prefix === 'leading') {
            return { lineHeight: this.theme.lineHeight[value] || this.getSpacing(value) };
        }
        if (prefix === 'tracking') {
            return { letterSpacing: this.theme.letterSpacing[value] || this.getSpacing(value) };
        }

        // Borders & Radius
        if (prefix === 'rounded') {
            return { borderRadius: this.theme.borderRadius[value] || this.getSpacing(value) };
        }
        if (prefix === 'border' && !isNaN(parseInt(value))) {
            return { borderWidth: value + 'px' };
        }

        // Opacity
        if (prefix === 'opacity') {
            const val = value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString();
            return { opacity: val };
        }

        // Z-index
        if (prefix === 'z') {
            return { zIndex: value.startsWith('[') ? value.slice(1, -1) : value };
        }

        // Transforms
        if (prefix === 'translate-x') return { transform: `translateX(${this.getSpacing(value)})` };
        if (prefix === 'translate-y') return { transform: `translateY(${this.getSpacing(value)})` };
        if (prefix === 'rotate') return { transform: `rotate(${value.startsWith('[') ? value.slice(1, -1) : value + 'deg'})` };
        if (prefix === 'scale') {
            const val = value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString();
            return { transform: `scale(${val})` };
        }

        // Grid
        if (prefix === 'grid-cols') return { gridTemplateColumns: value.startsWith('[') ? value.slice(1, -1) : `repeat(${value}, minmax(0, 1fr))` };
        if (prefix === 'grid-rows') return { gridTemplateRows: value.startsWith('[') ? value.slice(1, -1) : `repeat(${value}, minmax(0, 1fr))` };
        if (prefix === 'col-span') return { gridColumn: value === 'full' ? '1 / -1' : `span ${value} / span ${value}` };
        if (prefix === 'row-span') return { gridRow: `span ${value} / span ${value}` };

        return null;
    },

    // Static utilities
    statics: {
        'block': { display: 'block' }, 'inline-block': { display: 'inline-block' }, 'inline': { display: 'inline' },
        'flex': { display: 'flex' }, 'inline-flex': { display: 'inline-flex' },
        'grid': { display: 'grid' }, 'inline-grid': { display: 'inline-grid' },
        'hidden': { display: 'none' }, 'contents': { display: 'contents' },
        'static': { position: 'static' }, 'fixed': { position: 'fixed' }, 'absolute': { position: 'absolute' }, 'relative': { position: 'relative' }, 'sticky': { position: 'sticky' },
        'flex-row': { flexDirection: 'row' }, 'flex-col': { flexDirection: 'column' },
        'flex-wrap': { flexWrap: 'wrap' }, 'flex-nowrap': { flexWrap: 'nowrap' },
        'items-start': { alignItems: 'flex-start' }, 'items-end': { alignItems: 'flex-end' }, 'items-center': { alignItems: 'center' }, 'items-baseline': { alignItems: 'baseline' }, 'items-stretch': { alignItems: 'stretch' },
        'justify-start': { justifyContent: 'flex-start' }, 'justify-end': { justifyContent: 'flex-end' }, 'justify-center': { justifyContent: 'center' }, 'justify-between': { justifyContent: 'space-between' }, 'justify-around': { justifyContent: 'space-around' }, 'justify-evenly': { justifyContent: 'space-evenly' },
        'self-auto': { alignSelf: 'auto' }, 'self-start': { alignSelf: 'flex-start' }, 'self-end': { alignSelf: 'flex-end' }, 'self-center': { alignSelf: 'center' }, 'self-stretch': { alignSelf: 'stretch' },
        'italic': { fontStyle: 'italic' }, 'uppercase': { textTransform: 'uppercase' }, 'lowercase': { textTransform: 'lowercase' }, 'capitalize': { textTransform: 'capitalize' },
        'underline': { textDecoration: 'underline' }, 'line-through': { textDecoration: 'line-through' }, 'no-underline': { textDecoration: 'none' },
        'text-left': { textAlign: 'left' }, 'text-center': { textAlign: 'center' }, 'text-right': { textAlign: 'right' },
        'truncate': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        'cursor-pointer': { cursor: 'pointer' }, 'cursor-default': { cursor: 'default' }, 'cursor-wait': { cursor: 'wait' }, 'cursor-not-allowed': { cursor: 'not-allowed' },
        'select-none': { userSelect: 'none' }, 'select-text': { userSelect: 'text' }, 'select-all': { userSelect: 'all' },
        'overflow-auto': { overflow: 'auto' }, 'overflow-hidden': { overflow: 'hidden' }, 'overflow-scroll': { overflow: 'scroll' },
        'shadow-sm': { boxShadow: resolvedTheme.boxShadow.sm }, 'shadow': { boxShadow: resolvedTheme.boxShadow.DEFAULT }, 'shadow-md': { boxShadow: resolvedTheme.boxShadow.md }, 'shadow-lg': { boxShadow: resolvedTheme.boxShadow.lg }, 'shadow-xl': { boxShadow: resolvedTheme.boxShadow.xl }, 'shadow-inner': { boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }, 'shadow-none': { boxShadow: 'none' },
        'border': { borderWidth: '1px' }, 'rounded': { borderRadius: resolvedTheme.borderRadius.DEFAULT },
        'duration-75': { transitionDuration: '75ms' }, 'duration-100': { transitionDuration: '100ms' }, 'duration-150': { transitionDuration: '150ms' }, 'duration-200': { transitionDuration: '200ms' }, 'duration-300': { transitionDuration: '300ms' }, 'duration-500': { transitionDuration: '500ms' }, 'duration-700': { transitionDuration: '700ms' }, 'duration-1000': { transitionDuration: '1000ms' },
        'ease-linear': { transitionTimingFunction: 'linear' }, 'ease-in': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 1, 1)' }, 'ease-out': { transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }, 'ease-in-out': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        'transition': { transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', transitionDuration: '150ms' },
        'transition-all': { transitionProperty: 'all', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', transitionDuration: '150ms' },
        'antialiased': { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
    } as Record<string, any>,

    toStyles(classString: string): { style: Record<string, any>, classes: string[] } {
        if (!classString) return { style: {}, classes: [] };

        const style: Record<string, any> = {};
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

            if (this.statics[current]) {
                utilityStyle = { ...this.statics[current] };
            } else {
                const match = current.match(/^(-?)([a-z-]+?)-(.+)$/);
                if (match) {
                    const [, negative, prefix, value] = match;
                    const res = this.resolveUtility(prefix, value);
                    if (res) {
                        utilityStyle = { ...res };
                        if (negative === '-') {
                            // Apply negative if it's a number or rem
                            for (const k in utilityStyle) {
                                const v = utilityStyle[k];
                                if (typeof v === 'string') {
                                    if (v.includes('rem')) utilityStyle[k] = `-${v}`;
                                    else if (!isNaN(parseFloat(v))) utilityStyle[k] = `-${v}`;
                                }
                            }
                        }
                    }
                }
            }

            if (utilityStyle) {
                if (modifier) {
                    // Inject into stylesheet
                    for (const [prop, val] of Object.entries(utilityStyle)) {
                        StyleManager.inject(token, prop, val as string, modifier);
                    }
                    classes.push(token);
                } else {
                    // Standard inline style
                    if (important) {
                        for (const k in utilityStyle) utilityStyle[k] += ' !important';
                    }
                    Object.assign(style, utilityStyle);
                }
            } else {
                // Unknown class, just pass it through
                classes.push(token);
            }
        }

        return { style, classes };
    }
};

// ============================================================================
// Exports & Installation
// ============================================================================

export function tw(classString: string): Record<string, any> {
    const { style } = TailwindEngine.toStyles(classString);
    return style;
}

export function twReactive(getClass: () => string): () => Record<string, any> {
    return () => TailwindEngine.toStyles(getClass()).style;
}

export function installTailwind(): void {
    const orig = (globalThis as any).createElement as Function | undefined;
    if (!orig || (orig as any).__twInstalled) return;

    StyleManager.init();

    const wrapper = function (tag: any, props: any, ...children: any[]) {
        if (props) {
            const cls = props.class ?? props.className;
            if (cls && typeof cls === 'string' && props.style == null) {
                const { style, classes } = TailwindEngine.toStyles(cls);
                props = { ...props, style, class: classes.join(' ') };
            } else if (typeof cls === 'function') {
                // Reactive classes need special handling if we want modifiers,
                // but for simplicity we'll just handle inline styles for now.
                const origStyle = props.style;
                props = {
                    ...props,
                    style: () => {
                        const { style } = TailwindEngine.toStyles(cls());
                        const base = typeof origStyle === 'function' ? origStyle() : (origStyle || {});
                        return { ...base, ...style };
                    }
                };
            }
        }
        return orig(tag, props, ...children);
    } as any;

    (wrapper as any).__twInstalled = true;
    (globalThis as any).createElement = wrapper;
}

if (typeof globalThis !== 'undefined' && (globalThis as any).createElement) {
    installTailwind();
}

export { TailwindEngine, resolvedTheme as theme };
