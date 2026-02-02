/**
 * Fine-Grained Reactivity System
 *
 * Simple, working implementation with:
 * - Automatic dependency tracking
 * - Synchronous updates for immediate feedback
 * - Proper cleanup and disposal
 */

// ============================================================================
// Global State
// ============================================================================

type Effect = {
    execute: () => void;
    dependencies: Set<Set<Effect>>;
    cleanups: (() => void)[];
    owner: Owner | null;
};

type Owner = {
    parent: Owner | null;
    cleanups: (() => void)[];
    errorHandlers: Set<(error: Error) => void>;
    effects: Set<Effect>;
    suspense?: SuspenseBoundary;
    transition?: TransitionTuple;
};

type SuspenseState = { pending: boolean; error: Error | null };
type SuspenseBoundary = {
    begin: () => void;
    end: (error?: Error | null) => void;
};

type TransitionTuple = [() => boolean, (fn: () => void) => void];

let currentEffect: Effect | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let pendingEffects: Set<Effect> = new Set();

// ============================================================================
// Devtools instrumentation
// ============================================================================

type DevEffectMeta = { id: number; runs: number; lastRun?: number; name?: string };
type DevSignalMeta = { id: number; reads: number; writes: number; name?: string; getValue?: () => any };

const devState = {
    enabled: false,
    effectCounter: 0,
    signalCounter: 0,
    effects: new WeakMap<Effect, DevEffectMeta>(),
    signals: new WeakMap<Set<Effect>, DevSignalMeta>(),
};

// Strong registries for snapshotting (only populated when devtools enabled)
const devEffectsRegistry = new Map<Effect, DevEffectMeta>();
const devSignalsRegistry = new Map<Set<Effect>, DevSignalMeta>();

// Component -> signals/effects mapping
const devComponentSignals = new Map<number, Set<number>>();
const devComponentEffects = new Map<number, Set<number>>();

// Effect -> signals mapping and effect ownership
const devEffectSignals = new Map<number, Set<number>>();
const devEffectOwner = new Map<number, number | undefined>();


function createOwner(parent: Owner | null): Owner {
    return {
        parent,
        cleanups: [],
        errorHandlers: new Set(),
        effects: new Set(),
        suspense: parent?.suspense,
        transition: undefined,
    };
}

function stopEffect(effect: Effect) {
    for (const cleanup of effect.cleanups) {
        try { cleanup(); } catch (error) { console.error(error); }
    }
    effect.cleanups = [];
    for (const deps of effect.dependencies) {
        deps.delete(effect);
    }
    effect.dependencies.clear();
}

function disposeOwner(owner: Owner) {
    owner.effects.forEach(stopEffect);
    owner.effects.clear();
    for (const cleanup of owner.cleanups.splice(0)) {
        try { cleanup(); } catch (error) { console.error(error); }
    }
    owner.errorHandlers.clear();
    owner.suspense = undefined;
    owner.transition = undefined;
}

function normalizeError(error: unknown): Error {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    try {
        return new Error(JSON.stringify(error));
    } catch {
        return new Error('Unknown error');
    }
}

function handleError(error: unknown, owner: Owner | null) {
    const err = normalizeError(error);
    let cursor: Owner | null = owner;
    while (cursor) {
        if (cursor.errorHandlers.size) {
            cursor.errorHandlers.forEach(handler => {
                try { handler(err); } catch (handlerError) { console.error(handlerError); }
            });
            return;
        }
        cursor = cursor.parent;
    }
    throw err;
}


export function enableDevtools() {
    devState.enabled = true;
}

export function disableDevtools() {
    devState.enabled = false;
}

export function getDevSnapshot() {
    const effects: Array<{ id: number; runs: number; lastRun?: number; signals?: number[]; owner?: number | undefined; name?: string }> = [];
    for (const meta of devEffectsRegistry.values()) {
        effects.push({ id: meta.id, runs: meta.runs, lastRun: meta.lastRun, signals: [...(devEffectSignals.get(meta.id) ?? [])], owner: devEffectOwner.get(meta.id), name: meta.name });
    }

    const signals: Array<{ id: number; name?: string; reads: number; writes: number; value?: any }> = [];
    for (const meta of devSignalsRegistry.values()) {
        let current: any = undefined;
        try { current = meta.getValue ? meta.getValue() : undefined; } catch { }
        signals.push({ id: meta.id, name: meta.name, reads: meta.reads, writes: meta.writes, value: current });
    }

    // Component mappings (signals/effects)
    const components: Array<{ id: number; signals: number[]; effects: number[] }> = [];
    const compIds = new Set<number>([...devComponentSignals.keys(), ...devComponentEffects.keys()]);
    for (const compId of compIds) {
        components.push({ id: compId, signals: [...(devComponentSignals.get(compId) ?? [])], effects: [...(devComponentEffects.get(compId) ?? [])] });
    }

    return {
        enabled: devState.enabled,
        effectCounter: devState.effectCounter,
        signalCounter: devState.signalCounter,
        pendingEffects: pendingEffects.size,
        batchDepth,
        effects,
        signals,
        components,
    };
}

