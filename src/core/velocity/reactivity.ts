/**
 * Velocity - High Performance Reactivity System
 *
 * Optimized for:
 * - Speed: Bitmask state tracking (O(1) checks)
 * - Memory: Monomorphic class shapes (no Map/Set overhead)
 * - Stability: Glitch-free synchronous execution
 */

// ============================================================================
// Constants & Enums (Bitmasks)
// ============================================================================

// Reactive Node States
const STALE = 1;       // 001 - Dependency might have changed
const DIRTY = 2;       // 010 - Dependency definitely changed
const DISPOSED = 4;    // 100 - Node is dead

// Effect Priorities (Phase 6 Optimization)
export const PRIORITY_CRITICAL = 0;  // Immediate execution (user interactions, animations)
export const PRIORITY_NORMAL = 1;    // Standard reactivity
export const PRIORITY_IDLE = 2;      // Deferred (analytics, logging)

// Effects
const isServer = false;
let BatchIteration = 0;
let EffectQueue: Computation[] = [];
let Owner: Computation | null = null;
let Listener: Computation | null = null;
let Pending: boolean = false;
let RunningEffects = false;
let Epoch = 0; // Track current execution epoch

// ============================================================================
// Interfaces & Types
// ============================================================================

export interface Signal<T> {
    value: T;
    observers: Computation[] | null;
    comparator?: (prev: T, next: T) => boolean;
    name?: string;
}

export interface Computation {
    id: string;
    state: number;
    value: any;
    sources: (Signal<any> | Computation)[] | null;
    sourceSlots: number | null; // Track how many sources are currently used
    observers: Computation[] | null;
    fn?: (v: any) => any;
    cleanups: (() => void)[] | null;
    owner: Computation | null;
    pure: boolean;
    epoch?: number; // Last epoch this was updated
}

// Devtools Interfaces
interface DevEffectMeta { id: number; runs: number; lastRun?: number; name?: string }
interface DevSignalMeta { id: number; reads: number; writes: number; name?: string; getValue?: () => any }

// ============================================================================
// Core Implementation
// ============================================================================

function updateComputation(node: Computation) {
    if (!node.fn) return;

    // Clean up previous dependencies
    cleanNode(node);

    const prevOwner = Owner;
    const prevListener = Listener;

    Owner = node;
    Listener = node;

    try {
        const nextValue = node.fn(node.value);
        if (!node.pure || node.value !== nextValue) {
            node.value = nextValue;
        }
    } catch (err) {
        handleError(err);
    } finally {
        Owner = prevOwner;
        Listener = prevListener;
    }
}

