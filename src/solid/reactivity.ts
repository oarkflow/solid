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
};

let currentEffect: Effect | null = null;
let batchDepth = 0;
let pendingEffects: Set<Effect> = new Set();

// ============================================================================
// Devtools instrumentation
// ============================================================================

type DevEffectMeta = { id: number; runs: number; lastRun?: number };
type DevSignalMeta = { id: number; reads: number; writes: number };

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


export function enableDevtools() {
    devState.enabled = true;
}

export function disableDevtools() {
    devState.enabled = false;
}

export function getDevSnapshot() {
    const effects: Array<{ id: number; runs: number; lastRun?: number }> = [];
    for (const meta of devEffectsRegistry.values()) {
        effects.push({ id: meta.id, runs: meta.runs, lastRun: meta.lastRun });
    }

    const signals: Array<{ id: number; reads: number; writes: number }> = [];
    for (const meta of devSignalsRegistry.values()) {
        signals.push({ id: meta.id, reads: meta.reads, writes: meta.writes });
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
    options?: { equals?: false | ((prev: T, next: T) => boolean) }
): [() => T, (value: T | ((prev: T) => T)) => void] {
    let value = initialValue;
    const subscribers = new Set<Effect>();

    // Register signal metadata for devtools
    const signalMeta: DevSignalMeta = { id: ++devState.signalCounter, reads: 0, writes: 0 };
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

            // If there is a current component executing, map component -> signal
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
    currentEffect = effect;
    try {
        effect.execute();
    } finally {
        currentEffect = prevEffect;
    }
}

/**
 * Creates a reactive effect
 */
export function createEffect(fn: () => void): void {
    const effect: Effect = {
        execute: fn,
        dependencies: new Set(),
        cleanups: [],
    };

    // Dev meta
    const meta: DevEffectMeta = { id: ++devState.effectCounter, runs: 0 };
    devState.effects.set(effect, meta);
    devEffectsRegistry.set(effect, meta);

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
    }
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

// ============================================================================
// Reactive Root
// ============================================================================

export function createRoot<T>(fn: (dispose: () => void) => T): T {
    const effects: Effect[] = [];
    const dispose = () => {
        for (const effect of effects) {
            for (const cleanup of effect.cleanups) {
                try { cleanup(); } catch (e) { console.error(e); }
            }
            for (const deps of effect.dependencies) {
                deps.delete(effect);
            }
        }
    };
    return fn(dispose);
}

export function getOwner(): null {
    return null;
}

export function runWithOwner<T>(_owner: null, fn: () => T): T {
    return fn();
}

// ============================================================================
// Resource (Async Data)
// ============================================================================

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

    const doFetch = async (sourceValue: S) => {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetcher(sourceValue);
            if (!abortController.signal.aborted) {
                setState({ loading: false, error: null, data });
            }
        } catch (error) {
            if (!abortController.signal.aborted) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                }));
            }
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
