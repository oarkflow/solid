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

    // Async resources
    createResource,

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

export { createRouter, Link, useRouter } from './router';
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
    schemaResolver,
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
// Schema Validation (zod-like)
// ============================================================================

export {
    v,
    Schema,
    ValidationException,
    IssueCodes,

    // Schema classes
    StringSchema,
    NumberSchema,
    BooleanSchema,
    DateSchema,
    ArraySchema,
    ObjectSchema,
    EnumSchema,
    NativeEnumSchema,
    LiteralSchema,
    UnionSchema,
    DiscriminatedUnionSchema,
    TupleSchema,
    RecordSchema,
    AnySchema,
    UnknownSchema,
    NeverSchema,
    VoidSchema,
    NullSchema,
    UndefinedSchema,
    IntersectionSchema,
    LazySchema,
    PreprocessSchema,
    CoercedStringSchema,
    CoercedNumberSchema,
    CoercedBooleanSchema,
    CoercedDateSchema,
} from './schema';

export type {
    ValidationError,
    ParseResult,
    IssueCode,
    infer as SchemaInfer,
    input as SchemaInput,
} from './schema';

// ============================================================================
// JSX Factory (for TypeScript/Babel)
// ============================================================================

import { createElement as _createElement } from './jsx';
export const jsx = _createElement;
export const jsxs = _createElement;
export const jsxDEV = _createElement;
