/**
 * Utility Functions
 *
 * Common utilities for environment detection, event handling,
 * form management, and general helpers.
 */

import { createSignal, createEffect, onCleanup, batch } from './reactivity';

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Check if running on server (SSR)
 */
export const isServer: boolean = typeof window === 'undefined';

/**
 * Check if running in browser
 */
export const isBrowser: boolean = !isServer;

/**
 * Check if running in development mode
 */
export const isDev: boolean =
    isBrowser && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.local')
    );

/**
 * Safe access to window object
 */
export function getWindow(): Window | undefined {
    return isBrowser ? window : undefined;
}

/**
 * Safe access to document object
 */
export function getDocument(): Document | undefined {
    return isBrowser ? document : undefined;
}

// ============================================================================
// Event Utilities
// ============================================================================

/**
 * Creates a debounced function that delays invoking fn until after wait ms
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (this: any, ...args: Parameters<T>) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            timeoutId = null;
        }, wait);
    } as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}

/**
 * Creates a throttled function that only invokes fn at most once per wait ms
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): T & { cancel: () => void } {
    let lastTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const throttled = function (this: any, ...args: Parameters<T>) {
        const now = Date.now();
        const remaining = wait - (now - lastTime);

        if (remaining <= 0) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastTime = now;
            fn.apply(this, args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastTime = Date.now();
                timeoutId = null;
                fn.apply(this, args);
            }, remaining);
        }
    } as T & { cancel: () => void };

    throttled.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastTime = 0;
    };

    return throttled;
}

/**
 * Adds an event listener with automatic cleanup
 */
