import { createEffect, onCleanup, untrack } from './reactivity';

// ============================================================================
// Types
// ============================================================================

export type Props = Record<string, any> & { children?: any };
export type FC<P = {}> = (props: P & Props) => JSX.Element;

// ============================================================================
// Security
// ============================================================================

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

function sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';
    if (DANGEROUS_PROTOCOLS.test(url.trim().toLowerCase())) {
        return 'about:blank';
    }
    return url;
}

// ============================================================================
// DOM Helpers
// ============================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
    'svg', 'animate', 'circle', 'clipPath', 'defs', 'desc', 'ellipse',
    'g', 'image', 'line', 'linearGradient', 'mask', 'path', 'pattern',
    'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'text',
    'tspan', 'use', 'foreignObject',
]);

function setAttr(el: Element, key: string, value: any, isSvg: boolean) {
    if (key === 'className' || key === 'class') {
        el.setAttribute('class', String(value ?? ''));
    } else if (key === 'style') {
        if (typeof value === 'object' && value) {
            const style = (el as HTMLElement).style;
            for (const [k, v] of Object.entries(value)) {
                if (k.startsWith('--')) {
                    style.setProperty(k, v as string);
                } else {
                    (style as any)[k] = v ?? '';
                }
            }
        } else if (typeof value === 'string') {
            (el as HTMLElement).style.cssText = value;
        }
    } else if (key === 'value' && 'value' in el) {
        (el as HTMLInputElement).value = value ?? '';
    } else if (key === 'checked' && 'checked' in el) {
        (el as HTMLInputElement).checked = Boolean(value);
    } else if (key === 'disabled' && 'disabled' in el) {
        (el as HTMLInputElement).disabled = Boolean(value);
    } else if (key === 'ref' && typeof value === 'function') {
        value(el);
    } else if (key === 'href' || key === 'src') {
        el.setAttribute(key, sanitizeUrl(String(value ?? '')));
    } else if (key.startsWith('data-') || key.startsWith('aria-') || isSvg) {
        if (value == null || value === false) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, String(value === true ? '' : value));
        }
    } else if (key in el && !isSvg) {
        try {
            (el as any)[key] = value;
        } catch {
            el.setAttribute(key, String(value ?? ''));
        }
    } else {
        if (value == null || value === false) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, String(value));
        }
    }
}

// ============================================================================
// Child Insertion
// ============================================================================

function insertChild(parent: Node, child: any, before: Node | null = null): Node | null {
    if (child == null || child === false || child === true) {
        return null;
    }

    if (typeof child === 'string' || typeof child === 'number') {
        const text = document.createTextNode(String(child));
        parent.insertBefore(text, before);
        return text;
    }

    if (child instanceof Node) {
        parent.insertBefore(child, before);
        return child;
    }

    if (Array.isArray(child)) {
        const frag = document.createDocumentFragment();
        for (const c of child.flat(Infinity)) {
            insertChild(frag, c);
        }
        parent.insertBefore(frag, before);
        return null;
    }

    // Reactive child (function)
    if (typeof child === 'function') {
        const marker = document.createComment('');
        parent.insertBefore(marker, before);

        let nodes: Node[] = [];

        createEffect(() => {
            // Remove old nodes
            for (const n of nodes) {
                n.parentNode?.removeChild(n);
            }
            nodes = [];

            // Get new value
            const value = child();

            if (value == null || value === false || value === true) {
                return;
            }

            if (typeof value === 'string' || typeof value === 'number') {
                const text = document.createTextNode(String(value));
                parent.insertBefore(text, marker.nextSibling);
                nodes.push(text);
            } else if (value instanceof Node) {
                parent.insertBefore(value, marker.nextSibling);
                nodes.push(value);
            } else if (Array.isArray(value)) {
                const flat = value.flat(Infinity);
                let ref: Node | null = marker.nextSibling;
                for (const v of flat) {
                    if (v == null || v === false || v === true) continue;
                    if (v instanceof Node) {
                        parent.insertBefore(v, ref);
                        nodes.push(v);
                    } else {
                        const text = document.createTextNode(String(v));
                        parent.insertBefore(text, ref);
                        nodes.push(text);
                    }
                }
            }
        });

        return marker;
    }

    return null;
}

// ============================================================================
// createElement (JSX Factory)
// ============================================================================

