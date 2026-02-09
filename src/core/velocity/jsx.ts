import { createEffect, onCleanup, untrack, getDevSnapshot, createRoot, createSignal, getOwner, setOwnerComponentId } from './reactivity';
import { sanitizeHTML, sanitizeUrl } from './security';

// ============================================================================
// Types
// ============================================================================

export type Props<P = {}> = P & {
    children?: any;
    class?: string;
    className?: string;
    style?: string | Partial<CSSStyleDeclaration> | Record<string, string>;
    ref?: (el: Element) => void;
    [key: string]: any;
};
export type FC<P = {}> = (props: Props<P>) => JSX.Element;



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
 * Compute Longest Increasing Subsequence indices for minimal moves.
 * Returns indices in `seq` that form the LIS.
 */
function computeLIS(seq: number[]): number[] {
    const len = seq.length;
    if (len === 0) return [];

    // Patience sorting with back-pointers
    const tails: number[] = [];  // Indices into seq
    const prev: number[] = new Array(len).fill(-1);

    for (let i = 0; i < len; i++) {
        const val = seq[i];
        if (val < 0) continue; // Skip removed items

        // Binary search for insertion point
        let lo = 0, hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (seq[tails[mid]] < val) lo = mid + 1;
            else hi = mid;
        }

        if (lo > 0) prev[i] = tails[lo - 1];
        tails[lo] = i;
    }

    // Reconstruct LIS
    const result: number[] = [];
    let idx = tails[tails.length - 1];
    while (idx !== undefined && idx >= 0) {
        result.push(idx);
        idx = prev[idx];
    }
    return result.reverse();
}

/**
 * Extract key from an item for reconciliation.
 */
function getKey(item: any): any {
    if (item instanceof Node) return (item as any)._key ?? item;
    if (item && typeof item === 'object') {
        return item._key ?? item.id ?? item.key ?? item;
    }
    return item;
}

/**
 * High-performance reconciliation algorithm for arrays of nodes.
 *
 * O(1) Fast Paths:
 * 1. Empty → items (append all)
 * 2. Items → empty (remove all)
 * 3. Same length + same items (no-op)
 * 4. Append only (new items at end)
 * 5. Prepend only (new items at start)
 * 6. Single item change
 * 7. Single swap
 *
 * O(N) Fallback: LIS-based for minimal moves
 */