export function createEventListener<K extends keyof WindowEventMap>(
    target: Window | Document | Element | null | undefined,
    event: K,
    handler: (e: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
): () => void {
    if (!target) return () => { };

    target.addEventListener(event, handler as EventListener, options);

    const cleanup = () => {
        target.removeEventListener(event, handler as EventListener, options);
    };

    // Auto-cleanup if called within reactive context
    try {
        onCleanup(cleanup);
    } catch {
        // Not in reactive context, return manual cleanup
    }

    return cleanup;
}

/**
 * Media query hook
 */
export function createMediaQuery(query: string): () => boolean {
    if (isServer) {
        const [matches] = createSignal(false);
        return matches;
    }

    const mediaQuery = window.matchMedia(query);
    const [matches, setMatches] = createSignal(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    onCleanup(() => mediaQuery.removeEventListener('change', handler));

    return matches;
}

/**
 * Visibility state hook
 */
export function createVisibilityState(): () => DocumentVisibilityState {
    if (isServer) {
        const [state] = createSignal<DocumentVisibilityState>('visible');
        return state;
    }

    const [state, setState] = createSignal<DocumentVisibilityState>(document.visibilityState);

    const handler = () => setState(document.visibilityState);
    document.addEventListener('visibilitychange', handler);
    onCleanup(() => document.removeEventListener('visibilitychange', handler));

    return state;
}

/**
 * Online status hook
 */
export function createOnlineStatus(): () => boolean {
    if (isServer) {
        const [online] = createSignal(true);
        return online;
    }

    const [online, setOnline] = createSignal(navigator.onLine);

    createEventListener(window, 'online', () => setOnline(true));
    createEventListener(window, 'offline', () => setOnline(false));

    return online;
}

// ============================================================================
// Form Utilities
// ============================================================================

export interface FormField<T> {
    value: () => T;
    setValue: (v: T | ((prev: T) => T)) => void;
    error: () => string | null;
    setError: (e: string | null) => void;
    touched: () => boolean;
    setTouched: (t: boolean) => void;
    isDirty: () => boolean;
    isValid: () => boolean;
    reset: () => void;
    validate: () => boolean;
}

export interface FormFieldOptions<T> {
    /** Initial value */
    initial: T;
    /** Validation function */
    validate?: (value: T) => string | null;
    /** Transform value before setting */
    transform?: (value: T) => T;
    /** Debounce validation (ms) */
    validateDebounce?: number;
}

/**
 * Create a form field with validation
 */
export function createFormField<T>(options: FormFieldOptions<T>): FormField<T> {
    const { initial, validate: validateFn, transform, validateDebounce } = options;

    const [value, setValue] = createSignal<T>(initial);
    const [error, setError] = createSignal<string | null>(null);
    const [touched, setTouched] = createSignal(false);
    const initialValue = initial;

    const validate = (): boolean => {
        if (!validateFn) return true;
        const err = validateFn(value());
        setError(err);
        return err === null;
    };

    // Debounced validation
    const debouncedValidate = validateDebounce
        ? debounce(validate, validateDebounce)
        : null;

    const wrappedSetValue = (v: T | ((prev: T) => T)) => {
        const newValue = typeof v === 'function' ? (v as (prev: T) => T)(value()) : v;
        const transformed = transform ? transform(newValue) : newValue;
        setValue(transformed as any);

        if (debouncedValidate) {
            debouncedValidate();
        } else if (validateFn && touched()) {
            validate();
        }
    };

    return {
        value,
        setValue: wrappedSetValue,
        error,
        setError,
        touched,
        setTouched,
        isDirty: () => value() !== initialValue,
        isValid: () => error() === null,
        reset: () => {
            setValue(initial as any);
            setError(null);
            setTouched(false);
        },
        validate,
    };
}

export interface FormControl<T extends Record<string, any>> {
    fields: { [K in keyof T]: FormField<T[K]> };
    values: () => T;
    errors: () => Partial<Record<keyof T, string | null>>;
    isValid: () => boolean;
    isDirty: () => boolean;
    reset: () => void;
    validate: () => boolean;
    handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: Event) => void;
}

/**
 * Create a form control with multiple fields
 */
export function createForm<T extends Record<string, any>>(
    schema: { [K in keyof T]: FormFieldOptions<T[K]> }
): FormControl<T> {
    const fields = {} as { [K in keyof T]: FormField<T[K]> };

    for (const key in schema) {
        fields[key] = createFormField(schema[key]);
    }

    return {
        fields,
        values: () => {
            const result = {} as T;
            for (const key in fields) {
                result[key] = fields[key].value();
            }
            return result;
        },
        errors: () => {
            const result = {} as Partial<Record<keyof T, string | null>>;
            for (const key in fields) {
                const err = fields[key].error();
                if (err) result[key] = err;
            }
            return result;
        },
        isValid: () => {
            for (const key in fields) {
                if (!fields[key].isValid()) return false;
            }
            return true;
        },
        isDirty: () => {
            for (const key in fields) {
                if (fields[key].isDirty()) return true;
            }
            return false;
        },
        reset: () => {
            batch(() => {
                for (const key in fields) {
                    fields[key].reset();
                }
            });
        },
        validate: () => {
            let valid = true;
            batch(() => {
                for (const key in fields) {
                    if (!fields[key].validate()) valid = false;
                }
            });
            return valid;
        },
        handleSubmit: (onSubmit) => (e) => {
            e.preventDefault();
            batch(() => {
                for (const key in fields) {
                    fields[key].setTouched(true);
                }
            });

            let valid = true;
            for (const key in fields) {
                if (!fields[key].validate()) valid = false;
            }

            if (valid) {
                const values = {} as T;
                for (const key in fields) {
                    values[key] = fields[key].value();
                }
                onSubmit(values);
            }
        },
    };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Common validation functions
 */
export const validators = {
    required: (message = 'This field is required') =>
        (value: any) => (!value && value !== 0 && value !== false) ? message : null,

    minLength: (min: number, message?: string) =>
        (value: string) => value.length < min ? (message || `Minimum ${min} characters`) : null,

    maxLength: (max: number, message?: string) =>
        (value: string) => value.length > max ? (message || `Maximum ${max} characters`) : null,

    pattern: (regex: RegExp, message = 'Invalid format') =>
        (value: string) => !regex.test(value) ? message : null,

    email: (message = 'Invalid email address') =>
        (value: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,

    url: (message = 'Invalid URL') =>
        (value: string) => {
            try {
                new URL(value);
                return null;
            } catch {
                return message;
            }
        },

    min: (min: number, message?: string) =>
        (value: number) => value < min ? (message || `Minimum value is ${min}`) : null,

    max: (max: number, message?: string) =>
        (value: number) => value > max ? (message || `Maximum value is ${max}`) : null,

    /**
     * Combine multiple validators
     */
    compose: <T>(...validators: ((value: T) => string | null)[]) =>
        (value: T) => {
            for (const validate of validators) {
                const error = validate(value);
                if (error) return error;
            }
            return null;
        },
};

// ============================================================================
// General Utilities
// ============================================================================

/**
 * Generate a unique ID
 */
export function uid(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as any;
    if (Array.isArray(obj)) return obj.map(deepClone) as any;

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Check if two values are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, i) => deepEqual(val, b[i]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual((a as any)[key], (b as any)[key])
    );
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) result[key] = obj[key];
    }
    return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result as Omit<T, K>;
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Group array items by a key
 */
export function groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] = acc[key] || []).push(item);
        return acc;
    }, {} as Record<K, T[]>);
}
