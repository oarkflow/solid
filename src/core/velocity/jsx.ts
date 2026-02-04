import { createEffect, onCleanup, untrack, getDevSnapshot, createRoot, createSignal, getOwner } from './reactivity';

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

// Dev registry for DOM nodes (use strong map for dev inspection)
let elementIdCounter = 0;
const elementRegistry = new Map<Element, { id: number; tag: string; isSvg: boolean; events: Set<string>; propsSet: number; updates: number; lastUpdated?: number; createdAt: number; componentId?: number }>();
const elementIdMap = new Map<number, Element>();

// Component instance registry
let componentInstanceCounter = 0;
const componentInstances = new Map<number, { id: number; name: string; func?: Function; renders: number; updates: number; lastRender?: number; parentId?: number | null; children: Set<number> }>();
const componentStack: number[] = [];

function markUpdated(el: Element) {
    try {
        const meta = elementRegistry.get(el);
        if (!meta) return;
        meta.updates = (meta.updates || 0) + 1;
        meta.lastUpdated = Date.now();
        if (meta.componentId != null) {
            const comp = componentInstances.get(meta.componentId);
            if (comp) {
                comp.updates = (comp.updates || 0) + 1;
            }
        }
    } catch (e) {
        // silent
    }
}

// Component helpers
export function getComponentSnapshot() {
    const arr: Array<{ id: number; name: string; renders: number; updates: number; lastRender?: number; parentId?: number | null; children: number[] }> = [];
    for (const meta of componentInstances.values()) {
        arr.push({ id: meta.id, name: meta.name, renders: meta.renders, updates: meta.updates, lastRender: meta.lastRender, parentId: meta.parentId ?? null, children: [...meta.children] });
    }
    return arr;
}

export function getComponentsTree() {
    // Build nested tree nodes
    const byId = new Map<number, any>();
    for (const meta of componentInstances.values()) {
        byId.set(meta.id, { ...meta, children: [] as any[] });
    }
    const roots: any[] = [];
    for (const meta of componentInstances.values()) {
        const node = byId.get(meta.id);
        if (meta.parentId == null) {
            roots.push(node);
        } else {
            const parent = byId.get(meta.parentId);
            if (parent) parent.children.push(node);
            else roots.push(node);
        }
    }
    return roots;
}

export function getComponentInstances() {
    return [...componentInstances.values()];
}

export function getDOMSnapshot() {
    const snapshot: Array<{ id: number; tag: string; isSvg: boolean; events: string[]; propsSet: number; updates: number; lastUpdated?: number; createdAt: number; componentId?: number }> = [];
    for (const [el, meta] of elementRegistry.entries()) {
        snapshot.push({ id: meta.id, tag: meta.tag, isSvg: meta.isSvg, events: [...meta.events], propsSet: meta.propsSet, updates: meta.updates, lastUpdated: meta.lastUpdated, createdAt: meta.createdAt, componentId: meta.componentId });
    }
    return snapshot;
}

export function getElementById(id: number): Element | undefined {
    return elementIdMap.get(id);
}

export function getElementsForComponent(componentId: number) {
    const ids: number[] = [];
    for (const [el, meta] of elementRegistry.entries()) {
        if (meta.componentId === componentId) ids.push(meta.id);
    }
    return ids;
}

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
// Reconciliation
// ============================================================================

/**
 * Optimized reconciliation algorithm for arrays of nodes
 */