/**
 * Return lists of signal/effect ids associated with a component
 */
export function getComponentDeps(componentId: number) {
    return {
        signals: [...(devComponentSignals.get(componentId) ?? [])],
        effects: [...(devComponentEffects.get(componentId) ?? [])],
    };
}

// ============================================================================
// Core Primitives
// ============================================================================

/**
 * Creates a reactive signal
 */
export function createSignal<T>(
    initialValue: T,
    options?: { equals?: false | ((prev: T, next: T) => boolean); name?: string }
): [() => T, (value: T | ((prev: T) => T)) => void] {
    let value = initialValue;
    const subscribers = new Set<Effect>();

    // Register signal metadata for devtools
    const signalMeta: DevSignalMeta = { id: ++devState.signalCounter, reads: 0, writes: 0, name: options?.name, getValue: () => value };
    devState.signals.set(subscribers, signalMeta);
    devSignalsRegistry.set(subscribers, signalMeta);

    const equals = options?.equals === false
        ? () => false
        : options?.equals ?? Object.is;

    const read = (): T => {
        // Track this signal as a dependency of the current effect
        if (currentEffect) {
            subscribers.add(currentEffect);
            currentEffect.dependencies.add(subscribers);
        }
        if (devState.enabled) {
            const meta = devState.signals.get(subscribers);
            if (meta) meta.reads++;

            // Attribute read to current effect (if any)
            if (currentEffect) {
                const effMeta = devState.effects.get(currentEffect) || devEffectsRegistry.get(currentEffect);
                if (effMeta) {
                    let set = devEffectSignals.get(effMeta.id);
                    if (!set) {
                        set = new Set();
                        devEffectSignals.set(effMeta.id, set);
                    }
                    if (meta) {
                        set.add(meta.id);

                        // If effect is owned by a component, attach signal to component as well
                        const owner = devEffectOwner.get(effMeta.id);
                        if (owner != null) {
                            let cs = devComponentSignals.get(owner);
                            if (!cs) {
                                cs = new Set();
                                devComponentSignals.set(owner, cs);
                            }
                            cs.add(meta.id);
                        }
                    }
                }
            } else {
                // If there is a current component executing directly, map component -> signal
                const compId = (globalThis as any).__CURRENT_COMPONENT_ID as number | undefined;
                if (compId != null && devSignalsRegistry.has(subscribers)) {
                    const sigMeta = devSignalsRegistry.get(subscribers)!;
                    let set = devComponentSignals.get(compId);
                    if (!set) {
                        set = new Set();
                        devComponentSignals.set(compId, set);
                    }
                    set.add(sigMeta.id);
                }
            }
        }
        return value;
    };

    const write = (nextValue: T | ((prev: T) => T)): void => {
        const newValue = typeof nextValue === 'function'
            ? (nextValue as (prev: T) => T)(value)
            : nextValue;

        // Skip if values are equal
        if (equals(value, newValue)) {
            return;
        }

        value = newValue;

        if (devState.enabled) {
            const meta = devState.signals.get(subscribers);
            if (meta) meta.writes++;
        }

        // Notify all subscribers
        if (batchDepth > 0) {
            // Batched: queue effects
            for (const effect of subscribers) {
                pendingEffects.add(effect);
            }
        } else {
            // Immediate: run effects synchronously
            const effects = [...subscribers];
            for (const effect of effects) {
                runEffect(effect);
            }
        }
    };

    return [read, write];
}

/**
 * Run an effect, cleaning up first
 */
