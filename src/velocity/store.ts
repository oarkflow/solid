import { createEffect, createMemo, createSignal, batch, untrack, onCleanup } from './reactivity';
import { createStorage } from './storage';

// ============================================================================
// Types
// ============================================================================

export type StoreOptions<T> = {
    /** Key for secure storage persistence */
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

function getByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current == null) return undefined;
        current = current[key];
    }

    return current;
}

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

// ============================================================================
// Store Creation
// ============================================================================

export function createStore<T extends object>(
    initial: T,
    options?: StoreOptions<T>
): StoreApi<T> {
    const initialSnapshot = cloneDeep(initial);
    const equals = options?.equals ?? deepEqual;
    const middleware = options?.middleware ?? [];

    const [state, setSignal] = createSignal<T>(
        cloneDeep(initial),
        { equals: false }
    );

    const subscribers = new Set<(state: T) => void>();

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

    const setState: StoreApi<T>['setState'] = (next) => {
        batch(() => {
            const prev = state();
            const nextState = typeof next === 'function'
                ? (next as (prev: T) => T)(prev)
                : next;

            if (equals(prev, nextState)) return;

            const finalState = applyMiddleware(prev, nextState, 'setState');
            setSignal(finalState);

            for (const listener of subscribers) {
                listener(finalState);
            }
        });
    };

    // Load from storage
    if (options?.storageKey) {
        const storage = createStorage<{ version?: number; state?: T } | null>({
            key: options.storageKey,
            encrypt: true,
            encryptionKey: 'default-key-change-in-production',
            defaultValue: null
        });

        try {
            const stored = storage.get();
            if (stored && typeof stored === 'object') {
                const data = stored as { version?: number; state?: T };
                if (data.state) {
                    if (options.version && data.version !== options.version && options.migrate) {
                        setState(options.migrate(data.state, data.version));
                    } else {
                        setState(data.state);
                    }
                }
            }
        } catch (e) {
            console.warn('[Store] Failed to load from storage:', e);
        }

        createEffect(() => {
            const currentState = state();
            try {
                const payload = {
                    version: options.version,
                    state: currentState,
                    timestamp: Date.now(),
                };
                storage.set(payload);
            } catch (e) {
                console.warn('[Store] Failed to persist to storage:', e);
            }
        });
    }

    const patch: StoreApi<T>['patch'] = (partial) => {
        setState(prev => {
            const nextPatch = typeof partial === 'function' ? partial(prev) : partial;
            if (!nextPatch || typeof nextPatch !== 'object') return prev;
            return { ...prev, ...nextPatch };
        });
    };

    const update: StoreApi<T>['update'] = (path, value) => {
        setState(prev => {
            const currentValue = getByPath(prev, path as string);
            const nextValue = typeof value === 'function'
                ? (value as Function)(currentValue)
                : value;
            return setByPath(prev, path as string, nextValue);
        });
    };

    const reset: StoreApi<T>['reset'] = () => {
        setState(cloneDeep(initialSnapshot));
    };

    const select: StoreApi<T>['select'] = <U,>(
        selector: (state: T) => U,
        selectorEquals: (a: U, b: U) => boolean = Object.is
    ) => {
        return createMemo(() => selector(state()), undefined, { equals: selectorEquals });
    };

    const subscribe: StoreApi<T>['subscribe'] = (listener) => {
        subscribers.add(listener);
        return () => subscribers.delete(listener);
    };

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

export type ActionContext<T> = {
    get: () => T;
    set: StoreApi<T>['setState'];
    patch: StoreApi<T>['patch'];
    update: StoreApi<T>['update'];
    reset: StoreApi<T>['reset'];
};

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

export function createLogger<T>(name: string = 'Store'): StoreMiddleware<T> {
    return (prev, next, action) => {
        console.group(`%c${name} | ${action}`, 'color: #9E9E9E; font-weight: bold');
        console.log('%cprev state', 'color: #9E9E9E', prev);
        console.log('%cnext state', 'color: #4CAF50', next);
        console.groupEnd();
        return next;
    };
}

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