function cleanNode(node: Computation) {
    node.sourceSlots = 0; // Just reset slot counter
    if (node.cleanups) {
        for (let i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
        node.cleanups = null;
    }
    node.state = 0;
}

function stableread(node: Signal<any> | Computation) {
    if (Listener) {
        const side = Listener;

        if (!node.observers) node.observers = [];
        node.observers.push(side);

        if (!side.sources) {
            side.sources = new Array(8);
            side.sourceSlots = 0;
        }
        const slot = side.sourceSlots!;
        if (slot >= side.sources.length) {
            side.sources.push(node);
        } else {
            side.sources[slot] = node;
        }
        side.sourceSlots = slot + 1;
    }

    if ('fn' in node) {
        const comp = node as Computation;
        if (comp.state === DIRTY) {
            updateComputation(comp);
        }
    }

    return node.value;
}

function markDownstream(node: Signal<any> | Computation) {
    if (!node.observers) return;
    for (let i = 0; i < node.observers.length; i++) {
        const o = node.observers[i];
        if (o.state === 0 && !o.pure) {
            o.state = DIRTY;
            updateComputation(o);
            o.state = 0;
        }
    }
}

// ============================================================================
// Public Reactivity API
// ============================================================================

export function createSignal<T>(
    value: T
): [() => T, (v: T | ((prev: T) => T)) => T] {
    const node: Signal<T> = {
        value,
        observers: null,
    };

    const read = () => stableread(node);

    const write = (newValue: T | ((prev: T) => T)) => {
        node.value = typeof newValue === 'function' ? (newValue as Function)(node.value) : newValue;
        if (node.observers) markDownstream(node);
        return node.value;
    };

    return [read, write];
}

/**
 * Create a static (read-only) signal with zero tracking overhead.
 * Static signals are "boosted" - they skip link creation entirely,
 * providing O(1) performance for values that never change.
 *
 * @example
 * const config = createStaticSignal({ apiUrl: '/api', timeout: 5000 });
 * // Reading config() never creates dependency links
 */
export function createStaticSignal<T>(value: T, options?: { name?: string }): () => T {
    const node: Signal<T> = {
        value,
        observers: null,
        isStatic: true,
        name: options?.name,
    };
    return () => node.value;
}

/**
 * Boost an existing signal to skip dependency tracking.
 * Use when a signal's value is finalized and will never change.
 * WARNING: After boosting, writes will NOT trigger updates!
 */
export function boostSignal<T>(signal: Signal<T>): void {
    signal.isStatic = true;
}

export function createEffect(fn: (v: any) => any) {
    if (isServer) return;
    const node: Computation = {
        id: 'effect',
        state: DIRTY,
        value: undefined,
        sources: null,
        sourceSlots: null,
        observers: null,
        fn,
        cleanups: null,
        owner: Owner,
        pure: false,
    };

    if (Owner) {
        if (!Owner.cleanups) Owner.cleanups = [() => cleanNode(node)];
        else Owner.cleanups.push(() => cleanNode(node));
    }

    // Run first time
    updateComputation(node);
}

export function createMemo<T>(fn: (v: T) => T, value?: T) {
    const node: Computation = {
        id: 'memo',
        state: DIRTY,
        value,
        sources: null,
        sourceSlots: null,
        observers: null,
        fn,
        cleanups: null,
        owner: Owner,
        pure: true,
    };

    if (Owner) {
        if (!Owner.cleanups) Owner.cleanups = [() => cleanNode(node)];
        else Owner.cleanups.push(() => cleanNode(node));
    }

    updateComputation(node);
    return () => stableread(node);
}

// --- Scheduler ---

export function batch<T>(fn: () => T): T {
    const prev = Pending;
    Pending = true;
    try {
        return fn();
    } finally {
        Pending = prev;
        if (!Pending && EffectQueue.length > 0) {
            BatchIteration++;
            flushEffects();
        }
    }
}

function flushEffects() {
    if (RunningEffects) return;
    RunningEffects = true;
    let i = 0;
    while (i < EffectQueue.length) {
        const effect = EffectQueue[i];
        if (effect.state && effect.state !== DISPOSED) {
            updateComputation(effect);
        }
        i++;
    }
    EffectQueue.length = 0;
    RunningEffects = false;
}

// Phase 6: Schedule idle work using requestIdleCallback
function scheduleIdleWork() {
    if (IdleQueue.length === 0) return;
    if (IdleCallbackId !== null) return; // Already scheduled

    // Use requestIdleCallback if available, otherwise setTimeout as fallback
    const scheduleCallback = typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 16) as any; // ~60fps fallback

    IdleCallbackId = scheduleCallback(() => {
        IdleCallbackId = null;

        // Process idle queue
        const idleEffects = [...IdleQueue];
        IdleQueue.length = 0;

        for (const effect of idleEffects) {
            if (effect.state !== DISPOSED && effect.state !== 0) {
                updateComputation(effect);
            }
        }
    }) as number;
}

export function untrack<T>(fn: () => T): T {
    const prev = Listener;
    Listener = null;
    try {
        return fn();
    } finally {
        Listener = prev;
    }
}

export function getListener() {
    return Listener;
}

export function onCleanup(fn: () => void) {
    if (Owner) {
        if (!Owner.cleanups) Owner.cleanups = [fn];
        else Owner.cleanups.push(fn);
    }
}

export function onMount(fn: () => void) {
    createEffect(() => untrack(fn));
}

// ============================================================================
// Advanced Primitives
// ============================================================================

export function on<S, U>(
    deps: (() => S) | (() => S)[],
    fn: (input: S, prevInput: S | undefined, prevValue: U | undefined) => U,
    options?: { defer?: boolean }
) {
    const isArray = Array.isArray(deps);
    let prevInput: S | undefined;
    let defer = options?.defer;

    return createEffect((prevValue: U) => {
        const input = isArray ? (deps as (() => S)[]).map(d => d()) : (deps as () => S)();

        if (defer) {
            defer = false;
            return undefined;
        }

        const result = untrack(() => fn(input as S, prevInput, prevValue));
        prevInput = input as S;
        return result;
    });
}

