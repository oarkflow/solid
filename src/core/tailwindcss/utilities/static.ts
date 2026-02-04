/**
 * Static utility classes
 * Pre-defined classes that map to specific CSS properties
 */

import { resolvedTheme } from '../config';

export const staticUtilities: Record<string, any> = {
    // Display
    'block': { display: 'block' },
    'inline-block': { display: 'inline-block' },
    'inline': { display: 'inline' },
    'flex': { display: 'flex' },
    'inline-flex': { display: 'inline-flex' },
    'grid': { display: 'grid' },
    'inline-grid': { display: 'inline-grid' },
    'hidden': { display: 'none' },
    'contents': { display: 'contents' },
    'table': { display: 'table' },
    'table-row': { display: 'table-row' },
    'table-cell': { display: 'table-cell' },

    // Position
    'static': { position: 'static' },
    'fixed': { position: 'fixed' },
    'absolute': { position: 'absolute' },
    'relative': { position: 'relative' },
    'sticky': { position: 'sticky' },

    // Flexbox
    'flex-row': { flexDirection: 'row' },
    'flex-row-reverse': { flexDirection: 'row-reverse' },
    'flex-col': { flexDirection: 'column' },
    'flex-col-reverse': { flexDirection: 'column-reverse' },
    'flex-wrap': { flexWrap: 'wrap' },
    'flex-wrap-reverse': { flexWrap: 'wrap-reverse' },
    'flex-nowrap': { flexWrap: 'nowrap' },
    'items-start': { alignItems: 'flex-start' },
    'items-end': { alignItems: 'flex-end' },
    'items-center': { alignItems: 'center' },
    'items-baseline': { alignItems: 'baseline' },
    'items-stretch': { alignItems: 'stretch' },
    'justify-start': { justifyContent: 'flex-start' },
    'justify-end': { justifyContent: 'flex-end' },
    'justify-center': { justifyContent: 'center' },
    'justify-between': { justifyContent: 'space-between' },
    'justify-around': { justifyContent: 'space-around' },
    'justify-evenly': { justifyContent: 'space-evenly' },
    'self-auto': { alignSelf: 'auto' },
    'self-start': { alignSelf: 'flex-start' },
    'self-end': { alignSelf: 'flex-end' },
    'self-center': { alignSelf: 'center' },
    'self-stretch': { alignSelf: 'stretch' },
    'self-baseline': { alignSelf: 'baseline' },
    'place-content-center': { placeContent: 'center' },
    'place-content-start': { placeContent: 'start' },
    'place-content-end': { placeContent: 'end' },
    'place-content-between': { placeContent: 'space-between' },
    'place-content-around': { placeContent: 'space-around' },
    'place-content-evenly': { placeContent: 'space-evenly' },
    'place-content-stretch': { placeContent: 'stretch' },
    'place-items-start': { placeItems: 'start' },
    'place-items-end': { placeItems: 'end' },
    'place-items-center': { placeItems: 'center' },
    'place-items-stretch': { placeItems: 'stretch' },

    // Flex sizing
    'flex-1': { flex: '1 1 0%' },
    'flex-auto': { flex: '1 1 auto' },
    'flex-initial': { flex: '0 1 auto' },
    'flex-none': { flex: 'none' },

    // Typography
    'italic': { fontStyle: 'italic' },
    'not-italic': { fontStyle: 'normal' },
    'uppercase': { textTransform: 'uppercase' },
    'lowercase': { textTransform: 'lowercase' },
    'capitalize': { textTransform: 'capitalize' },
    'normal-case': { textTransform: 'none' },
    'underline': { textDecoration: 'underline' },
    'overline': { textDecoration: 'overline' },
    'line-through': { textDecoration: 'line-through' },
    'no-underline': { textDecoration: 'none' },
    'text-left': { textAlign: 'left' },
    'text-center': { textAlign: 'center' },
    'text-right': { textAlign: 'right' },
    'text-justify': { textAlign: 'justify' },
    'text-start': { textAlign: 'start' },
    'text-end': { textAlign: 'end' },
    'truncate': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    'text-ellipsis': { textOverflow: 'ellipsis' },
    'text-clip': { textOverflow: 'clip' },
    'whitespace-normal': { whiteSpace: 'normal' },
    'whitespace-nowrap': { whiteSpace: 'nowrap' },
    'whitespace-pre': { whiteSpace: 'pre' },
    'whitespace-pre-line': { whiteSpace: 'pre-line' },
    'whitespace-pre-wrap': { whiteSpace: 'pre-wrap' },
    'break-normal': { overflowWrap: 'normal', wordBreak: 'normal' },
    'break-words': { overflowWrap: 'break-word' },
    'break-all': { wordBreak: 'break-all' },

    // Cursor
    'cursor-auto': { cursor: 'auto' },
    'cursor-default': { cursor: 'default' },
    'cursor-pointer': { cursor: 'pointer' },
    'cursor-wait': { cursor: 'wait' },
    'cursor-text': { cursor: 'text' },
    'cursor-move': { cursor: 'move' },
    'cursor-not-allowed': { cursor: 'not-allowed' },
    'cursor-help': { cursor: 'help' },
    'cursor-progress': { cursor: 'progress' },
    'cursor-grab': { cursor: 'grab' },
    'cursor-grabbing': { cursor: 'grabbing' },

    // User Select
    'select-none': { userSelect: 'none' },
    'select-text': { userSelect: 'text' },
    'select-all': { userSelect: 'all' },
    'select-auto': { userSelect: 'auto' },

    // Pointer Events
    'pointer-events-none': { pointerEvents: 'none' },
    'pointer-events-auto': { pointerEvents: 'auto' },

    // Overflow
    'overflow-auto': { overflow: 'auto' },
    'overflow-hidden': { overflow: 'hidden' },
    'overflow-visible': { overflow: 'visible' },
    'overflow-scroll': { overflow: 'scroll' },
    'overflow-x-auto': { overflowX: 'auto' },
    'overflow-y-auto': { overflowY: 'auto' },
    'overflow-x-hidden': { overflowX: 'hidden' },
    'overflow-y-hidden': { overflowY: 'hidden' },
    'overflow-x-visible': { overflowX: 'visible' },
    'overflow-y-visible': { overflowY: 'visible' },
    'overflow-x-scroll': { overflowX: 'scroll' },
    'overflow-y-scroll': { overflowY: 'scroll' },

    // Shadows
    'shadow-sm': { '--tw-shadow': resolvedTheme.boxShadow.sm, boxShadow: 'var(--tw-shadow)' },
    'shadow': { '--tw-shadow': resolvedTheme.boxShadow.DEFAULT, boxShadow: 'var(--tw-shadow)' },
    'shadow-md': { '--tw-shadow': resolvedTheme.boxShadow.md, boxShadow: 'var(--tw-shadow)' },
    'shadow-lg': { '--tw-shadow': resolvedTheme.boxShadow.lg, boxShadow: 'var(--tw-shadow)' },
    'shadow-xl': { '--tw-shadow': resolvedTheme.boxShadow.xl, boxShadow: 'var(--tw-shadow)' },
    'shadow-2xl': { '--tw-shadow': resolvedTheme.boxShadow['2xl'], boxShadow: 'var(--tw-shadow)' },
    'shadow-inner': { '--tw-shadow': resolvedTheme.boxShadow.inner, boxShadow: 'var(--tw-shadow)' },
    'shadow-none': { '--tw-shadow': 'none', boxShadow: 'none' },

    // Border
    'border': { borderWidth: '1px', borderStyle: 'solid' },
    'border-solid': { borderStyle: 'solid' },
    'border-dashed': { borderStyle: 'dashed' },
    'border-dotted': { borderStyle: 'dotted' },
    'border-double': { borderStyle: 'double' },
    'border-none': { borderStyle: 'none' },

    // Border Radius
    'rounded': { borderRadius: resolvedTheme.borderRadius.DEFAULT },
    'rounded-none': { borderRadius: '0' },
    'rounded-sm': { borderRadius: resolvedTheme.borderRadius.sm },
    'rounded-md': { borderRadius: resolvedTheme.borderRadius.md },
    'rounded-lg': { borderRadius: resolvedTheme.borderRadius.lg },
    'rounded-xl': { borderRadius: resolvedTheme.borderRadius.xl },
    'rounded-2xl': { borderRadius: resolvedTheme.borderRadius['2xl'] },
    'rounded-3xl': { borderRadius: resolvedTheme.borderRadius['3xl'] },
    'rounded-full': { borderRadius: resolvedTheme.borderRadius.full },

    // Transitions
    'transition': {
        transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },
    'transition-none': { transitionProperty: 'none' },
    'transition-all': {
        transitionProperty: 'all',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },
    'transition-colors': {
        transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },
    'transition-opacity': {
        transitionProperty: 'opacity',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },
    'transition-shadow': {
        transitionProperty: 'box-shadow',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },
    'transition-transform': {
        transitionProperty: 'transform',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms'
    },

    // Duration
    'duration-75': { transitionDuration: '75ms' },
    'duration-100': { transitionDuration: '100ms' },
    'duration-150': { transitionDuration: '150ms' },
    'duration-200': { transitionDuration: '200ms' },
    'duration-300': { transitionDuration: '300ms' },
    'duration-500': { transitionDuration: '500ms' },
    'duration-700': { transitionDuration: '700ms' },
    'duration-1000': { transitionDuration: '1000ms' },

    // Timing Functions
    'ease-linear': { transitionTimingFunction: 'linear' },
    'ease-in': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 1, 1)' },
    'ease-out': { transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    'ease-in-out': { transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' },

    // Delays
    'delay-75': { transitionDelay: '75ms' },
    'delay-100': { transitionDelay: '100ms' },
    'delay-150': { transitionDelay: '150ms' },
    'delay-200': { transitionDelay: '200ms' },
    'delay-300': { transitionDelay: '300ms' },
    'delay-500': { transitionDelay: '500ms' },
    'delay-700': { transitionDelay: '700ms' },
    'delay-1000': { transitionDelay: '1000ms' },

    // Font smoothing
    'antialiased': { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
    'subpixel-antialiased': { WebkitFontSmoothing: 'auto', MozOsxFontSmoothing: 'auto' },

    // Max widths
    'max-w-none': { maxWidth: 'none' },
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

    // Margin auto
    'mx-auto': { marginLeft: 'auto', marginRight: 'auto' },
    'my-auto': { marginTop: 'auto', marginBottom: 'auto' },
    'm-auto': { margin: 'auto' },

    // Grid
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

    // Transform
    'transform': { transform: 'translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))' },
    'transform-none': { transform: 'none' },
    'transform-gpu': { transform: 'translate3d(var(--tw-translate-x), var(--tw-translate-y), 0) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))' },

    // Animations
    'animate-none': { animation: 'none' },
    'animate-spin': { animation: 'spin 1s linear infinite' },
    'animate-ping': { animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
    'animate-pulse': { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
    'animate-bounce': { animation: 'bounce 1s infinite' },

    // Filters
    'filter': { filter: 'var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)' },
    'filter-none': { filter: 'none' },
    'backdrop-filter': { backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-filter-none': { backdropFilter: 'none' },
    'backdrop-blur-none': { '--tw-backdrop-blur': 'blur(0)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-sm': { '--tw-backdrop-blur': 'blur(4px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur': { '--tw-backdrop-blur': 'blur(8px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-md': { '--tw-backdrop-blur': 'blur(12px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-lg': { '--tw-backdrop-blur': 'blur(16px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-xl': { '--tw-backdrop-blur': 'blur(24px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-2xl': { '--tw-backdrop-blur': 'blur(40px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },
    'backdrop-blur-3xl': { '--tw-backdrop-blur': 'blur(64px)', backdropFilter: 'var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)' },

    // Object fit
    'object-contain': { objectFit: 'contain' },
    'object-cover': { objectFit: 'cover' },
    'object-fill': { objectFit: 'fill' },
    'object-none': { objectFit: 'none' },
    'object-scale-down': { objectFit: 'scale-down' },

    // Object position
    'object-center': { objectPosition: 'center' },
    'object-top': { objectPosition: 'top' },
    'object-bottom': { objectPosition: 'bottom' },
    'object-left': { objectPosition: 'left' },
    'object-right': { objectPosition: 'right' },

    // Scroll behavior
    'scroll-auto': { scrollBehavior: 'auto' },
    'scroll-smooth': { scrollBehavior: 'smooth' },

    // Resize
    'resize-none': { resize: 'none' },
    'resize-y': { resize: 'vertical' },
    'resize-x': { resize: 'horizontal' },
    'resize': { resize: 'both' },

    // Appearance
    'appearance-none': { appearance: 'none' },

    // Outline
    'outline-none': { outline: '2px solid transparent', outlineOffset: '2px' },
    'outline': { outlineStyle: 'solid' },
    'outline-dashed': { outlineStyle: 'dashed' },
    'outline-dotted': { outlineStyle: 'dotted' },
    'outline-double': { outlineStyle: 'double' },

    // Visibility
    'visible': { visibility: 'visible' },
    'invisible': { visibility: 'hidden' },
    'sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0'
    },

    // Z-Index
    'z-0': { zIndex: '0' },
    'z-10': { zIndex: '10' },
    'z-20': { zIndex: '20' },
    'z-30': { zIndex: '30' },
    'z-40': { zIndex: '40' },
    'z-50': { zIndex: '50' },
    'z-auto': { zIndex: 'auto' },


    // Isolation
    'isolate': { isolation: 'isolate' },
    'isolation-auto': { isolation: 'auto' },

    // Mix blend mode
    'mix-blend-normal': { mixBlendMode: 'normal' },
    'mix-blend-multiply': { mixBlendMode: 'multiply' },
    'mix-blend-screen': { mixBlendMode: 'screen' },
    'mix-blend-overlay': { mixBlendMode: 'overlay' },
    'mix-blend-darken': { mixBlendMode: 'darken' },
    'mix-blend-lighten': { mixBlendMode: 'lighten' },
    'mix-blend-color-dodge': { mixBlendMode: 'color-dodge' },
    'mix-blend-color-burn': { mixBlendMode: 'color-burn' },
    'mix-blend-hard-light': { mixBlendMode: 'hard-light' },
    'mix-blend-soft-light': { mixBlendMode: 'soft-light' },
    'mix-blend-difference': { mixBlendMode: 'difference' },
    'mix-blend-exclusion': { mixBlendMode: 'exclusion' },
    'mix-blend-hue': { mixBlendMode: 'hue' },
    'mix-blend-saturation': { mixBlendMode: 'saturation' },
    'mix-blend-color': { mixBlendMode: 'color' },
    'mix-blend-luminosity': { mixBlendMode: 'luminosity' },
};
