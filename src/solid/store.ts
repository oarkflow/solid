import { createEffect, createMemo, createSignal, batch, untrack, onCleanup } from './reactivity';

// ============================================================================
// Types
// ============================================================================

export type StoreOptions<T> = {
    /** Key for localStorage persistence */
    storageKey?: string;
    /** Version for migrations */
    version?: number;
    /** Migration function for version upgrades */
    migrate?: (storedState: unknown, storedVersion?: number) => T;
    /** Custom equality function */
    equals?: (prev: T, next: T) => boolean;
    /** Middleware for intercepting updates */
    middleware?: StoreMiddleware<T>[];
};

export type StoreMiddleware<T> = (
    state: T,
    next: T,
    action: string
) => T | void;

export type StoreApi<T> = {
    /** Get current state (reactive) */
    state: () => T;
    /** Set entire state */
    setState: (next: T | ((prev: T) => T)) => void;
    /** Patch state with partial update */
    patch: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void;
    /** Update nested value by path */
    update: <V>(path: Path<T>, value: V | ((prev: V) => V)) => void;
    /** Reset to initial state */
    reset: () => void;
    /** Create a derived selector */
    select: <U>(selector: (state: T) => U, equals?: (a: U, b: U) => boolean) => () => U;
    /** Subscribe to state changes */
    subscribe: (listener: (state: T) => void) => () => void;
    /** Get state snapshot (non-reactive) */
    peek: () => T;
};

// Path type for nested access
type Path<T> = T extends object
    ? {
        [K in keyof T]: K extends string | number
        ? K | `${K}.${Path<T[K]> & string}`
        : never;
    }[keyof T]
    : never;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Deep clone with structured clone or JSON fallback
 */
function cloneDeep<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    try {
        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }
    } catch {
        // Fall through to JSON method
    }

    try {
        return JSON.parse(JSON.stringify(value)) as T;
    } catch {
        // Return shallow copy as last resort
        return Array.isArray(value)
            ? ([...value] as unknown as T)
            : ({ ...value } as T);
    }
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual((a as any)[key], (b as any)[key])) return false;
    }

    return true;
}

/**
 * Parse JSON safely
 */
function safeParseJSON(value: string | null): unknown | null {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

/**
 * Get nested value by path
 */
function getByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current == null) return undefined;
        current = current[key];
    }

    return current;
}

/**
 * Set nested value by path (immutably)
 */
function setByPath<T>(obj: T, path: string, value: unknown): T {
    const keys = path.split('.');

    if (keys.length === 0) return value as T;

    const [head, ...rest] = keys;
    const isArray = Array.isArray(obj);
    const clone = isArray ? [...obj] : { ...(obj as any) };

    if (rest.length === 0) {
        clone[head as any] = value;
    } else {
        clone[head as any] = setByPath(
            clone[head as any] ?? {},
            rest.join('.'),
            value
        );
    }

    return clone as T;
}

/**
 * Deep freeze object (for immutability in dev)
 */
function deepFreeze<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) return obj;

    Object.freeze(obj);

    for (const key of Object.keys(obj)) {
        const value = (obj as any)[key];
        if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    }

    return obj;
}

// ============================================================================
// Store Creation
// ============================================================================

/**
 * Create a reactive store with fine-grained updates
 *
 * @param initial - Initial state
 * @param options - Store configuration options
 */
