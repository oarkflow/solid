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

        // Convert camelCase CSS properties to kebab-case
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        const body = `${cssProp}: ${value}${important};`;

        switch (modifier) {
            case 'hover': rule = `.${selector}:hover { ${body} }`; break;
            case 'focus': rule = `.${selector}:focus { ${body} }`; break;
            case 'active': rule = `.${selector}:active { ${body} }`; break;
            case 'dark': rule = `.dark .${selector}, [data-theme="dark"] .${selector}, .dark.${selector}, [data-theme="dark"].${selector}, html.dark .${selector}, html[data-theme="dark"] .${selector} { ${body} }`; break;
            case 'sm': rule = `@media (min-width: 640px) { .${selector} { ${body} } }`; break;
            case 'md': rule = `@media (min-width: 768px) { .${selector} { ${body} } }`; break;
            case 'lg': rule = `@media (min-width: 1024px) { .${selector} { ${body} } }`; break;
            case 'xl': rule = `@media (min-width: 1280px) { .${selector} { ${body} } }`; break;
            case '2xl': rule = `@media (min-width: 1536px) { .${selector} { ${body} } }`; break;
            default: rule = `.${selector} { ${body} }`;
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

        // Handle auto values for margin
        if (prefix === 'mx' && value === 'auto') {
            return { marginLeft: 'auto', marginRight: 'auto' };
        }
        if (prefix === 'my' && value === 'auto') {
            return { marginTop: 'auto', marginBottom: 'auto' };
        }
        if (prefix === 'm' && value === 'auto') {
            return { margin: 'auto' };
        }
        if (['mt', 'mr', 'mb', 'ml'].includes(prefix) && value === 'auto') {
            const propMap = { mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft' };
            return { [propMap[prefix as keyof typeof propMap]]: 'auto' };
        }

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
            // Check if it's a CSS variable color from theme
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
        if (prefix === 'border') {
            if (!value || value === '') {
                return { borderWidth: '1px', borderStyle: 'solid' };
            }
            if (!isNaN(parseInt(value))) {
                return { borderWidth: value + 'px', borderStyle: 'solid' };
            }
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
        if (prefix === 'scale-x') {
            const val = value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString();
            return { transform: `scaleX(${val})` };
        }
        if (prefix === 'scale-y') {
            const val = value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString();
            return { transform: `scaleY(${val})` };
        }
        if (prefix === 'skew-x') return { transform: `skewX(${value.startsWith('[') ? value.slice(1, -1) : value + 'deg'})` };
        if (prefix === 'skew-y') return { transform: `skewY(${value.startsWith('[') ? value.slice(1, -1) : value + 'deg'})` };

        // Animations
        if (prefix === 'animate') {
            const animations: Record<string, string> = {
                'none': 'none',
                'spin': 'spin 1s linear infinite',
                'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce': 'bounce 1s infinite'
            };
            return { animation: animations[value] || value };
        }

        // Filters
        if (prefix === 'blur') return { filter: `blur(${value.startsWith('[') ? value.slice(1, -1) : value + 'px'})` };
        if (prefix === 'brightness') return { filter: `brightness(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'contrast') return { filter: `contrast(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'grayscale') return { filter: `grayscale(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'hue-rotate') return { filter: `hue-rotate(${value.startsWith('[') ? value.slice(1, -1) : value + 'deg'})` };
        if (prefix === 'invert') return { filter: `invert(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'saturate') return { filter: `saturate(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'sepia') return { filter: `sepia(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };

        // Backdrop filters
        if (prefix === 'backdrop-blur') return { backdropFilter: `blur(${value.startsWith('[') ? value.slice(1, -1) : value + 'px'})` };
        if (prefix === 'backdrop-brightness') return { backdropFilter: `brightness(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'backdrop-contrast') return { backdropFilter: `contrast(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'backdrop-grayscale') return { backdropFilter: `grayscale(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'backdrop-hue-rotate') return { backdropFilter: `hue-rotate(${value.startsWith('[') ? value.slice(1, -1) : value + 'deg'})` };
        if (prefix === 'backdrop-invert') return { backdropFilter: `invert(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'backdrop-saturate') return { backdropFilter: `saturate(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };
        if (prefix === 'backdrop-sepia') return { backdropFilter: `sepia(${value.startsWith('[') ? value.slice(1, -1) : (parseInt(value) / 100).toString()})` };

        // Additional utilities
        if (prefix === 'object') {
            if (value === 'contain') return { objectFit: 'contain' };
            if (value === 'cover') return { objectFit: 'cover' };
            if (value === 'fill') return { objectFit: 'fill' };
            if (value === 'none') return { objectFit: 'none' };
            if (value === 'scale-down') return { objectFit: 'scale-down' };
        }
        if (prefix === 'object-position') return { objectPosition: value.replace('-', ' ') };
        
        // Scroll behavior
        if (prefix === 'scroll') {
            if (value === 'auto') return { scrollBehavior: 'auto' };
            if (value === 'smooth') return { scrollBehavior: 'smooth' };
        }

        // Grid
        if (prefix === 'grid-cols') return { gridTemplateColumns: value.startsWith('[') ? value.slice(1, -1) : `repeat(${value}, minmax(0, 1fr))` };
        if (prefix === 'grid-rows') return { gridTemplateRows: value.startsWith('[') ? value.slice(1, -1) : `repeat(${value}, minmax(0, 1fr))` };
        if (prefix === 'col-span') return { gridColumn: value === 'full' ? '1 / -1' : `span ${value} / span ${value}` };
        if (prefix === 'row-span') return { gridRow: `span ${value} / span ${value}` };
        if (prefix === 'col-start') return { gridColumnStart: value };
        if (prefix === 'col-end') return { gridColumnEnd: value };
        if (prefix === 'row-start') return { gridRowStart: value };
        if (prefix === 'row-end') return { gridRowEnd: value };

        // Flexbox
        if (prefix === 'flex') {
            if (value === '1') return { flex: '1 1 0%' };
            if (value === 'auto') return { flex: '1 1 auto' };
            if (value === 'initial') return { flex: '0 1 auto' };
            if (value === 'none') return { flex: 'none' };
            return { flex: value };
        }
        if (prefix === 'grow') return { flexGrow: value };
        if (prefix === 'shrink') return { flexShrink: value };
        if (prefix === 'order') return { order: value };

        // Aspect ratio
        if (prefix === 'aspect') {
            if (value === 'square') return { aspectRatio: '1 / 1' };
            if (value === 'video') return { aspectRatio: '16 / 9' };
            if (value.includes('/')) return { aspectRatio: value.replace('-', ' / ') };
            return { aspectRatio: value };
        }

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
        'border': { borderWidth: '1px', borderStyle: 'solid' }, 'rounded': { borderRadius: resolvedTheme.borderRadius.DEFAULT },
        'duration-75': { transitionDuration: '75ms' }, 'duration-100': { transitionDuration: '100ms' }, 'duration-150': { transitionDuration: '150ms' }, 'duration-200': { transitionDuration: '200ms' }, 'duration-300': { transitionDuration: '300ms' }, 'duration-500': { transitionDuration: '500ms' }, 'duration-700': { transitionDuration: '700ms' }, 'duration-1000': { transitionDuration: '1000ms' },
        'ease-linear': { transitionTimingFunction: 'linear' }, 'ease-in': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 1, 1)' }, 'ease-out': { transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }, 'ease-in-out': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        'transition': { transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', transitionDuration: '150ms' },
        'transition-all': { transitionProperty: 'all', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', transitionDuration: '150ms' },
        'antialiased': { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        // Common max-width utilities
        'max-w-xs': { maxWidth: '20rem' },
        'max-w-sm': { maxWidth: '24rem' },
        'max-w-md': { maxWidth: '28rem' },
        'max-w-lg': { maxWidth: '32rem' },
        'max-w-xl': { maxWidth: '36rem' },
        'max-w-2xl': { maxWidth: '42rem' },
        'max-w-3xl': { maxWidth: '48rem' },
        'max-w-4xl': { maxWidth: '56rem' },
        'max-w-5xl': { maxWidth: '64rem' },
        'max-w-6xl': { maxWidth: '72rem' },
        'max-w-7xl': { maxWidth: '80rem' },
        'max-w-full': { maxWidth: '100%' },
        'max-w-screen-sm': { maxWidth: '640px' },
        'max-w-screen-md': { maxWidth: '768px' },
        'max-w-screen-lg': { maxWidth: '1024px' },
        'max-w-screen-xl': { maxWidth: '1280px' },
        'max-w-screen-2xl': { maxWidth: '1536px' },
        // Common margin auto utilities
        'mx-auto': { marginLeft: 'auto', marginRight: 'auto' },
        'my-auto': { marginTop: 'auto', marginBottom: 'auto' },
        'm-auto': { margin: 'auto' },
        // Flex utilities
        'flex-1': { flex: '1 1 0%' },
        'flex-auto': { flex: '1 1 auto' },
        'flex-initial': { flex: '0 1 auto' },
        'flex-none': { flex: 'none' },
        // Grid utilities
        'grid-cols-1': { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' },
        'grid-cols-2': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
        'grid-cols-3': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
        'grid-cols-4': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
        'grid-cols-5': { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
        'grid-cols-6': { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' },
        'grid-cols-12': { gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' },
        'col-span-1': { gridColumn: 'span 1 / span 1' },
        'col-span-2': { gridColumn: 'span 2 / span 2' },
        'col-span-3': { gridColumn: 'span 3 / span 3' },
        'col-span-4': { gridColumn: 'span 4 / span 4' },
        'col-span-full': { gridColumn: '1 / -1' },
        // Gap utilities
        'gap-1': { gap: '0.25rem' },
        'gap-2': { gap: '0.5rem' },
        'gap-3': { gap: '0.75rem' },
        'gap-4': { gap: '1rem' },
        'gap-5': { gap: '1.25rem' },
        'gap-6': { gap: '1.5rem' },
        'gap-8': { gap: '2rem' },
        // Spacing utilities
        'space-y-1': { '> * + *': { marginTop: '0.25rem' } },
        'space-y-2': { '> * + *': { marginTop: '0.5rem' } },
        'space-y-3': { '> * + *': { marginTop: '0.75rem' } },
        'space-y-4': { '> * + *': { marginTop: '1rem' } },
        'space-y-6': { '> * + *': { marginTop: '1.5rem' } },
        'space-x-2': { '> * + *': { marginLeft: '0.5rem' } },
        'space-x-3': { '> * + *': { marginLeft: '0.75rem' } },
        'space-x-4': { '> * + *': { marginLeft: '1rem' } },
        'space-x-6': { '> * + *': { marginLeft: '1.5rem' } },
        'space-x-8': { '> * + *': { marginLeft: '2rem' } },
        // Transform utilities
        'transform': { transform: 'translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))' },
        'transform-none': { transform: 'none' },
        'transform-gpu': { transform: 'translate3d(var(--tw-translate-x), var(--tw-translate-y), 0) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))' },
        // Animation utilities
        'animate-none': { animation: 'none' },
        'animate-spin': { animation: 'spin 1s linear infinite' },
        'animate-ping': { animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
        'animate-pulse': { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
        'animate-bounce': { animation: 'bounce 1s infinite' },
        // Filter utilities
        'filter': { filter: 'var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)' },
        'filter-none': { filter: 'none' },
        'backdrop-filter': { backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
        'backdrop-filter-none': { backdropFilter: 'none' },
        // Object utilities
        'object-contain': { objectFit: 'contain' },
        'object-cover': { objectFit: 'cover' },
        'object-fill': { objectFit: 'fill' },
        'object-none': { objectFit: 'none' },
        'object-scale-down': { objectFit: 'scale-down' },
        'object-center': { objectPosition: 'center' },
        'object-top': { objectPosition: 'top' },
        'object-bottom': { objectPosition: 'bottom' },
        'object-left': { objectPosition: 'left' },
        'object-right': { objectPosition: 'right' },
        // Scroll utilities
        'scroll-auto': { scrollBehavior: 'auto' },
        'scroll-smooth': { scrollBehavior: 'smooth' },
        // Resize utilities
        'resize-none': { resize: 'none' },
        'resize-y': { resize: 'vertical' },
        'resize-x': { resize: 'horizontal' },
        'resize': { resize: 'both' },
        // Appearance utilities
        'appearance-none': { appearance: 'none' },
        // Outline utilities
        'outline-none': { outline: '2px solid transparent', outlineOffset: '2px' },
        'outline': { outlineStyle: 'solid' },
        'outline-dashed': { outlineStyle: 'dashed' },
        'outline-dotted': { outlineStyle: 'dotted' },
        'outline-double': { outlineStyle: 'double' },
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
                // Handle opacity modifiers: bg-red-500/50
                const opacityMatch = current.match(/^(.+)\/(.+)$/);
                if (opacityMatch) {
                    const [, baseClass, opacityValue] = opacityMatch;
                    const baseStyle = this.parseUtility(baseClass);
                    if (baseStyle) {
                        utilityStyle = { ...baseStyle };
                        // Apply opacity to color properties
                        for (const [prop, val] of Object.entries(utilityStyle)) {
                            if (prop === 'backgroundColor' || prop === 'color' || prop === 'borderColor') {
                                const opacity = opacityValue.startsWith('[') ? opacityValue.slice(1, -1) : (parseInt(opacityValue) / 100);
                                if (typeof val === 'string' && val.startsWith('rgb(')) {
                                    utilityStyle[prop] = val.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
                                } else if (typeof val === 'string' && val.startsWith('#')) {
                                    // Convert hex to rgba
                                    const hex = val.slice(1);
                                    const r = parseInt(hex.substr(0, 2), 16);
                                    const g = parseInt(hex.substr(2, 2), 16);
                                    const b = parseInt(hex.substr(4, 2), 16);
                                    utilityStyle[prop] = `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
                        const childRule = `.${token.replace(/:/g, '\\:')} > * + * { ${Object.entries(val as Record<string, string>).map(([p, v]) => `${p.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}; }`;
                        if (!StyleManager.cache.has(childRule)) {
                            try {
                                StyleManager.styleTag?.sheet?.insertRule(childRule, StyleManager.styleTag.sheet.cssRules.length);
                                StyleManager.cache.add(childRule);
                            } catch (e) {
                                console.warn(`[Tailwind] Failed to inject child rule: ${childRule}`, e);
                            }
                        }
                    } else {
                        StyleManager.inject(token, prop, val as string, modifier);
                    }
                }
                classes.push(token);
            } else {
                classes.push(token);
            }
        }

        return { style, classes };
    },

    parseUtility(current: string): Record<string, any> | null {
        // Handle single word utilities
        if (current === 'border') {
            return { borderWidth: '1px', borderStyle: 'solid' };
        }

        const match = current.match(/^(-?)([a-z-]+?)(?:-(.+))?$/);
        if (match) {
            const [, negative, prefix, value] = match;

            // Handle utilities without values (like 'border')
            if (!value) {
                if (prefix === 'border') {
                    return { borderWidth: '1px', borderStyle: 'solid' };
                }
                return null;
            }

            const res = this.resolveUtility(prefix, value);
            if (res) {
                const utilityStyle = { ...res };
                if (negative === '-') {
                    for (const k in utilityStyle) {
                        const v = utilityStyle[k];
                        if (typeof v === 'string') {
                            if (v.includes('rem')) utilityStyle[k] = `-${v}`;
                            else if (!isNaN(parseFloat(v))) utilityStyle[k] = `-${v}`;
                        }
                    }
                }
                return utilityStyle;
            }
        }
        return null;
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

export { TailwindEngine, resolvedTheme as theme };