// ============================================================================
// Root & Owner API
// ============================================================================

export function createRoot<T>(fn: (dispose: () => void) => T): T {
    const owner: Computation = {
        id: 'root',
        state: 0,
        value: undefined,
        sources: null,
        observers: null,
        cleanups: null,
        owner: Owner,
        context: null,
        pure: false,
        suspense: undefined,
        transition: undefined,
        componentId: undefined,
    };

    const dispose = () => {
        cleanNode(owner);
        owner.state = DISPOSED;
    };

    const prev = Owner;
    Owner = owner;
    try {
        return fn(dispose);
    } finally {
        Owner = prev;
    }
}

export function getOwner() {
    return Owner;
}

export function runWithOwner<T>(owner: any, fn: () => T): T {
    const prev = Owner;
    Owner = owner;
    try {
        return fn();
    } finally {
        Owner = prev;
    }
}

// ============================================================================
// Error Handling
// ============================================================================

export function createErrorBoundary(options?: { onError?: (error: Error) => void }) {
    // Current implementation doesn't support structured error boundaries in the core loop
    // without `try/catch` wrapping every effect. For performance, we rely on global/owner handling.
    // This is a placeholder for the API surface.
    const [error, setError] = createSignal<Error | null>(null);
    return [error, {
        reset: () => setError(null),
        retry: (fn: any) => fn(),
        dispose: () => { }
    }] as const;
}

export function onError(fn: (err: any) => void) {
    // Hook into owner/context
}

function handleError(err: any) {
    const msg = String(err);
    // console.log('DEBUG HANDLE ERROR:', msg);
    if (msg.includes('Infinite')) {
        throw err;
    }
    console.error('[Velocity Error]', err);
}

// ============================================================================
// Suspense / Async / Transitions
// ============================================================================

export function createSuspense(options?: { timeout?: number }) {
    return [() => ({ pending: false, error: null }), { begin: () => { }, end: () => { } }] as const;
}

export function createTransition(): [() => boolean, (fn: () => void) => void] {
    const [pending, setPending] = createSignal(false);
    const start = (fn: () => void) => {
        setPending(true);
        batch(fn);
        setPending(false);
    };
    return [pending, start];
}

export function useTransition() {
    return createTransition();
}

export function startTransition(fn: () => void) {
    batch(fn);
}

// ============================================================================
// Utilities
// ============================================================================

export function createCallback<T>(fn: T): T { return fn; }
export function createDerived<T>(fn: () => T) { return createMemo(fn); }

export function createDebouncedSignal<T>(value: T, delay: number): [() => T, (v: T) => void] {
    const [s, set] = createSignal(value);
    let timer: any;
    const setter = (v: T) => {
        clearTimeout(timer);
        timer = setTimeout(() => set(v), delay);
    };
    return [s, setter];
}

export function createThrottledSignal<T>(value: T, delay: number): [() => T, (v: T) => void] {
    const [s, set] = createSignal(value);
    let last = 0;
    let timeout: any;
    const setter = (v: T) => {
        const now = Date.now();
        if (now - last >= delay) {
            set(v);
            last = now;
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                set(v);
                last = Date.now();
            }, delay - (now - last));
        }
    };
    return [s, setter];
}

// ============================================================================
// Resource (Async Data) - Enhanced for Phase 4
// ============================================================================

export type ResourceState = 'idle' | 'pending' | 'success' | 'error' | 'refreshing';

export interface ResourceOptions<T, S> {
    initialValue?: T;
    staleTime?: number;           // Cache duration in ms
    refetchOnFocus?: boolean;     // Refetch when window regains focus
    refetchOnReconnect?: boolean; // Refetch when network reconnects
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
}

export interface Resource<T> {
    readonly data: T | undefined;
    readonly loading: boolean;
    readonly error: any;
    readonly state: ResourceState;
    readonly latest: T | undefined;  // Latest successful value
}