export function createStore<T extends object>(
    initial: T,
    options?: StoreOptions<T>
): StoreApi<T> {
    const initialSnapshot = cloneDeep(initial);
    const equals = options?.equals ?? deepEqual;
    const middleware = options?.middleware ?? [];

    // Core signal
    const [state, setSignal] = createSignal<T>(
        cloneDeep(initial),
        { equals: false } // We handle equality ourselves for fine-grained control
    );

    // Subscribers for external listeners
    const subscribers = new Set<(state: T) => void>();

    // Apply middleware chain
    const applyMiddleware = (prev: T, next: T, action: string): T => {
        let result = next;
        for (const mw of middleware) {
            const modified = mw(prev, result, action);
            if (modified !== undefined) {
                result = modified;
            }
        }
        return result;
    };

    // Core setState implementation
    const setState: StoreApi<T>['setState'] = (next) => {
        batch(() => {
            const prev = state();
            const nextState = typeof next === 'function'
                ? (next as (prev: T) => T)(prev)
                : next;

            if (equals(prev, nextState)) return;

            const finalState = applyMiddleware(prev, nextState, 'setState');
            setSignal(finalState);

            // Notify subscribers
            for (const listener of subscribers) {
                listener(finalState);
            }
        });
    };

    // Load from storage
    if (options?.storageKey && typeof localStorage !== 'undefined') {
        try {
            const raw = safeParseJSON(localStorage.getItem(options.storageKey));
            if (raw && typeof raw === 'object') {
                const stored = raw as { version?: number; state?: T };
                if (stored.state) {
                    if (options.version && stored.version !== options.version && options.migrate) {
                        setState(options.migrate(stored.state, stored.version));
                    } else {
                        setState(stored.state);
                    }
                }
            }
        } catch (e) {
            console.warn('[Store] Failed to load from storage:', e);
        }

        // Persist on changes
        createEffect(() => {
            const currentState = state();
            try {
                const payload = {
                    version: options.version,
                    state: currentState,
                    timestamp: Date.now(),
                };
                localStorage.setItem(options.storageKey!, JSON.stringify(payload));
            } catch (e) {
                console.warn('[Store] Failed to persist to storage:', e);
            }
        });
    }

    // Patch - merge partial state
    const patch: StoreApi<T>['patch'] = (partial) => {
        setState(prev => {
            const nextPatch = typeof partial === 'function' ? partial(prev) : partial;
            if (!nextPatch || typeof nextPatch !== 'object') return prev;
            return { ...prev, ...nextPatch };
        });
    };

    // Update by path
    const update: StoreApi<T>['update'] = (path, value) => {
        setState(prev => {
            const currentValue = getByPath(prev, path as string);
            const nextValue = typeof value === 'function'
                ? (value as Function)(currentValue)
                : value;
            return setByPath(prev, path as string, nextValue);
        });
    };

    // Reset to initial
    const reset: StoreApi<T>['reset'] = () => {
        setState(cloneDeep(initialSnapshot));
    };

    // Create derived selector with memoization
    const select: StoreApi<T>['select'] = <U,>(
        selector: (state: T) => U,
        selectorEquals: (a: U, b: U) => boolean = Object.is
    ) => {
        return createMemo(() => selector(state()), undefined, { equals: selectorEquals });
    };

    // Subscribe to changes
    const subscribe: StoreApi<T>['subscribe'] = (listener) => {
        subscribers.add(listener);
        return () => subscribers.delete(listener);
    };

    // Peek at state without tracking
    const peek: StoreApi<T>['peek'] = () => {
        return untrack(() => state());
    };

    return {
        state,
        setState,
        patch,
        update,
        reset,
        select,
        subscribe,
        peek,
    };
}

// ============================================================================
// Action Creators
// ============================================================================

export type ActionContext<T> = {
    get: () => T;
    set: StoreApi<T>['setState'];
    patch: StoreApi<T>['patch'];
    update: StoreApi<T>['update'];
    reset: StoreApi<T>['reset'];
};

/**
 * Create typed actions for a store
 */
export function createActions<
    T extends object,
    A extends Record<string, (...args: any[]) => any>
>(
    store: StoreApi<T>,
    factory: (ctx: ActionContext<T>) => A
): A {
    const context: ActionContext<T> = {
        get: store.state,
        set: store.setState,
        patch: store.patch,
        update: store.update,
        reset: store.reset,
    };

    return factory(context);
}

// ============================================================================
// Computed Store (Derived Store)
// ============================================================================

/**
 * Create a derived store from multiple sources
 */
export function createDerivedStore<T extends object, R>(
    stores: { [K in keyof T]: StoreApi<T[K]> },
    derive: (states: T) => R
): () => R {
    return createMemo(() => {
        const states = {} as T;
        for (const [key, store] of Object.entries(stores)) {
            states[key as keyof T] = (store as StoreApi<any>).state();
        }
        return derive(states);
    });
}

// ============================================================================
// Store Utilities
// ============================================================================

/**
 * Create a logging middleware for debugging
 */
export function createLogger<T>(name: string = 'Store'): StoreMiddleware<T> {
    return (prev, next, action) => {
        console.group(`%c${name} | ${action}`, 'color: #9E9E9E; font-weight: bold');
        console.log('%cprev state', 'color: #9E9E9E', prev);
        console.log('%cnext state', 'color: #4CAF50', next);
        console.groupEnd();
        return next;
    };
}

/**
 * Create an undo/redo middleware
 */
export function createUndoRedo<T>(maxHistory: number = 50) {
    const past: T[] = [];
    const future: T[] = [];

    const middleware: StoreMiddleware<T> = (prev, next, action) => {
        if (action !== 'undo' && action !== 'redo') {
            past.push(cloneDeep(prev));
            if (past.length > maxHistory) past.shift();
            future.length = 0;
        }
        return next;
    };

    const undo = (store: StoreApi<T>) => {
        if (past.length === 0) return;
        const prev = past.pop()!;
        future.push(cloneDeep(store.peek()));
        store.setState(prev);
    };

    const redo = (store: StoreApi<T>) => {
        if (future.length === 0) return;
        const next = future.pop()!;
        past.push(cloneDeep(store.peek()));
        store.setState(next);
    };

    return { middleware, undo, redo, canUndo: () => past.length > 0, canRedo: () => future.length > 0 };
}