export function reconcile(
    parent: Node,
    prev: Node[],
    next: any[],
    before: Node | null = null
): Node[] {
    const nextNodes: Node[] = [];
    const prevLen = prev.length;
    const nextLen = next.length;

    // Fast path for empty lists
    if (nextLen === 0) {
        for (let i = 0; i < prevLen; i++) {
            const n = prev[i];
            recursiveCleanup(n);
            n.parentNode?.removeChild(n);
        }
        return [];
    }

    // Fast path for same content (reference equality)
    if (prevLen === nextLen) {
        let identical = true;
        for (let i = 0; i < nextLen; i++) {
            if (prev[i] !== next[i]) {
                identical = false;
                break;
            }
        }
        if (identical) return prev;
    }

    // Map-based reconciliation (Keyed)
    const prevMap = new Map<any, Node>();
    for (const p of prev) {
        // Use a unique property if available, or the node itself
        const key = (p as any)._key ?? p;
        prevMap.set(key, p);
    }

    const nextSet = new Set();
    const result: Node[] = [];

    let currentBefore = before;

    // Phase 1: Create/Reuse nodes and place them in the correct order
    // Note: This is an O(N) simplified reconciler. Robust ones do move optimization.
    for (let i = nextLen - 1; i >= 0; i--) {
        const item = next[i];
        let node: Node;

        const key = (item && typeof item === 'object') ? (item.id ?? item.key ?? item) : item;

        if (prevMap.has(key)) {
            node = prevMap.get(key)!;
            prevMap.delete(key);
        } else if (item instanceof Node) {
            node = item;
        } else if (item == null || item === false || item === true) {
            continue;
        } else {
            node = document.createTextNode(String(item));
        }

        if (node.nextSibling !== currentBefore || node.parentNode !== parent) {
            parent.insertBefore(node, currentBefore);
        }

        result.push(node);
        nextSet.add(node);
        currentBefore = node;
    }

    // Phase 2: Cleanup nodes that are no longer present
    for (const [key, node] of prevMap.entries()) {
        recursiveCleanup(node);
        node.parentNode?.removeChild(node);
    }

    return result.reverse();
}

function recursiveCleanup(node: Node) {
    // Call dispose if attached (for component roots)
    if ((node as any)._dispose && typeof (node as any)._dispose === 'function') {
        try {
            (node as any)._dispose();
        } catch (e) {
            console.error('[Velocity] Error during component disposal:', e);
        }
        delete (node as any)._dispose;
    }

    if (node instanceof Element) {
        const meta = elementRegistry.get(node);
        if (meta) {
            elementIdMap.delete(meta.id);
            elementRegistry.delete(node);
        }
    }

    // Recursively clean children (both Element and DocumentFragment can have children)
    if (node instanceof Element || node instanceof DocumentFragment) {
        let child = node.firstChild;
        while (child) {
            recursiveCleanup(child);
            child = child.nextSibling;
        }
    }
}

// ============================================================================
// Child Insertion
// ============================================================================