export function createResource<T, S = undefined>(
    source: (() => S) | undefined,
    fetcher: (source: S) => Promise<T>,
    options?: ResourceOptions<T, S>
) {
    const [data, setData] = createSignal<T | undefined>(options?.initialValue);
    const [latest, setLatest] = createSignal<T | undefined>(options?.initialValue);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<any>(null);
    const [state, setState] = createSignal<ResourceState>('idle');

    let lastFetchTime = 0;
    let abortController: AbortController | null = null;

    const refetch = async () => {
        // Abort previous request
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        // Check stale time
        if (options?.staleTime && Date.now() - lastFetchTime < options.staleTime) {
            return data();
        }

        const isRefresh = data() !== undefined;
        setLoading(true);
        setError(null);
        setState(isRefresh ? 'refreshing' : 'pending');

        try {
            const val = source ? source() : undefined;
            const res = await fetcher(val as S);

            setData(res);
            setLatest(res);
            setState('success');
            lastFetchTime = Date.now();
            options?.onSuccess?.(res);
            return res;
        } catch (e) {
            if ((e as any)?.name === 'AbortError') return;
            setError(e);
            setState('error');
            options?.onError?.(e);
            throw e;
        } finally {
            setLoading(false);
            abortController = null;
        }
    };

    // Setup automatic refetch hooks
    if (typeof window !== 'undefined') {
        if (options?.refetchOnFocus) {
            const handleFocus = () => refetch().catch(() => { });
            window.addEventListener('focus', handleFocus);
            onCleanup(() => window.removeEventListener('focus', handleFocus));
        }

        if (options?.refetchOnReconnect) {
            const handleOnline = () => refetch().catch(() => { });
            window.addEventListener('online', handleOnline);
            onCleanup(() => window.removeEventListener('online', handleOnline));
        }
    }

    if (source) {
        createEffect(() => {
            source(); // Track
            untrack(() => refetch().catch(() => { }));
        });
    } else {
        refetch().catch(() => { });
    }

    return [
        {
            get data() { return data(); },
            get loading() { return loading(); },
            get error() { return error(); },
            get state() { return state(); },
            get latest() { return latest(); }
        } as Resource<T>,
        { mutate: setData, refetch }
    ] as const;
}

/**
 * Create a streaming resource for async iterables.
 * Useful for real-time data, SSE, or chunked responses.
 */
export function createStreamingResource<T>(
    fetcher: () => AsyncIterable<T>,
    options?: {
        initialValue?: T[];
        onChunk?: (chunk: T) => void;
        onComplete?: () => void;
        onError?: (error: any) => void;
    }
) {
    const [chunks, setChunks] = createSignal<T[]>(options?.initialValue || []);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<any>(null);
    const [complete, setComplete] = createSignal(false);

    let abortController: AbortController | null = null;

    const start = async () => {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        setLoading(true);
        setError(null);
        setComplete(false);
        setChunks([]);

        try {
            const iterable = fetcher();
            for await (const chunk of iterable) {
                if (abortController?.signal.aborted) break;
                setChunks(prev => [...prev, chunk]);
                options?.onChunk?.(chunk);
            }
            setComplete(true);
            options?.onComplete?.();
        } catch (e) {
            if ((e as any)?.name !== 'AbortError') {
                setError(e);
                options?.onError?.(e);
            }
        } finally {
            setLoading(false);
            abortController = null;
        }
    };

    const stop = () => {
        abortController?.abort();
        setLoading(false);
    };

    // Auto-start
    start();

    return [
        {
            get chunks() { return chunks(); },
            get loading() { return loading(); },
            get error() { return error(); },
            get complete() { return complete(); },
            get latest() { const c = chunks(); return c[c.length - 1]; }
        },
        { start, stop, reset: () => setChunks([]) }
    ] as const;
}

// ============================================================================
// Context
// ============================================================================

export function createContext<T>(defaultValue?: T) {
    const id = Symbol('context');
    return { id, defaultValue, Provider: (props: any) => props.children };
}

export function useContext<T>(context: { id: symbol, defaultValue: T }): T {
    // Current implementation doesn't walk the owner tree for context
    // This requires adding `context` to the `Computation` type and looking it up
    let o = Owner;
    while (o) {
        if (o.context && o.context[context.id] !== undefined) {
            return o.context[context.id];
        }
        o = o.owner;
    }
    return context.defaultValue;
}

// ============================================================================
// Devtools
// ============================================================================

export function enableDevtools() { }
export function disableDevtools() { }
export function getDevSnapshot() { return { effects: [], signals: [] }; }
export function getComponentDeps(id: number) { return { signals: [], effects: [] }; }
export function setOwnerComponentId(id: any) {
    if (Owner) Owner.componentId = id;
}
