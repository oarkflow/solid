import { createEffect, createMemo, createSignal } from './reactivity';

export type StoreOptions<T> = {
    storageKey?: string;
    version?: number;
    migrate?: (storedState: unknown, storedVersion?: number) => T;
};

export type StoreApi<T> = {
    state: () => T;
    setState: (next: T | ((prev: T) => T)) => void;
    patch: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void;
    update: (path: Array<string | number>, value: unknown) => void;
    reset: () => void;
    select: <U>(selector: (state: T) => U) => () => U;
};

function safeParseJSON(value: string | null): unknown | null {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function cloneState<T>(value: T): T {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

function setIn(target: any, path: Array<string | number>, value: unknown): any {
    if (path.length === 0) return value;

    const [head, ...rest] = path;
    const isArray = Array.isArray(target);
    const clone = isArray ? target.slice() : { ...(target ?? {}) };
    const existing = clone?.[head as any];
    const nextValue = setIn(existing, rest, value);

    clone[head as any] = nextValue;
    return clone;
}

export function createStore<T extends object>(initial: T, options?: StoreOptions<T>): StoreApi<T> {
    const initialSnapshot = cloneState(initial);
    const [state, setSignal] = createSignal<T>(initialSnapshot);

    const setState: StoreApi<T>['setState'] = next => {
        if (typeof next === 'function') {
            const updater = next as (prev: T) => T;
            setSignal(updater(state()));
        } else {
            setSignal(next);
        }
    };

    if (options?.storageKey) {
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

        createEffect(() => {
            const payload = {
                version: options.version,
                state: state(),
            };
            localStorage.setItem(options.storageKey!, JSON.stringify(payload));
        });
    }

    const patch = (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
        setState(prev => {
            const nextPatch = typeof partial === 'function' ? partial(prev) : partial;
            if (!nextPatch || typeof nextPatch !== 'object') return prev;
            return { ...prev, ...nextPatch } as T;
        });
    };

    const update = (path: Array<string | number>, value: unknown) => {
        setState(prev => setIn(prev, path, value));
    };

    const reset = () => setState(cloneState(initialSnapshot));

    const select = <U,>(selector: (current: T) => U) => createMemo(() => selector(state()));

    return {
        state,
        setState,
        patch,
        update,
        reset,
        select,
    };
}

export function createActions<T extends object, A extends Record<string, (...args: any[]) => any>>(
    store: StoreApi<T>,
    factory: (set: StoreApi<T>['setState'], get: StoreApi<T>['state'], patch: StoreApi<T>['patch']) => A
): A {
    return factory(store.setState, store.state, store.patch);
}
