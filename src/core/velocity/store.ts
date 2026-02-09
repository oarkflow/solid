import { batch, getListener, createSignal } from './reactivity';

const $RAW = Symbol('store-raw');
const $PROXY = Symbol('store-proxy');
const $ITERATE = Symbol('iterate');

// Cache for proxy wrappers to maintain referential identity
const proxyCache = new WeakMap<object, any>();

// Node cache to store reactive signals for each object property
// Key: Raw Object -> Map<Property, Signal>
const nodeCache = new WeakMap<object, Map<string | symbol, { read: () => void, write: (v: any) => void }>>();

function getNodes(target: object) {
    let nodes = nodeCache.get(target);
    if (!nodes) {
        nodes = new Map();
        nodeCache.set(target, nodes);
    }
    return nodes;
}

function getNode(target: object, property: string | symbol) {
    const nodes = getNodes(target);
    let node = nodes.get(property);
    if (!node) {
        // Create signal for property
        const [read, write] = createSignal(Reflect.get(target, property), { name: String(property) });
        node = { read, write };
        nodes.set(property, node);
    }
    return node;
}

function wrap<T extends object>(value: T): T {
    if (value && (value as any)[$PROXY]) return value;
    if (!isWrappable(value)) return value;

    let proxy = proxyCache.get(value);
    if (proxy) return proxy;

    proxy = new Proxy(value, proxyTraps);
    proxyCache.set(value, proxy);
    return proxy;
}

function isWrappable(obj: any) {
    return obj != null && typeof obj === 'object' &&
        (Object.getPrototypeOf(obj) === Object.prototype || Array.isArray(obj));
}

const proxyTraps: ProxyHandler<any> = {
    get(target, property, receiver) {
        if (property === $RAW) return target;
        if (property === $PROXY) return receiver;

        // 1. Dependency Tracking
        if (getListener()) {
            const node = getNode(target, property);
            node.read();
        }

        const value = Reflect.get(target, property, receiver);

        // 2. Deep Reactivity (Recursive Wrapping)
        if (property !== 'prototype' && isWrappable(value)) {
            return wrap(value);
        }

        return value;
    },

    set(target, property, value, receiver) {
        console.warn('Set operation on store proxy is not recommended. Use setStore instead.');
        return Reflect.set(target, property, value, receiver);
    },

    deleteProperty(target, property) {
        console.warn('Delete operation on store proxy is not recommended. Use setStore instead.');
        return Reflect.deleteProperty(target, property);
    },

    ownKeys(target) {
        if (getListener()) {
            const node = getNode(target, $ITERATE);
            node.read();
        }
        return Reflect.ownKeys(target);
    }
};

export function createStore<T extends object>(
    initState: T = {} as T
): [T, (path: any, ...args: any[]) => void] {
    const unwrapped = unwrap(initState);
    const wrapped = wrap(unwrapped);

    function setStore(...args: any[]) {
        batch(() => {
            const len = args.length;
            if (len === 0) return;

            let current = unwrapped;
            let i = 0;

            // Traverse path
            for (; i < len - 2; i++) {
                current = (current as any)[args[i]];
                if (!current || typeof current !== 'object') return; // Invalid path
                current = unwrap(current); // Ensure we work on raw objects
            }

            const key = args[len - 2];
            const value = args[len - 1];

            if (typeof key === 'function') {
                // Root update or produce?
                // Not supporting setStore(fn) for now, standard API is setStore(key, val)
                return;
            }

            // Apply update
            const prev = (current as any)[key];

            let next = value;
            if (typeof value === 'function') {
                next = value(prev);
            }

            applyUpdate(current, key, next);
        });
    }

    return [wrapped, setStore];
}

// Mutable proxy traps for produce()
const mutableTraps: ProxyHandler<any> = {
    get(target, property, receiver) {
        if (property === $RAW) return target;
        const value = Reflect.get(target, property, receiver);
        if (isWrappable(value)) {
            // Return mutable proxy for nested objects
            return new Proxy(value, mutableTraps);
        }
        return value;
    },
    set(target, property, value, receiver) {
        const prev = target[property];
        if (prev !== value) {
            target[property] = value;
            // Trigger updates immediately
            notifyUpdate(target, property, value);
        }
        return true;
    },
    deleteProperty(target, property) {
        const has = Reflect.has(target, property);
        if (has) {
            Reflect.deleteProperty(target, property);
            notifyUpdate(target, property, undefined);
        }
        return true;
    }
};

function notifyUpdate(target: any, property: string | symbol, value: any) {
    const nodes = getNodes(target);
    const node = nodes.get(property);
    if (node) node.write(value);

    if (Array.isArray(target) && property === 'length') {
        const iterNode = nodes.get($ITERATE);
        if (iterNode) iterNode.write(value);
    }
}

function applyUpdate(target: any, property: string | symbol, next: any) {
    const prev = target[property];
    if (prev !== next) {
        target[property] = next;
        notifyUpdate(target, property, next);
    }
}

export function unwrap<T>(item: T): T {
    return (item && (item as any)[$RAW]) || item;
}

export function produce<T>(fn: (state: T) => void): (state: T) => T {
    return (state: T) => {
        // Use mutable proxy to capture writes
        const proxy = new Proxy(state, mutableTraps);
        fn(proxy);
        return state; // Return original state (mutated)
    };
}

export function reconcile<T>(value: T | ((state: T) => T), options: { key?: string | null; merge?: boolean } = {}): (state: T) => T {
    return (state: T) => {
        const v = typeof value === 'function' ? (value as Function)(state) : value;
        const target = unwrap(state);

        if (Array.isArray(target) && Array.isArray(v)) {
            if (target.length !== v.length) {
                target.length = v.length;
                notifyUpdate(target, 'length', v.length);
            }
            for (let i = 0; i < v.length; i++) {
                if (target[i] !== v[i]) {
                    target[i] = v[i];
                    notifyUpdate(target, String(i), v[i]);
                }
            }
            return target as unknown as T;
        }

        if (typeof target === 'object' && target !== null && typeof v === 'object' && v !== null) {
            const keys = new Set([...Object.keys(target), ...Object.keys(v)]);
            for (const key of keys) {
                if ((target as any)[key] !== (v as any)[key]) {
                    (target as any)[key] = (v as any)[key];
                    notifyUpdate(target, key, (v as any)[key]);
                }
            }
            return target as unknown as T;
        }

        return v;
    };
}