function runEffect(effect: Effect) {
    // Dev: record run
    const devMeta = devState.effects.get(effect) || devEffectsRegistry.get(effect);
    if (devMeta) {
        devMeta.runs++;
        devMeta.lastRun = Date.now();

        // If a component is executing now, attribute this effect to it
        const compId = (globalThis as any).__CURRENT_COMPONENT_ID as number | undefined;
        if (compId != null) {
            let set = devComponentEffects.get(compId);
            if (!set) {
                set = new Set();
                devComponentEffects.set(compId, set);
            }
            set.add(devMeta.id);
        }
    }

    // Run cleanups
    for (const cleanup of effect.cleanups) {
        try { cleanup(); } catch (e) { console.error(e); }
    }
    effect.cleanups = [];

    // Remove from all dependency sets
    for (const deps of effect.dependencies) {
        deps.delete(effect);
    }
    effect.dependencies.clear();

    // Run the effect
    const prevEffect = currentEffect;
    const prevOwner = currentOwner;
    currentEffect = effect;
    currentOwner = effect.owner ?? prevOwner;
    try {
        effect.execute();
    } catch (error) {
        try {
            handleError(error, effect.owner ?? prevOwner ?? null);
        } catch (unhandled) {
            throw unhandled;
        }
    } finally {
        currentEffect = prevEffect;
        currentOwner = prevOwner;
    }
}

/**
 * Creates a reactive effect
 */
export function createEffect(fn: () => void, options?: { name?: string }): void {
    const effect: Effect = {
        execute: fn,
        dependencies: new Set(),
        cleanups: [],
        owner: currentOwner,
    };

    if (currentOwner) {
        currentOwner.effects.add(effect);
    }

    // Dev meta and ownership
    const meta: DevEffectMeta = { id: ++devState.effectCounter, runs: 0, name: options?.name ?? fn.name };
    devState.effects.set(effect, meta);
    devEffectsRegistry.set(effect, meta);

    // If a component is currently executing, mark this effect as owned by it
    const compId = (globalThis as any).__CURRENT_COMPONENT_ID as number | undefined;
    if (compId != null) {
        devEffectOwner.set(meta.id, compId);
        let set = devComponentEffects.get(compId);
        if (!set) {
            set = new Set();
            devComponentEffects.set(compId, set);
        }
        set.add(meta.id);
    }

    // Ensure there is an entry for effect->signals
    devEffectSignals.set(meta.id, new Set());

    // Run immediately
    runEffect(effect);
}

/**
 * Creates a memoized computation
 */
export function createMemo<T>(
    fn: () => T,
    initialValue?: T,
    options?: { equals?: false | ((prev: T, next: T) => boolean) }
): () => T {
    const [value, setValue] = createSignal<T>(initialValue as T, options);

    createEffect(() => {
        setValue(fn());
    });

    return value;
}

/**
 * Batch multiple updates
 */
export function batch<T>(fn: () => T): T {
    batchDepth++;
    try {
        return fn();
    } finally {
        batchDepth--;
        if (batchDepth === 0) {
            const effects = [...pendingEffects];
            pendingEffects.clear();
            for (const effect of effects) {
                runEffect(effect);
            }
        }
    }
}

/**
 * Register cleanup for current effect
 */
export function onCleanup(fn: () => void): void {
    if (currentEffect) {
        currentEffect.cleanups.push(fn);
    } else if (currentOwner) {
        currentOwner.cleanups.push(fn);
    }
}

export function onError(handler: (error: Error) => void): () => void {
    const owner = currentOwner;
    if (!owner) {
        throw new Error('onError must be used within a reactive owner');
    }
    owner.errorHandlers.add(handler);
    const dispose = () => owner.errorHandlers.delete(handler);
    onCleanup(dispose);
    return dispose;
}

/**
 * Run code without tracking
 */
export function untrack<T>(fn: () => T): T {
    const prev = currentEffect;
    currentEffect = null;
    try {
        return fn();
    } finally {
        currentEffect = prev;
    }
}

/**
 * Run code on mount (deferred)
 */
export function onMount(fn: () => void | (() => void)): void {
    createEffect(() => {
        queueMicrotask(() => {
            const cleanup = fn();
            if (typeof cleanup === 'function') {
                onCleanup(cleanup);
            }
        });
    });
}

/**
 * Explicit dependency tracking
 */