export function reconcile(
    parent: Node,
    prev: Node[],
    next: any[],
    before: Node | null = null
): Node[] {
    const prevLen = prev.length;
    const nextLen = next.length;

    try {
        // ========================================
        // Fast Path 1: Empty next → remove all
        // ========================================
        if (nextLen === 0) {
            for (let i = 0; i < prevLen; i++) {
                recursiveCleanup(prev[i]);
                prev[i].parentNode?.removeChild(prev[i]);
            }
            return [];
        }

        // ========================================
        // Fast Path 2: Empty prev → append all
        // ========================================
        if (prevLen === 0) {
            const result: Node[] = [];
            for (let i = 0; i < nextLen; i++) {
                const item = next[i];
                if (item == null || item === false || item === true) continue;

                const node = item instanceof Node
                    ? item
                    : document.createTextNode(String(item));

                parent.insertBefore(node, before);
                result.push(node);
            }
            return result;
        }

        // ========================================
        // Fast Path 3: Same arrays (reference equality)
        // ========================================
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

        // ========================================
        // Fast Path 4: Append only (new items at end)
        // ========================================
        if (nextLen > prevLen) {
            let isAppend = true;
            for (let i = 0; i < prevLen; i++) {
                if (getKey(prev[i]) !== getKey(next[i])) {
                    isAppend = false;
                    break;
                }
            }
            if (isAppend) {
                const result = [...prev];
                for (let i = prevLen; i < nextLen; i++) {
                    const item = next[i];
                    if (item == null || item === false || item === true) continue;

                    const node = item instanceof Node
                        ? item
                        : document.createTextNode(String(item));
                    (node as any)._key = getKey(item);

                    parent.insertBefore(node, before);
                    result.push(node);
                }
                return result;
            }
        }

        // ========================================
        // Fast Path 5: Prepend only (new items at start)
        // ========================================
        if (nextLen > prevLen) {
            const diff = nextLen - prevLen;
            let isPrepend = true;
            for (let i = 0; i < prevLen; i++) {
                if (getKey(prev[i]) !== getKey(next[i + diff])) {
                    isPrepend = false;
                    break;
                }
            }
            if (isPrepend) {
                const result: Node[] = [];
                const firstPrev = prev[0] || before;
                for (let i = 0; i < diff; i++) {
                    const item = next[i];
                    if (item == null || item === false || item === true) continue;

                    const node = item instanceof Node
                        ? item
                        : document.createTextNode(String(item));
                    (node as any)._key = getKey(item);

                    parent.insertBefore(node, firstPrev);
                    result.push(node);
                }
                return [...result, ...prev];
            }
        }

        // ========================================
        // Fast Path 6: Single item removal
        // ========================================
        if (prevLen === nextLen + 1) {
            let mismatch = -1;
            for (let i = 0, j = 0; i < prevLen; i++) {
                if (j < nextLen && getKey(prev[i]) === getKey(next[j])) {
                    j++;
                } else if (mismatch === -1) {
                    mismatch = i;
                } else {
                    mismatch = -2; // Multiple mismatches
                    break;
                }
            }
            if (mismatch >= 0 && mismatch !== -2) {
                recursiveCleanup(prev[mismatch]);
                prev[mismatch].parentNode?.removeChild(prev[mismatch]);
                return prev.filter((_, i) => i !== mismatch);
            }
        }

        // ========================================
        // Fast Path 7: Single swap detection
        // ========================================
        if (prevLen === nextLen && prevLen >= 2) {
            let swapI = -1, swapJ = -1;
            for (let i = 0; i < prevLen; i++) {
                if (getKey(prev[i]) !== getKey(next[i])) {
                    if (swapI === -1) swapI = i;
                    else if (swapJ === -1) swapJ = i;
                    else { swapI = -2; break; } // More than 2 differences
                }
            }
            if (swapI >= 0 && swapJ >= 0 &&
                getKey(prev[swapI]) === getKey(next[swapJ]) &&
                getKey(prev[swapJ]) === getKey(next[swapI])) {
                // Swap nodes in DOM
                const nodeI = prev[swapI];
                const nodeJ = prev[swapJ];
                const nextI = nodeI.nextSibling;
                const nextJ = nodeJ.nextSibling;

                if (nextI === nodeJ) {
                    parent.insertBefore(nodeJ, nodeI);
                } else if (nextJ === nodeI) {
                    parent.insertBefore(nodeI, nodeJ);
                } else {
                    parent.insertBefore(nodeJ, nextI);
                    parent.insertBefore(nodeI, nextJ);
                }

                const result = [...prev];
                result[swapI] = nodeJ;
                result[swapJ] = nodeI;
                return result;
            }
        }

        // ========================================
        // Full Reconciliation with LIS
        // ========================================

        // Build prev key → (node, index) map
        const prevMap = new Map<any, { node: Node; index: number }>();
        for (let i = 0; i < prevLen; i++) {
            const key = getKey(prev[i]);
            prevMap.set(key, { node: prev[i], index: i });
        }

        // Build next nodes array and track which prev indices are used
        const result: Node[] = new Array(nextLen);
        const newIndices: number[] = new Array(nextLen).fill(-1);
        const toAdd: { index: number; node: Node }[] = [];

        for (let i = 0; i < nextLen; i++) {
            const item = next[i];
            if (item == null || item === false || item === true) {
                result[i] = null as any; // Will be filtered
                continue;
            }

            const key = getKey(item);
            const entry = prevMap.get(key);

            if (entry) {
                result[i] = entry.node;
                newIndices[i] = entry.index;
                prevMap.delete(key);
            } else {
                const node = item instanceof Node
                    ? item
                    : document.createTextNode(String(item));
                (node as any)._key = key;
                result[i] = node;
                toAdd.push({ index: i, node });
            }
        }

        // Remove unused prev nodes
        for (const { node } of prevMap.values()) {
            recursiveCleanup(node);
            node.parentNode?.removeChild(node);
        }

        // Compute LIS of newIndices for stable positions
        const lis = computeLIS(newIndices);
        const lisSet = new Set(lis);

        // Move nodes not in LIS + insert new nodes
        // Process backwards for correct insertion order
        let nextSibling = before;
        for (let i = nextLen - 1; i >= 0; i--) {
            const node = result[i];
            if (!node) continue;

            const shouldMove = !lisSet.has(i) || toAdd.some(a => a.index === i);

            if (shouldMove || node.nextSibling !== nextSibling || node.parentNode !== parent) {
                parent.insertBefore(node, nextSibling);
            }
            nextSibling = node;
        }

        // Filter out nulls
        return result.filter(Boolean);

    } catch (e) {
        console.error('[Velocity] Reconciliation error:', e);
        return prev;
    }
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
            // Set componentId on owner (avoids globalThis pollution)
            setOwnerComponentId(instanceId);
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
                // Clear componentId when exiting component (parent's will be used via owner chain)
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

        // Cleanup removed items properly
        for (const key of cache.keys()) {
            if (!nextKeys.has(key)) {
                const entry = cache.get(key);
                if (entry && entry.node) {
                    recursiveCleanup(entry.node as Node);
                }
                cache.delete(key);
            }
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
// Error Boundary - Enhanced for Phase 4
// ============================================================================

export interface RetryConfig {
    maxRetries?: number;         // Max automatic retries (default: 0)
    retryDelay?: number;         // Delay between retries in ms (default: 1000)
    exponentialBackoff?: boolean; // Double delay on each retry (default: false)
}

export interface ErrorInfo {
    componentStack?: string;
    retryCount: number;
}

export interface ErrorBoundaryProps {
    fallback: JSX.Element | ((error: Error, retry: RetryInterface) => JSX.Element);
    children: JSX.Element;
    onError?: (error: Error, info: ErrorInfo) => void;
    retryConfig?: RetryConfig;
    resetKeys?: (() => any)[];   // Reset when any of these change
}

export interface RetryInterface {
    reset: () => void;
    retry: () => void;
    retryCount: number;
    isRetrying: boolean;
}

export function ErrorBoundary(props: ErrorBoundaryProps): JSX.Element {
    const [error, setError] = createSignal<Error | null>(null);
    const [key, setKey] = createSignal(0);
    const [retryCount, setRetryCount] = createSignal(0);
    const [isRetrying, setIsRetrying] = createSignal(false);

    const config = props.retryConfig || {};
    const maxRetries = config.maxRetries ?? 0;
    const baseDelay = config.retryDelay ?? 1000;
    const useBackoff = config.exponentialBackoff ?? false;

    const reset = () => {
        setError(null);
        setRetryCount(0);
        setIsRetrying(false);
        setKey(k => k + 1);
    };

    const retry = () => {
        const count = retryCount();
        if (count < maxRetries) {
            setIsRetrying(true);
            const delay = useBackoff ? baseDelay * Math.pow(2, count) : baseDelay;

            setTimeout(() => {
                setRetryCount(c => c + 1);
                setError(null);
                setIsRetrying(false);
                setKey(k => k + 1);
            }, delay);
        } else {
            reset();
        }
    };

    // Watch resetKeys for changes
    if (props.resetKeys && props.resetKeys.length > 0) {
        createEffect(() => {
            // Track all resetKeys
            for (const key of props.resetKeys!) {
                key();
            }
            // Reset on any change (skip initial run)
            if (error()) {
                reset();
            }
        });
    }

    const retryInterface: RetryInterface = {
        reset,
        retry,
        get retryCount() { return retryCount(); },
        get isRetrying() { return isRetrying(); }
    };

    return (() => {
        key(); // Track key for re-renders
        const err = error();

        if (err) {
            if (typeof props.fallback === 'function') {
                return (props.fallback as (error: Error, retry: RetryInterface) => JSX.Element)(err, retryInterface);
            }
            return props.fallback;
        }

        try {
            return props.children;
        } catch (e) {
            const normalizedError = e instanceof Error ? e : new Error(String(e));
            setError(normalizedError);

            // Notify via callback
            props.onError?.(normalizedError, {
                retryCount: retryCount(),
            });

            // Auto-retry if configured
            if (retryCount() < maxRetries) {
                retry();
            }

            if (typeof props.fallback === 'function') {
                return (props.fallback as (error: Error, retry: RetryInterface) => JSX.Element)(normalizedError, retryInterface);
            }
            return props.fallback;
        }
    }) as unknown as JSX.Element;
}

// ============================================================================
// Suspense Boundary - Enhanced for Phase 4
// ============================================================================

export interface SuspenseProps {
    fallback: JSX.Element;
    children: JSX.Element;
    onPending?: () => void;      // Called when entering pending state
    onResolve?: () => void;      // Called when resolved
    timeout?: number;            // Delay before showing fallback (ms)
    maxDuration?: number;        // Max time to wait before showing fallback (ms)
}

export function Suspense(props: SuspenseProps): JSX.Element {
    const [pending, setPending] = createSignal(false);
    const [showFallback, setShowFallback] = createSignal(false);
    const [error, setError] = createSignal<Error | null>(null);

    let pendingCount = 0;
    let timeoutId: any = null;
    let maxDurationId: any = null;
    let pendingStartTime = 0;

    const suspenseContext = {
        begin: () => {
            pendingCount++;
            if (pendingCount === 1) {
                pendingStartTime = Date.now();
                setPending(true);
                props.onPending?.();

                // Handle timeout delay for showing fallback
                if (props.timeout && props.timeout > 0) {
                    timeoutId = setTimeout(() => {
                        if (pendingCount > 0) {
                            setShowFallback(true);
                        }
                    }, props.timeout);
                } else {
                    setShowFallback(true);
                }

                // Handle max duration
                if (props.maxDuration) {
                    maxDurationId = setTimeout(() => {
                        if (pendingCount > 0) {
                            setShowFallback(true);
                        }
                    }, props.maxDuration);
                }
            }
        },
        end: (err?: Error | null) => {
            pendingCount--;
            if (err) setError(err);
            if (pendingCount <= 0) {
                pendingCount = 0;
                setPending(false);
                setShowFallback(false);

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (maxDurationId) {
                    clearTimeout(maxDurationId);
                    maxDurationId = null;
                }

                if (!err) {
                    props.onResolve?.();
                }
            }
        }
    };

    onCleanup(() => {
        if (timeoutId) clearTimeout(timeoutId);
        if (maxDurationId) clearTimeout(maxDurationId);
    });

    return createRoot((dispose) => {
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

            // Only show fallback if pending AND (no timeout OR showFallback is true)
            if (pending() && showFallback()) {
                return props.fallback;
            }

            return props.children;
        }) as unknown as JSX.Element;
    });
}

// ============================================================================
// Safe HTML Rendering
// ============================================================================



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

    const setHtml = (html: string) => {
        el.innerHTML = shouldSanitize ? sanitizeHTML(html) : html;
    };

    // Initial render
    setHtml(getHtml());

    // Reactive updates if html is a function
    if (typeof props.html === 'function') {
        createEffect(() => {
            setHtml(getHtml());
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
            [elemName: string]: Props<any>;
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
