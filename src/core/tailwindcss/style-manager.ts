/**
 * Runtime Style Manager
 * Handles dynamic injection of CSS rules for modifiers and responsive utilities
 */

export const StyleManager = {
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
    },

    /**
     * Inject a child selector rule (for space-x, space-y utilities)
     */
    injectChildRule(className: string, childStyles: Record<string, string>) {
        this.init();
        if (!this.styleTag) return;

        const selector = className.replace(/:/g, '\\:');
        const childRule = `.${selector} > * + * { ${Object.entries(childStyles).map(([p, v]) =>
            `${p.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`
        ).join('; ')}; }`;

        if (!this.cache.has(childRule)) {
            try {
                this.styleTag.sheet?.insertRule(childRule, this.styleTag.sheet.cssRules.length);
                this.cache.add(childRule);
            } catch (e) {
                console.warn(`[Tailwind] Failed to inject child rule: ${childRule}`, e);
            }
        }
    }
};