export function on<S, U>(
    deps: (() => S) | (() => S)[],
    fn: (value: S, prev: S | undefined) => U,
    options?: { defer?: boolean }
): () => U | undefined {
    const sources = Array.isArray(deps) ? deps : [deps];
    let prevValues: S[] | undefined;
    let result: U | undefined;

    createEffect(() => {
        const values = sources.map(s => s()) as S[];

        if (options?.defer && !prevValues) {
            prevValues = values;
            return;
        }

        const input = Array.isArray(deps) ? values : values[0];
        const prev = Array.isArray(deps) ? prevValues : prevValues?.[0];

        untrack(() => {
            result = fn(input as S, prev as S | undefined);
        });

        prevValues = values;
    });

    return () => result;
}

// ============================================================================
// Error Boundaries
// ============================================================================

export function createErrorBoundary(options?: { onError?: (error: Error) => void }) {
    const owner = currentOwner;
    if (!owner) {
        throw new Error('createErrorBoundary must be used within a reactive owner');
    }
    const [error, setError] = createSignal<Error | null>(null, { equals: false });

    const dispose = onError(err => {
        setError(err);
        options?.onError?.(err);
    });

    const runInsideOwner = <T>(fn: () => T) => {
        if (owner) {
            return runWithOwner(owner, fn);
        }
        return fn();
    };

    const reset = (cb?: () => void) => {
        setError(null);
        if (cb) {
            runInsideOwner(cb);
        }
    };

    const retry = (operation: () => Promise<any> | any) => {
        reset();
        return runInsideOwner(() => {
            try {
                const result = operation();
                if (result && typeof (result as Promise<unknown>).then === 'function') {
                    return (result as Promise<unknown>).catch(err => {
                        handleError(err, owner ?? null);
                        return Promise.reject(err);
                    });
                }
                return result;
            } catch (err) {
                handleError(err, owner ?? null);
            }
        });
    };

    return [error, { reset, retry, dispose }] as const;
}

// ============================================================================
// Advanced Utilities
// ============================================================================

/**
 * Memoized callback
 */
export function createCallback<T extends (...args: any[]) => any>(fn: T): T {
    return fn; // In this simple model, functions are already stable
}

/**
 * Derived value with custom equality
 */
export function createDerived<T>(
    fn: () => T,
    equals?: (prev: T, next: T) => boolean
): () => T {
    return createMemo(fn, undefined, { equals });
}

/**
 * Debounced signal
 */
export function createDebouncedSignal<T>(
    initialValue: T,
    delay: number
): [() => T, (value: T | ((prev: T) => T)) => void] {
    const [value, setValue] = createSignal(initialValue);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedSet = (next: T | ((prev: T) => T)) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            setValue(next);
            timeoutId = null;
        }, delay);
    };

    return [value, debouncedSet];
}

/**
 * Throttled signal
 */
export function createThrottledSignal<T>(
    initialValue: T,
    interval: number
): [() => T, (value: T | ((prev: T) => T)) => void] {
    const [value, setValue] = createSignal(initialValue);
    let lastUpdate = 0;

    const throttledSet = (next: T | ((prev: T) => T)) => {
        const now = Date.now();
        if (now - lastUpdate >= interval) {
            setValue(next);
            lastUpdate = now;
        }
    };

    return [value, throttledSet];
}

function createTransitionTuple(owner: Owner | null): TransitionTuple {
    const [pending, setPending] = createSignal(false);

    const schedule = (fn: () => void) => {
        if (typeof fn !== 'function') return;
        const targetOwner = owner ?? currentOwner;
        setPending(true);
        queueMicrotask(() => {
            try {
                runWithOwner(targetOwner ?? null, () => {
                    batch(() => {
                        try {
                            fn();
                        } catch (error) {
                            handleError(error, targetOwner ?? null);
                        }
                    });
                });
            } catch (error) {
                console.error(error);
            } finally {
                setPending(false);
            }
        });
    };

    return [pending, schedule];
}

function ensureOwnerTransition(owner: Owner | null): TransitionTuple {
    if (!owner) {
        return createTransitionTuple(null);
    }
    if (!owner.transition) {
        owner.transition = createTransitionTuple(owner);
    }
    return owner.transition;
}

export function createTransition(): TransitionTuple {
    return createTransitionTuple(null);
}

export function useTransition(): TransitionTuple {
    return ensureOwnerTransition(currentOwner);
}

export function startTransition(fn: () => void): void {
    const [, schedule] = ensureOwnerTransition(currentOwner);
    schedule(fn);
}

