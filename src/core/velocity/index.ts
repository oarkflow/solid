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
    onError,
    createErrorBoundary,

    // Advanced reactivity
    batch,
    untrack,
    on,
    createRoot,
    getOwner,
    runWithOwner,
    createSuspense,
    createTransition,
    useTransition,
    startTransition,
    // Memoization utilities
    createCallback,
    createDerived,
    createDebouncedSignal,
    createThrottledSignal,

    //Signal Boosting (Phase 3)
    createStaticSignal,
    boostSignal,

    // Async resources
    createResource,
    createStreamingResource,

    // Phase 6: Priority constants
    PRIORITY_CRITICAL,
    PRIORITY_NORMAL,
    PRIORITY_IDLE,

    // Context API
    createContext,
    useContext,

    // Devtools
    enableDevtools,
    disableDevtools,
    getDevSnapshot,
    // Component deps
    getComponentDeps,
} from './reactivity';

export type { Resource, ResourceState, ResourceOptions } from './reactivity';

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

    // Error & Suspense boundaries
    ErrorBoundary,
    Suspense,

    // Safe HTML rendering
    Html,

    // DOM inspection
    getDOMSnapshot,
    getElementById,
    // Component inspection
    getComponentSnapshot,
    getComponentsTree,
    getComponentInstances,
    getElementsForComponent,

    // Lazy loading
    lazy,
    type JSX
} from './jsx';

export type { FC, Props } from './jsx';

// ============================================================================
// Fast-DOM (High-Performance Templates) - Phase 3
// ============================================================================

export {
    // Template system
    createTemplate,
    hydrate,
    html,
    el,
    createElementFast,

    // Template management
    registerTemplate,
    instantiateTemplate,
    clearTemplateCache,
    getTemplateCacheStats,
} from './fast-dom';

export type {
    SlotDescriptor,
    TemplateDescriptor,
    Binding,
} from './fast-dom';

// ============================================================================
// State Management
// ============================================================================

export {
    createStore,
    unwrap,
    produce,
    reconcile,
} from './store';

// ============================================================================
// Router
// ============================================================================

export { createRouter, Link, useRouter } from './router';

// ============================================================================
// Server-Side Rendering (SSR)
// ============================================================================

export {
    renderToString,
    renderToStream,
} from './ssr';

export type {

    Route,
    RouterApi,
    Middleware,
    RouteMeta,
    RouteMetaInput,
    MetaTagDescriptor,
    HeadConfig,
} from './router';

// ============================================================================
// Security
// ============================================================================

export {
    escapeHTML,
    unescapeHTML,
    sanitizeHTML,
    isValidUrl,
    sanitizeUrl,
    safeExternalLink,
    sanitizeInput,
    generateNonce,
    createCSPContent,
    CSP_PRESETS,
    isValidEmail,
    checkPasswordStrength,
    sanitizeFilename,
} from './security';

export type {
    SanitizeOptions,
    InputSanitizeOptions,
    CSPDirective,
} from './security';

// ============================================================================
// Utilities
// ============================================================================

export {
    // Environment
    isServer,
    isBrowser,
    isDev,
    getWindow,
    getDocument,

    // Events
    debounce,
    throttle,
    createEventListener,
    createMediaQuery,
    createVisibilityState,
    createOnlineStatus,

    // Legacy Forms (basic)
    createFormField,
    createForm,
    validators,

    // General
    uid,
    deepClone,
    deepEqual,
    pick,
    omit,
    sleep,
    clamp,
    groupBy,
    useRef,
} from './utils';

export type {
    FormField,
    FormFieldOptions,
    FormControl as LegacyFormControl,
} from './utils';

// ============================================================================
// Form Management (react-hook-form like)
// ============================================================================

export {
    useForm,
    useFieldArray,
    useWatch,
    useFormState,
    useController,
} from './form';

export type {
    UseFormConfig,
    UseFormReturn,
    UseFormRegisterReturn,
    UseFieldArrayConfig,
    UseFieldArrayReturn,
    UseWatchConfig,
    UseFormStateConfig,
    UseControllerConfig,
    UseControllerReturn,
    FormState,
    FieldError,
    FieldErrors,
    FieldPath,
    PathValue,
    ValidationMode,
    RevalidateMode,
    RegisterOptions,
    ValidateFunction,
    SetValueOptions,
    ResetOptions,
    SubmitHandler,
    SubmitErrorHandler,
    FormResolver,
    FormControl,
    FormProps,
    FieldArrayField,
} from './form';

// ============================================================================
// JSX Factory (for TypeScript/Babel)
// ============================================================================

import { createElement as _createElement } from './jsx';
export const jsx = _createElement;
export const jsxs = _createElement;
export const jsxDEV = _createElement;