export function createElement(
    tag: string | FC,
    props: Props | null,
    ...children: any[]
): JSX.Element {
    // Function component
    if (typeof tag === 'function') {
        return untrack(() => tag({
            ...props,
            children: children.length === 1 ? children[0] : children.length ? children : props?.children,
        }));
    }

    // Create element
    const isSvg = SVG_TAGS.has(tag);
    const el = isSvg
        ? document.createElementNS(SVG_NS, tag)
        : document.createElement(tag);

    // Set props
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (key === 'children') continue;

            // Event handler
            if (key.startsWith('on') && key[2] >= 'A' && key[2] <= 'Z') {
                const event = key.slice(2).toLowerCase();
                el.addEventListener(event, value);
                continue;
            }

            // classList object
            if (key === 'classList' && typeof value === 'object') {
                for (const [cls, active] of Object.entries(value)) {
                    if (typeof active === 'function') {
                        createEffect(() => {
                            el.classList.toggle(cls, Boolean(active()));
                        });
                    } else {
                        el.classList.toggle(cls, Boolean(active));
                    }
                }
                continue;
            }

            // Reactive prop
            if (typeof value === 'function' && key !== 'ref') {
                createEffect(() => {
                    setAttr(el, key, value(), isSvg);
                });
                continue;
            }

            // Static prop
            setAttr(el, key, value, isSvg);
        }
    }

    // Add children
    const allChildren = children.length > 0
        ? children
        : props?.children != null
            ? Array.isArray(props.children) ? props.children : [props.children]
            : [];

    for (const child of allChildren.flat(Infinity)) {
        insertChild(el, child);
    }

    return el as unknown as JSX.Element;
}

// ============================================================================
// Fragment
// ============================================================================

export function Fragment(props: { children?: any }): JSX.Element {
    const frag = document.createDocumentFragment();
    if (props.children) {
        const children = Array.isArray(props.children) ? props.children : [props.children];
        for (const child of children.flat(Infinity)) {
            insertChild(frag, child);
        }
    }
    return frag as unknown as JSX.Element;
}

// ============================================================================
// Control Flow
// ============================================================================

export function Show<T>(props: {
    when: T | (() => T);
    fallback?: JSX.Element;
    children: JSX.Element | ((item: T) => JSX.Element);
}): JSX.Element {
    const getWhen = typeof props.when === 'function'
        ? props.when as () => T
        : () => props.when as T;

    return (() => {
        const val = getWhen();
        if (val) {
            return typeof props.children === 'function'
                ? (props.children as (item: T) => JSX.Element)(val)
                : props.children;
        }
        return props.fallback ?? null;
    }) as unknown as JSX.Element;
}

export function For<T>(props: {
    each: T[] | (() => T[]);
    fallback?: JSX.Element;
    children: (item: T, index: () => number) => JSX.Element;
}): JSX.Element {
    const getEach = typeof props.each === 'function'
        ? props.each as () => T[]
        : () => props.each as T[];

    return (() => {
        const items = getEach() || [];
        if (items.length === 0) return props.fallback ?? null;
        return items.map((item, i) => props.children(item, () => i));
    }) as unknown as JSX.Element;
}

export function Switch(props: {
    fallback?: JSX.Element;
    children: JSX.Element | JSX.Element[];
}): JSX.Element {
    return (() => {
        const children = Array.isArray(props.children) ? props.children : [props.children];
        for (const child of children) {
            if (child && (child as any).__when?.()) {
                return child;
            }
        }
        return props.fallback ?? null;
    }) as unknown as JSX.Element;
}

export function Match<T>(props: {
    when: T | (() => T);
    children: JSX.Element | ((item: T) => JSX.Element);
}): JSX.Element {
    const getWhen = typeof props.when === 'function'
        ? props.when as () => T
        : () => props.when as T;

    const result = typeof props.children === 'function'
        ? () => {
            const val = getWhen();
            return val ? (props.children as (item: T) => JSX.Element)(val) : null;
        }
        : props.children;

    if (typeof result === 'object' && result) {
        (result as any).__when = getWhen;
    }

    return result as JSX.Element;
}

export function Portal(props: {
    mount?: Element | string;
    children?: JSX.Element;
}): JSX.Element {
    const target = typeof props.mount === 'string'
        ? document.querySelector(props.mount)
        : props.mount ?? document.body;

    if (!target) {
        return document.createComment('portal-error') as unknown as JSX.Element;
    }

    const container = document.createElement('div');
    container.style.display = 'contents';

    if (props.children instanceof Node) {
        container.appendChild(props.children);
    }

    target.appendChild(container);

    onCleanup(() => container.remove());

    return document.createComment('portal') as unknown as JSX.Element;
}

// ============================================================================
// Render
// ============================================================================

export function render(
    component: JSX.Element | (() => JSX.Element),
    container: Element | string
) {
    const target = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!target) {
        throw new Error(`Container not found: ${container}`);
    }

    target.innerHTML = '';

    const el = typeof component === 'function' ? component() : component;
    if (el instanceof Node) {
        target.appendChild(el);
    }

    return () => { target.innerHTML = ''; };
}

// ============================================================================
// JSX Types
// ============================================================================

declare global {
    namespace JSX {
        interface Element extends Node { }
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}

export type { JSX };