// ============================================================================
// Reactive Root
// ============================================================================

export function createRoot<T>(fn: (dispose: () => void) => T): T {
    const parent = currentOwner;
    const owner = createOwner(parent);
    return runWithOwner(owner, () => {
        try {
            return fn(() => disposeOwner(owner));
        } catch (error) {
            handleError(error, owner);
            throw error;
        }
    });
}

export function getOwner(): unknown {
    return currentOwner;
}

export function runWithOwner<T>(owner: unknown, fn: () => T): T {
    const prev = currentOwner;
    currentOwner = owner as Owner | null;
    try {
        return fn();
    } finally {
        currentOwner = prev;
    }
}

// ============================================================================
// Resource (Async Data)
// ============================================================================

export function createSuspense(options?: { timeout?: number }) {
    const owner = currentOwner;
    if (!owner) {
        throw new Error('createSuspense must be used within a reactive owner');
    }
    const [state, setState] = createSignal<SuspenseState>({ pending: false, error: null }, { equals: false });
    let pendingCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const previousBoundary = owner?.suspense;

    const begin = () => {
        pendingCount++;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (options?.timeout) {
            timeoutId = setTimeout(() => {
                setState(prev => prev.pending ? prev : { ...prev, pending: true });
            }, options.timeout);
        } else {
            setState(prev => prev.pending ? prev : { ...prev, pending: true });
        }
    };

    const end = (error?: Error | null) => {
        pendingCount = Math.max(0, pendingCount - 1);
        if (error) {
            setState({ pending: false, error });
            return;
        }
        if (pendingCount === 0) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            setState({ pending: false, error: null });
        }
    };

    const track = <T>(operation: () => Promise<T> | T): Promise<T> => {
        begin();
        return Promise.resolve()
            .then(operation)
            .then(
                value => {
                    end();
                    return value;
                },
                error => {
                    const normalized = normalizeError(error);
                    end(normalized);
                    return Promise.reject(normalized);
                }
            );
    };

    const reset = () => {
        pendingCount = 0;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        setState({ pending: false, error: null });
    };

    const boundary: SuspenseBoundary = { begin, end };
    owner.suspense = boundary;
    onCleanup(() => {
        if (owner.suspense === boundary) {
            owner.suspense = previousBoundary;
        }
    });

    return [state, { begin, end, track, reset }] as const;
}

type ResourceState<T> = {
    loading: boolean;
    error: Error | null;
    data: T | undefined;
};

export function createResource<T, S = undefined>(
    source: (() => S) | undefined,
    fetcher: (source: S) => Promise<T>,
    options?: { initialValue?: T }
): [() => ResourceState<T>, { refetch: () => Promise<void>; mutate: (value: T) => void }] {
    const [state, setState] = createSignal<ResourceState<T>>({
        loading: true,
        error: null,
        data: options?.initialValue,
    });

    let abortController: AbortController | null = null;
    const suspenseBoundary = currentOwner?.suspense;

    const doFetch = async (sourceValue: S) => {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        suspenseBoundary?.begin();

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetcher(sourceValue);
            if (!abortController.signal.aborted) {
                setState({ loading: false, error: null, data });
            }
            suspenseBoundary?.end();
        } catch (error) {
            if (abortController.signal.aborted) {
                suspenseBoundary?.end();
                return;
            }
            const normalized = normalizeError(error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: normalized,
            }));
            suspenseBoundary?.end(normalized);
        }
    };

    if (source) {
        createEffect(() => {
            const val = source();
            untrack(() => doFetch(val));
        });
    } else {
        doFetch(undefined as S);
    }

    return [
        state,
        {
            refetch: async () => doFetch(source ? source() : (undefined as S)),
            mutate: (value: T) => setState(prev => ({ ...prev, data: value })),
        },
    ];
}

// ============================================================================
// Context API
// ============================================================================

type Context<T> = {
    id: symbol;
    defaultValue: T;
    Provider: (props: { value: T; children?: any }) => any;
};

const contextValues = new Map<symbol, any>();

export function createContext<T>(defaultValue: T): Context<T> {
    const id = Symbol('context');

    return {
        id,
        defaultValue,
        Provider: ({ value, children }) => {
            contextValues.set(id, value);
            return children;
        },
    };
}

export function useContext<T>(context: Context<T>): T {
    return contextValues.has(context.id)
        ? contextValues.get(context.id)
        : context.defaultValue;
}
