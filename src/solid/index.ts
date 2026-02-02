/**
 * Fine-Grained Reactive Framework
 *
 * A robust, secure, reactive framework with:
 * - Fine-grained reactivity (no virtual DOM, no re-renders)
 * - Direct DOM compilation from JSX
 * - Automatic dependency tracking
 * - Memoization for callback stability
 * - Memory-safe with proper cleanup
 */

// ============================================================================
// Reactivity Core
// ============================================================================

export {
    // Core primitives
    createSignal,
    createEffect,
    createMemo,

    // Lifecycle
    onCleanup,
    onMount,

    // Advanced reactivity
    batch,
    untrack,
    on,
    createRoot,
    getOwner,
    runWithOwner,

    // Memoization utilities
    createCallback,
    createDerived,
    createDebouncedSignal,
    createThrottledSignal,

    // Async resources
    createResource,

    // Context API
    createContext,
    useContext,
} from './reactivity';

// ============================================================================
// JSX Runtime
// ============================================================================

export {
    createElement,
    Fragment,
    render,

    // Control flow components
    Show,
    For,
    Switch,
    Match,
    Portal,
} from './jsx';

export type { FC, Props } from './jsx';

// ============================================================================
// State Management
// ============================================================================

export {
    createStore,
    createActions,
    createDerivedStore,
    createLogger,
    createUndoRedo,
} from './store';

export type {
    StoreApi,
    StoreOptions,
    StoreMiddleware,
    ActionContext,
} from './store';

// ============================================================================
// Router
// ============================================================================

export { createRouter } from './router';
export type { Route, RouterApi } from './router';

// ============================================================================
// JSX Factory (for TypeScript/Babel)
// ============================================================================

import { createElement as _createElement } from './jsx';
export const jsx = _createElement;
export const jsxs = _createElement;
export const jsxDEV = _createElement;