function normalizeNodes(value: any): Node[] {
    if (value == null || value === false || value === true) return [];
    if (Array.isArray(value)) {
        return value.flat(Infinity).flatMap(normalizeNodes);
    }
    if (value instanceof DocumentFragment) {
        return Array.from(value.childNodes).flatMap(normalizeNodes);
    }
    if (value instanceof Node) return [value];
    if (typeof value === 'function') return [value]; // Keep functions for insertChild effects
    return [document.createTextNode(String(value))];
}

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
        if (child instanceof DocumentFragment) {
            const nodes = Array.from(child.childNodes);
            parent.insertBefore(child, before);
            return nodes[0] || null; // Simplified return
        }
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
        const startMarker = document.createComment('start');
        const endMarker = document.createComment('end');
        parent.insertBefore(startMarker, before);
        parent.insertBefore(endMarker, before);

        let nodes: Node[] = [];

        createEffect(() => {
            const value = child();
            const nextValue = normalizeNodes(value);
            nodes = reconcile(parent, nodes, nextValue, endMarker);

            // Mark updated
            for (const n of nodes) {
                if (n && n.nodeType === 1) markUpdated(n as Element);
            }
        });

        return startMarker;
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
    // If this is a function component, create an instance entry & manage stack
    if (typeof tag === 'function') {
        const instanceId = ++componentInstanceCounter;
        const name = (tag as any).displayName || (tag as any).name || 'Anonymous';
        const parentId = componentStack.length ? componentStack[componentStack.length - 1] : null;
        const meta: any = { id: instanceId, name, func: tag, renders: 0, updates: 0, lastRender: undefined, parentId, children: new Set<number>() };
        componentInstances.set(instanceId, meta);
        if (parentId != null) {
            const pm = componentInstances.get(parentId) as any;
            if (pm) pm.children.add(instanceId);
        }

        // push instance, run component, and pop
        const renderComponent = () => {
            componentStack.push(instanceId);
            const prev = (globalThis as any).__CURRENT_COMPONENT_ID;
            (globalThis as any).__CURRENT_COMPONENT_ID = instanceId;
            try {
                const liveName = (tag as any).displayName || (tag as any).name || meta.name;
                if (liveName && meta.name !== liveName) {
                    meta.name = liveName;
                }
                meta.renders++;
                meta.lastRender = Date.now();
                const res = untrack(() => (tag as any)({ ...(props ?? {}), children: children.length === 1 ? children[0] : children.length ? children : props?.children }));
                return res as JSX.Element;
            } finally {
                componentStack.pop();
                (globalThis as any).__CURRENT_COMPONENT_ID = prev;
            }
        };

        let disposeFunc: (() => void) | undefined;
        const result = createRoot((dispose) => {
            disposeFunc = dispose;
            return renderComponent();
        });

        // Attach dispose function to the result node(s)
        if (result instanceof Node) {
            if (result instanceof DocumentFragment) {
                // If it's a fragment, we attach it to the first child or all children?
                // Reconciler usually tracks by the nodes themselves.
                // We'll attach it to a property on all top-level nodes of the fragment
                // so no matter which one the reconciler sees, it can trigger cleanup.
                const nodes = Array.from(result.childNodes);
                for (const n of nodes) {
                    (n as any)._dispose = disposeFunc;
                }
            } else {
                (result as any)._dispose = disposeFunc;
            }
        }

        // If a component returns a function, it's a reactive template.
        // We wrap it in a 'display: contents' div to ensure it's treated as a stable Node
        // by the reconciler, preventing stringification when used in arrays.
        if (typeof result === 'function') {
            return createElement('div', {
                style: { display: 'contents' },
                'data-velocity-component': name
            }, result);
        }

        return result;
    }

    // Create element
    const isSvg = SVG_TAGS.has(tag);
    const el = isSvg
        ? document.createElementNS(SVG_NS, tag)
        : document.createElement(tag);

    // Register for dev inspection
    const id = ++elementIdCounter;
    const compId = componentStack.length ? componentStack[componentStack.length - 1] : undefined;
    elementRegistry.set(el, { id, tag, isSvg, events: new Set(), propsSet: 0, updates: 0, lastUpdated: undefined, createdAt: Date.now(), componentId: compId });
    elementIdMap.set(id, el);

    // Set props
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (key === 'children') continue;

            // Event handler
            if (key.startsWith('on') && key[2] >= 'A' && key[2] <= 'Z') {
                const event = key.slice(2).toLowerCase();
                el.addEventListener(event, value);
                // dev: register event
                const meta = elementRegistry.get(el);
                if (meta) {
                    meta.events.add(event);
                    meta.updates++;
                    meta.lastUpdated = Date.now();
                    markUpdated(el);
                }
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
                const fn = value; // Capture the function
                createEffect(() => {
                    const result = fn();
                    setAttr(el, key, result, isSvg);
                    const meta = elementRegistry.get(el);
                    if (meta) {
                        meta.propsSet++;
                        meta.updates++;
                        meta.lastUpdated = Date.now();
                        markUpdated(el);
                    }
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
    const getWhen = typeof props.when === 'function' ? (props.when as () => T) : () => props.when as T;
    return (() => {
        const val = getWhen();
        return val ? (typeof props.children === 'function' ? (props.children as (item: T) => JSX.Element)(val) : props.children) : (props.fallback ?? null);
    }) as unknown as JSX.Element;
}

export function For<T>(props: {
    each: T[] | (() => T[]);
    fallback?: JSX.Element;
    children: (item: T, index: () => number) => JSX.Element;
}): JSX.Element {
    const getEach = typeof props.each === 'function' ? (props.each as () => T[]) : () => props.each as T[];
    const cache = new Map<any, { node: Node; setIndex: (i: number) => void }>();

    onCleanup(() => {
        for (const entry of cache.values()) {
            recursiveCleanup(entry.node);
        }
        cache.clear();
    });

    return (() => {
        const currentItems = getEach() || [];
        if (currentItems.length === 0) return props.fallback ?? null;

        const nextKeys = new Set();
        const result = currentItems.map((item, i) => {
            const key = (item && typeof item === 'object') ? ((item as any).id ?? (item as any).key ?? item) : item;
            nextKeys.add(key);
            let entry = cache.get(key);
            if (!entry) {
                const [index, setIndex] = createSignal(i);
                const node = untrack(() => props.children(item, index));
                (node as any)._key = key;
                entry = { node, setIndex };
                cache.set(key, entry);
            } else {
                entry.setIndex(i);
            }
            return entry.node;
        });

        for (const key of cache.keys()) {
            if (!nextKeys.has(key)) cache.delete(key);
        }

        return result;
    }) as unknown as JSX.Element;
}

export function Switch(props: {
    fallback?: JSX.Element;
    children: JSX.Element | JSX.Element[];
}): JSX.Element {
    return (() => {
        const children = Array.isArray(props.children) ? props.children : [props.children];
        for (const child of children) {
            if (child && (child as any).__when?.()) return child;
        }
        return props.fallback ?? null;
    }) as unknown as JSX.Element;
}

export function Match<T>(props: {
    when: T | (() => T);
    children: JSX.Element | ((item: T) => JSX.Element);
}): JSX.Element {
    const getWhen = typeof props.when === 'function' ? (props.when as () => T) : () => props.when as T;
    const result = typeof props.children === 'function'
        ? () => { const val = getWhen(); return val ? (props.children as (item: T) => JSX.Element)(val) : null; }
        : props.children;

    if (result && typeof result === 'object') (result as any).__when = getWhen;
    return result as JSX.Element;
}

// ============================================================================
// Lazy Loading
// ============================================================================

export function lazy<T extends FC<any>>(
    loader: () => Promise<{ default: T }>
): T {
    let cached: T | null = null;
    let pending = false;
    let suspenseBoundary: { begin: () => void; end: (error?: Error | null) => void } | undefined;
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<Error | null>(null);

    const LazyComponent: FC<any> = (props) => {
        if (!pending && !cached) {
            pending = true;
            setLoading(true);
            const owner = getOwner() as { suspense?: { begin: () => void; end: (error?: Error | null) => void } } | null;
            suspenseBoundary = owner?.suspense;
            suspenseBoundary?.begin();
            loader()
                .then(module => {
                    cached = module.default;
                    const loadedName = (cached as any).displayName || (cached as any).name;
                    if (loadedName) {
                        (LazyComponent as any).displayName = loadedName;
                        for (const meta of componentInstances.values()) {
                            if (meta.func === LazyComponent) {
                                meta.name = loadedName;
                            }
                        }
                    }
                    setLoading(false);
                    suspenseBoundary?.end();
                })
                .catch(err => {
                    const normalized = err instanceof Error ? err : new Error(String(err));
                    setError(normalized);
                    setLoading(false);
                    suspenseBoundary?.end(normalized);
                });
        }

        return createElement('div', { style: { display: 'contents' } }, () => {
            const err = error();
            if (err) {
                console.error(err)
                return createElement(
                    'div',
                    { class: 'card', style: { padding: '20px', color: '#ef4444' } },
                    `Error loading component: ${err.message}`
                );
            }

            if (loading() || !cached) {
                return null;
            }

            return cached(props);
        });
    };

    return LazyComponent as T;
}

export function Portal(props: {
    mount?: Element | string;
    children?: any;
}): JSX.Element {
    const target = typeof props.mount === 'string'
        ? document.querySelector(props.mount)
        : props.mount ?? document.body;

    if (!target) {
        return document.createComment('portal-error') as unknown as JSX.Element;
    }

    const container = document.createElement('div');
    container.style.display = 'contents';

    insertChild(container, props.children);

    target.appendChild(container);

    onCleanup(() => container.remove());

    return document.createComment('portal') as unknown as JSX.Element;
}

// ============================================================================
// Error Boundary
// ============================================================================

export function ErrorBoundary(props: {
    fallback: JSX.Element | ((error: Error, reset: () => void) => JSX.Element);
    children: JSX.Element;
}): JSX.Element {
    const [error, setError] = createSignal<Error | null>(null);
    const [key, setKey] = createSignal(0);

    const reset = () => {
        setError(null);
        setKey(k => k + 1);
    };

    // Create error handler within effect scope
    createEffect(() => {
        // Access key to re-run when reset is called
        key();
    });

    return (() => {
        const err = error();
        if (err) {
            if (typeof props.fallback === 'function') {
                return (props.fallback as (error: Error, reset: () => void) => JSX.Element)(err, reset);
            }
            return props.fallback;
        }

        try {
            return props.children;
        } catch (e) {
            const normalizedError = e instanceof Error ? e : new Error(String(e));
            setError(normalizedError);
            if (typeof props.fallback === 'function') {
                return (props.fallback as (error: Error, reset: () => void) => JSX.Element)(normalizedError, reset);
            }
            return props.fallback;
        }
    }) as unknown as JSX.Element;
}

// ============================================================================
// Suspense Boundary
// ============================================================================

export function Suspense(props: {
    fallback: JSX.Element;
    children: JSX.Element;
}): JSX.Element {
    const [pending, setPending] = createSignal(false);
    const [error, setError] = createSignal<Error | null>(null);

    // Track pending async operations
    let pendingCount = 0;

    const suspenseContext = {
        begin: () => {
            pendingCount++;
            setPending(true);
        },
        end: (err?: Error | null) => {
            pendingCount--;
            if (err) setError(err);
            if (pendingCount <= 0) {
                pendingCount = 0;
                setPending(false);
            }
        }
    };

    return createRoot((dispose) => {
        // Inject suspense context for children
        const owner = getOwner() as any;
        if (owner) {
            owner.suspense = suspenseContext;
        }

        onCleanup(dispose);

        return (() => {
            const err = error();
            if (err) {
                return createElement('div', {
                    style: { padding: '1rem', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '0.5rem' }
                }, `Error: ${err.message}`);
            }

            if (pending()) {
                return props.fallback;
            }

            return props.children;
        }) as unknown as JSX.Element;
    });
}

// ============================================================================
// Safe HTML Rendering
// ============================================================================

const DANGEROUS_TAGS_SET = new Set(['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'style', 'link', 'meta', 'base']);
const DANGEROUS_ATTRS_SET = new Set(['formaction', 'xlink:href']);

function inlineSanitizeHTML(html: string): string {
    if (!html || typeof DOMParser === 'undefined') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function clean(node: Node) {
        if (node.nodeType === 1) {
            const el = node as Element;
            const tag = el.tagName.toLowerCase();
            if (DANGEROUS_TAGS_SET.has(tag)) {
                el.remove();
                return;
            }
            const attrs = el.attributes;
            for (let i = attrs.length - 1; i >= 0; i--) {
                const attr = attrs[i];
                const name = attr.name.toLowerCase();
                const val = attr.value.toLowerCase();
                if (name.startsWith('on') || DANGEROUS_ATTRS_SET.has(name) || val.includes('javascript:')) {
                    el.removeAttribute(attr.name);
                }
            }
        }
        node.childNodes.forEach(clean);
    }

    clean(doc.body);
    return doc.body.innerHTML;
}

/**
 * Render HTML string safely with optional sanitization
 *
 * @example
 * // Sanitized (default) - strips dangerous content
 * <Html html="<p>Hello</p><script>alert('xss')</script>" />
 *
 * // Unsafe - renders HTML as-is (use with trusted content only!)
 * <Html html={trustedContent} sanitize={false} />
 */
export function Html(props: {
    html: string | (() => string);
    /** Sanitize HTML to prevent XSS (default: true) */
    sanitize?: boolean;
    /** Element tag to use (default: 'div') */
    as?: string;
    /** Additional props to pass to the element */
    class?: string;
    style?: Record<string, any> | string;
}): JSX.Element {
    const tag = props.as || 'div';
    const shouldSanitize = props.sanitize !== false;
    const getHtml = typeof props.html === 'function' ? props.html : () => props.html as string;

    const el = document.createElement(tag);

    if (props.class) el.className = props.class;
    if (props.style) {
        if (typeof props.style === 'string') {
            el.style.cssText = props.style;
        } else {
            Object.assign(el.style, props.style);
        }
    }

    // Initial render
    const rawHtml = getHtml();
    el.innerHTML = shouldSanitize ? inlineSanitizeHTML(rawHtml) : rawHtml;

    // Reactive updates if html is a function
    if (typeof props.html === 'function') {
        createEffect(() => {
            const html = getHtml();
            el.innerHTML = shouldSanitize ? inlineSanitizeHTML(html) : html;
        });
    }

    return el as unknown as JSX.Element;
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
// JSX Types & Global Setup
// ============================================================================

declare global {
    namespace JSX {
        interface Element extends Node { (props?: any): any; }
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

// Make createElement and Fragment available globally for JSX
if (typeof globalThis !== 'undefined') {
    (globalThis as any).createElement = createElement;
    (globalThis as any).Fragment = Fragment;
}
