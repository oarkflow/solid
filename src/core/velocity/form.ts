/**
 * Form Management System
 *
 * A lightweight, type-safe form handling library inspired by react-hook-form.
 * Integrates with the velocity reactivity system for fine-grained updates.
 *
 * @example Basic Usage
 * ```tsx
 * import { useForm, v } from './velocity';
 *
 * // Define your form data type
 * interface LoginForm {
 *   email: string;
 *   password: string;
 *   rememberMe: boolean;
 * }
 *
 * function LoginPage() {
 *   const { register, handleSubmit, errors, formState } = useForm<LoginForm>({
 *     defaultValues: {
 *       email: '',
 *       password: '',
 *       rememberMe: false
 *     },
 *     mode: 'onBlur', // validate on blur
 *   });
 *
 *   const onSubmit = async (data: LoginForm) => {
 *     console.log('Form submitted:', data);
 *     await loginUser(data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input
 *         {...register('email', {
 *           required: 'Email is required',
 *           pattern: {
 *             value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *             message: 'Invalid email format'
 *           }
 *         })}
 *         type="email"
 *         placeholder="Email"
 *       />
 *       {errors().email && <span class="error">{errors().email.message}</span>}
 *
 *       <input
 *         {...register('password', {
 *           required: 'Password is required',
 *           minLength: { value: 8, message: 'Password must be at least 8 characters' }
 *         })}
 *         type="password"
 *         placeholder="Password"
 *       />
 *       {errors().password && <span class="error">{errors().password.message}</span>}
 *
 *       <label>
 *         <input {...register('rememberMe')} type="checkbox" />
 *         Remember me
 *       </label>
 *
 *       <button type="submit" disabled={formState().isSubmitting}>
 *         {formState().isSubmitting ? 'Logging in...' : 'Login'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example With Schema Validation
 * ```tsx
 * import { useForm, v, schemaResolver } from './velocity';
 *
 * // Define schema with v (zod-like validation)
 * const userSchema = v.object({
 *   username: v.string().min(3, 'Username must be at least 3 characters').max(20),
 *   email: v.string().email('Invalid email address'),
 *   age: v.number().min(18, 'Must be at least 18 years old').optional(),
 *   website: v.string().url('Invalid URL').optional(),
 *   role: v.enum(['admin', 'user', 'guest']),
 * });
 *
 * type UserFormData = v.infer<typeof userSchema>;
 *
 * function UserForm() {
 *   const { register, handleSubmit, errors, setValue, watch } = useForm<UserFormData>({
 *     defaultValues: { username: '', email: '', role: 'user' },
 *     schema: userSchema,
 *     mode: 'onChange', // validate on every change
 *   });
 *
 *   // Watch a specific field reactively
 *   const role = watch('role');
 *
 *   return (
 *     <form onSubmit={handleSubmit(data => console.log(data))}>
 *       <input {...register('username')} placeholder="Username" />
 *       <input {...register('email')} type="email" placeholder="Email" />
 *       <input {...register('age', { valueAsNumber: true })} type="number" placeholder="Age" />
 *
 *       <select {...register('role')}>
 *         <option value="user">User</option>
 *         <option value="admin">Admin</option>
 *         <option value="guest">Guest</option>
 *       </select>
 *
 *       {role === 'admin' && <p>Admin privileges will be granted</p>}
 *
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example Custom Validation
 * ```tsx
 * const { register, handleSubmit } = useForm<{ password: string; confirmPassword: string }>();
 *
 * <input {...register('password', {
 *   required: true,
 *   minLength: 8,
 *   validate: {
 *     hasUppercase: (v) => /[A-Z]/.test(v) || 'Must contain uppercase letter',
 *     hasNumber: (v) => /\d/.test(v) || 'Must contain a number',
 *     hasSpecial: (v) => /[!@#$%^&*]/.test(v) || 'Must contain special character',
 *   }
 * })} />
 *
 * <input {...register('confirmPassword', {
 *   validate: (value, formValues) =>
 *     value === formValues.password || 'Passwords do not match'
 * })} />
 * ```
 *
 * @example Field Arrays (Dynamic Fields)
 * ```tsx
 * import { useForm, useFieldArray } from './velocity';
 *
 * interface OrderForm {
 *   items: Array<{ name: string; quantity: number; price: number }>;
 * }
 *
 * function OrderForm() {
 *   const { register, control, handleSubmit } = useForm<OrderForm>({
 *     defaultValues: { items: [{ name: '', quantity: 1, price: 0 }] }
 *   });
 *
 *   const { fields, append, remove } = useFieldArray({ control, name: 'items' });
 *
 *   return (
 *     <form onSubmit={handleSubmit(console.log)}>
 *       {fields().map((field, index) => (
 *         <div key={field.id}>
 *           <input {...register(`items.${index}.name`)} placeholder="Item name" />
 *           <input {...register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" />
 *           <input {...register(`items.${index}.price`, { valueAsNumber: true })} type="number" step="0.01" />
 *           <button type="button" onClick={() => remove(index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button type="button" onClick={() => append({ name: '', quantity: 1, price: 0 })}>
 *         Add Item
 *       </button>
 *       <button type="submit">Submit Order</button>
 *     </form>
 *   );
 * }
 * ```
 */

import { createSignal, createEffect, createMemo, batch, onCleanup, untrack } from './reactivity';

// ============================================================================
// Types
// ============================================================================

/** Field path for nested objects */
export type FieldPath<T> = T extends object
    ? { [K in keyof T]-?: K extends string | number
        ? `${K}` | (T[K] extends object ? `${K}.${FieldPath<T[K]>}` : never)
        : never
    }[keyof T]
    : never;

/** Get value type at path */
export type PathValue<T, P extends string> =
    P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
    : P extends keyof T
    ? T[P]
    : never;

/** Validation mode */
export type ValidationMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

/** Revalidation mode */
export type RevalidateMode = 'onBlur' | 'onChange' | 'onSubmit';

/** Field error */
export interface FieldError {
    type: string;
    message: string;
    ref?: HTMLElement;
    types?: Record<string, string>;
}

/** Form errors object */
export type FieldErrors<T> = Partial<Record<keyof T | string, FieldError>>;

type RequiredRule = boolean | string | { value: boolean; message?: string };
type NumericRule = number | { value: number; message?: string };
type PatternRule = RegExp | { value: RegExp; message?: string };

/** Form state */
export interface FormState<T> {
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
    isSubmitted: boolean;
    isSubmitSuccessful: boolean;
    submitCount: number;
    errors: FieldErrors<T>;
    touchedFields: Partial<Record<keyof T, boolean>>;
    dirtyFields: Partial<Record<keyof T, boolean>>;
    isValidating: boolean;
    disabled: boolean;
}

/**
 * Options for registering a form field with validation rules.
 *
 * @example Basic Validation
 * ```tsx
 * // Required field
 * register('name', { required: 'Name is required' })
 *
 * // Required with custom message
 * register('email', {
 *   required: 'Email is required',
 *   pattern: {
 *     value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *     message: 'Please enter a valid email'
 *   }
 * })
 * ```
 *
 * @example Number Validation
 * ```tsx
 * // Age between 18-100
 * register('age', {
 *   required: true,
 *   min: { value: 18, message: 'Must be at least 18' },
 *   max: { value: 100, message: 'Must be under 100' },
 *   valueAsNumber: true  // Automatically converts to number
 * })
 *
 * // Price with 2 decimal places
 * register('price', {
 *   min: 0,
 *   valueAsNumber: true,
 *   validate: (v) => !isNaN(v) || 'Must be a valid number'
 * })
 * ```
 *
 * @example String Length Validation
 * ```tsx
 * // Username: 3-20 characters
 * register('username', {
 *   required: 'Username is required',
 *   minLength: { value: 3, message: 'At least 3 characters' },
 *   maxLength: { value: 20, message: 'Maximum 20 characters' },
 *   pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores' }
 * })
 *
 * // Bio with character limit
 * register('bio', {
 *   maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' }
 * })
 * ```
 *
 * @example Custom Validation Functions
 * ```tsx
 * // Single validation function
 * register('username', {
 *   validate: async (value) => {
 *     const exists = await checkUsernameExists(value);
 *     return !exists || 'Username is already taken';
 *   }
 * })
 *
 * // Multiple validation rules
 * register('password', {
 *   required: 'Password is required',
 *   minLength: { value: 8, message: 'At least 8 characters' },
 *   validate: {
 *     hasUppercase: (v) => /[A-Z]/.test(v) || 'Must have uppercase letter',
 *     hasLowercase: (v) => /[a-z]/.test(v) || 'Must have lowercase letter',
 *     hasNumber: (v) => /\d/.test(v) || 'Must have a number',
 *     hasSpecial: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must have special character',
 *   }
 * })
 *
 * // Cross-field validation (confirm password)
 * register('confirmPassword', {
 *   validate: (value) => value === getValues('password') || 'Passwords must match',
 *   deps: ['password'] // Re-validate when password changes
 * })
 * ```
 *
 * @example Value Transformation
 * ```tsx
 * // Convert to number
 * register('quantity', { valueAsNumber: true })
 *
 * // Convert to date
 * register('birthDate', { valueAsDate: true })
 *
 * // Custom transformation
 * register('slug', {
 *   setValueAs: (v) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
 * })
 *
 * // Trim whitespace
 * register('name', {
 *   setValueAs: (v) => v.trim()
 * })
 * ```
 *
 * @example Event Handlers
 * ```tsx
 * register('search', {
 *   onChange: (e) => {
 *     // Debounced search
 *     debouncedSearch(e.target.value);
 *   },
 *   onBlur: (e) => {
 *     // Track analytics
 *     trackFieldInteraction('search');
 *   }
 * })
 * ```
 *
 * @example Dependent Fields
 * ```tsx
 * // Country affects state/province validation
 * register('country', { required: true })
 *
 * register('state', {
 *   validate: (value) => {
 *     const country = getValues('country');
 *     if (country === 'US' && !value) return 'State is required for US';
 *     return true;
 *   },
 *   deps: ['country'] // Re-validate when country changes
 * })
 * ```
 */
export interface RegisterOptions<T = any, TFormValues extends Record<string, any> = Record<string, any>> {
    /**
     * Mark field as required.
     * @example required: true
     * @example required: 'This field is required'
     */
    required?: RequiredRule;

    /**
     * Minimum value for numbers.
     * @example min: 0
     * @example min: { value: 18, message: 'Must be at least 18' }
     */
    min?: NumericRule;

    /**
     * Maximum value for numbers.
     * @example max: 100
     * @example max: { value: 1000, message: 'Cannot exceed 1000' }
     */
    max?: NumericRule;

    /**
     * Minimum length for strings.
     * @example minLength: 3
     * @example minLength: { value: 8, message: 'Password must be at least 8 characters' }
     */
    minLength?: NumericRule;

    /**
     * Maximum length for strings.
     * @example maxLength: 100
     * @example maxLength: { value: 280, message: 'Tweet cannot exceed 280 characters' }
     */
    maxLength?: NumericRule;

    /**
     * Regular expression pattern to match.
     * @example pattern: /^[a-zA-Z]+$/
     * @example pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code' }
     */
    pattern?: PatternRule;

    /**
     * Custom validation function(s). Return true for valid, string for error message.
     * Can be async for server-side validation.
     * @example validate: (v) => v.length > 0 || 'Required'
     * @example validate: { isEven: (v) => v % 2 === 0 || 'Must be even' }
     */
    validate?: ValidateFunction<T, TFormValues> | Record<string, ValidateFunction<T, TFormValues>>;

    /**
     * Convert input value to number automatically.
     * @example valueAsNumber: true
     */
    valueAsNumber?: boolean;

    /**
     * Convert input value to Date automatically.
     * @example valueAsDate: true
     */
    valueAsDate?: boolean;

    /**
     * Custom value transformation function.
     * @example setValueAs: (v) => v.trim().toLowerCase()
     */
    setValueAs?: (value: any) => T;

    /**
     * Disable the field.
     * @example disabled: true
     */
    disabled?: boolean;

    /**
     * Custom onChange handler (called after internal handling).
     * @example onChange: (e) => console.log('Changed:', e.target.value)
     */
    onChange?: (event: Event) => void;

    /**
     * Custom onBlur handler (called after internal handling).
     * @example onBlur: (e) => trackInteraction('field_blur')
     */
    onBlur?: (event: Event) => void;

    /**
     * Dependent field names. When these fields change, this field re-validates.
     * @example deps: ['password'] // For confirmPassword field
     */
    deps?: string[];
}

/** Validation function */
export interface FieldValidationContext<TFormValues extends Record<string, any> = Record<string, any>> {
    name: string;
    value: any;
    values: TFormValues;
    formState: FormState<TFormValues>;
    getValue: (path: FieldPath<TFormValues> | string) => any;
    options?: RegisterOptions<any, TFormValues>;
}

export type ValidateFunction<T, TFormValues extends Record<string, any> = Record<string, any>> = (
    value: T,
    context: FieldValidationContext<TFormValues>
) => boolean | string | FieldError | Promise<boolean | string | FieldError>;

/** Field registration result */
export interface UseFormRegisterReturn {
    name: string;
    ref: (element: HTMLElement | null) => void;
    onInput: (event: Event) => void;
    onChange: (event: Event) => void;
    onBlur: (event: Event) => void;
    disabled?: boolean;
}

/** Set value options */
export interface SetValueOptions {
    shouldValidate?: boolean;
    shouldDirty?: boolean;
    shouldTouch?: boolean;
}

/** Reset options */
export interface ResetOptions {
    keepErrors?: boolean;
    keepDirty?: boolean;
    keepDirtyValues?: boolean;
    keepValues?: boolean;
    keepDefaultValues?: boolean;
    keepIsSubmitted?: boolean;
    keepTouched?: boolean;
    keepIsValid?: boolean;
    keepSubmitCount?: boolean;
}

/** Form configuration */
export interface UseFormConfig<T extends Record<string, any>> {
    defaultValues?: T | (() => T) | (() => Promise<T>);
    values?: T;
    mode?: ValidationMode;
    revalidateMode?: RevalidateMode;
    criteriaMode?: 'firstError' | 'all';
    shouldFocusError?: boolean;
    delayError?: number;
    resolver?: FormResolver<T>;
    disabled?: boolean;
    validationRules?: Partial<Record<FieldPath<T> | string, RegisterOptions<any, T>>>;
}

/** Custom resolver */
export type FormResolver<T> = (
    values: T,
    context?: any
) => Promise<{ values: T; errors: FieldErrors<T> }> | { values: T; errors: FieldErrors<T> };

/** Submit handler */
export type SubmitHandler<T> = (data: T, event?: Event) => void | Promise<void>;

/** Submit error handler */
export type SubmitErrorHandler<T> = (errors: FieldErrors<T>, event?: Event) => void;

/** Field array action */
export type FieldArrayAction = 'append' | 'prepend' | 'insert' | 'remove' | 'swap' | 'move' | 'update' | 'replace';

/** Field array field */
export interface FieldArrayField<T = any> {
    id: string;
    value: T;
}

/** Form return type */
export interface UseFormReturn<T extends Record<string, any>> {
    // Core methods
    register: <K extends keyof T | string>(name: K, options?: RegisterOptions<PathValue<T, K & string>, T>) => UseFormRegisterReturn;
    unregister: (name: keyof T | string | (keyof T | string)[], options?: { keepValue?: boolean; keepError?: boolean; keepDirty?: boolean; keepTouched?: boolean }) => void;

    // Form handling
    handleSubmit: (onValid: SubmitHandler<T>, onInvalid?: SubmitErrorHandler<T>) => (e?: Event) => Promise<void>;

    // State
    formState: () => FormState<T>;
    errors: () => FieldErrors<T>;

    // Value management
    watch: {
        (): T;
        <K extends keyof T>(name: K): T[K];
        (names: (keyof T)[]): Partial<T>;
        (callback: (data: T, info: { name?: keyof T; type?: string }) => void): () => void;
    };
    getValues: {
        (): T;
        <K extends keyof T>(name: K): T[K];
        (names: (keyof T)[]): Partial<T>;
    };
    getFieldState: (name: keyof T) => { invalid: boolean; isDirty: boolean; isTouched: boolean; error?: FieldError };
    setValue: <K extends keyof T | string>(name: K, value: PathValue<T, K & string>, options?: SetValueOptions) => void;

    // Form control
    reset: (values?: T | ((values: T) => T), options?: ResetOptions) => void;
    resetField: (name: keyof T, options?: { keepDirty?: boolean; keepTouched?: boolean; keepError?: boolean; defaultValue?: any }) => void;
    clearErrors: (name?: keyof T | (keyof T)[] | string) => void;
    setError: (name: keyof T | 'root' | string, error: FieldError, options?: { shouldFocus?: boolean }) => void;
    setFocus: (name: keyof T, options?: { shouldSelect?: boolean }) => void;

    // Validation
    trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>;

    // Field array support
    control: FormControl<T>;

    // Direct signal accessors for reactive tracking
    isSubmitting: () => boolean;
    isSubmitted: () => boolean;
    isSubmitSuccessful: () => boolean;
    isDirty: () => boolean;
    isValid: () => boolean;
    isValidating: () => boolean;
}

/** Internal form control */
export interface FormControl<T extends Record<string, any>> {
    _formState: () => FormState<T>;
    _getFieldValue: (name: string) => any;
    _setFieldValue: (name: string, value: any) => void;
    _register: (name: string, options?: RegisterOptions<any, T>) => void;
    _unregister: (name: string) => void;
    _fields: Map<string, FieldRef>;
    _defaultValues: T;
}

/** Field reference */
interface FieldRef {
    ref?: HTMLElement | null;
    name: string;
    options?: RegisterOptions<any, any>;
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

function getByPath<T>(obj: T, path: string): any {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
        if (current == null) return undefined;
        current = current[key];
    }

    return current;
}

function setByPath<T>(obj: T, path: string, value: any): T {
    const keys = path.split('.');

    if (keys.length === 0) return value as T;

    const result = Array.isArray(obj) ? [...obj] : { ...obj } as any;
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || current[key] === null) {
            // Determine if next key is numeric (array) or string (object)
            current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        } else {
            current[key] = Array.isArray(current[key])
                ? [...current[key]]
                : { ...current[key] };
        }
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result as T;
}

function deleteByPath<T>(obj: T, path: string): T {
    const keys = path.split('.');

    if (keys.length === 0) return obj;
    if (keys.length === 1) {
        const result = { ...obj } as any;
        delete result[keys[0]];
        return result;
    }

    const result = Array.isArray(obj) ? [...obj] : { ...obj } as any;
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined) return obj;
        current[key] = Array.isArray(current[key])
            ? [...current[key]]
            : { ...current[key] };
        current = current[key];
    }

    delete current[keys[keys.length - 1]];
    return result as T;
}

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
}

function cloneDeep<T>(value: T): T {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime()) as any;
    if (Array.isArray(value)) return value.map(cloneDeep) as any;

    const result: any = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = cloneDeep(value[key]);
        }
    }
    return result;
}

type AnyRegisterOptions = RegisterOptions<any, any>;
type ValidationRulesMap<T extends Record<string, any>> = Partial<Record<string, RegisterOptions<any, T>>>;

function isEmptyValue(value: any): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

function normalizeNumericRule(rule?: NumericRule) {
    if (rule === undefined) return undefined;
    if (typeof rule === 'object' && rule !== null && 'value' in rule) {
        return { value: rule.value, message: rule.message };
    }
    return { value: rule };
}

function normalizeRequiredRule(rule?: RequiredRule) {
    if (rule === undefined) return undefined;
    if (typeof rule === 'string') {
        return { value: true, message: rule };
    }
    if (typeof rule === 'boolean') {
        return { value: rule };
    }
    return { value: rule.value, message: rule.message };
}

function normalizePatternRule(rule?: PatternRule) {
    if (!rule) return undefined;
    if (rule instanceof RegExp) {
        return { value: rule };
    }
    return rule;
}

function normalizeValidateOption(
    validate?: ValidateFunction<any, any> | Record<string, ValidateFunction<any, any>>
): Record<string, ValidateFunction<any, any>> | undefined {
    if (!validate) return undefined;
    if (typeof validate === 'function') {
        return { $default: validate };
    }
    return validate;
}

function mergeValidateOptions(
    base?: ValidateFunction<any, any> | Record<string, ValidateFunction<any, any>>,
    override?: ValidateFunction<any, any> | Record<string, ValidateFunction<any, any>>
): ValidateFunction<any, any> | Record<string, ValidateFunction<any, any>> | undefined {
    if (!base) return override;
    if (!override) return base;

    const baseRecord = normalizeValidateOption(base) ?? {};
    const overrideRecord = normalizeValidateOption(override) ?? {};

    const merged: Record<string, ValidateFunction<any, any>> = { ...baseRecord };
    for (const [key, fn] of Object.entries(overrideRecord)) {
        if (merged[key]) {
            let suffix = 1;
            let candidate = `${key}_${suffix}`;
            while (merged[candidate]) {
                suffix++;
                candidate = `${key}_${suffix}`;
            }
            merged[candidate] = fn;
        } else {
            merged[key] = fn;
        }
    }

    return merged;
}

function mergeDeps(base?: string[], override?: string[]): string[] | undefined {
    if (!base && !override) return undefined;
    const combined = [...(base ?? []), ...(override ?? [])];
    const unique = Array.from(new Set(combined.filter(Boolean)));
    return unique.length ? unique : undefined;
}

function mergeRegisterOptions(
    base?: AnyRegisterOptions,
    override?: AnyRegisterOptions
): AnyRegisterOptions | undefined {
    if (!base) return override;
    if (!override) return base;

    const merged: AnyRegisterOptions = { ...base, ...override };
    merged.validate = mergeValidateOptions(base.validate, override.validate);
    merged.deps = mergeDeps(base.deps, override.deps);
    return merged;
}

function normalizeFieldPathKey(path: string): string {
    return path
        .split('.')
        .map(segment => (/^\d+$/.test(segment) ? '*' : segment))
        .join('.');
}

function resolveValidationRule<T extends Record<string, any>>(
    fieldName: string,
    rules?: ValidationRulesMap<T>
): RegisterOptions<any, T> | undefined {
    if (!rules) return undefined;
    if (rules[fieldName]) {
        return rules[fieldName];
    }

    const wildcardKey = normalizeFieldPathKey(fieldName);
    return rules[wildcardKey] ?? undefined;
}

function createErrorCollector(criteriaMode: 'firstError' | 'all') {
    let currentError: FieldError | undefined;

    return {
        add(type: string, message: string) {
            if (!currentError) {
                currentError = { type, message };
                if (criteriaMode === 'all') {
                    currentError.types = { [type]: message };
                }
                return criteriaMode === 'firstError';
            }

            if (criteriaMode === 'all') {
                currentError.types = currentError.types ?? { [currentError.type]: currentError.message };
                currentError.types[type] = message;
                return false;
            }

            return true;
        },
        get() {
            return currentError;
        },
    };
}

// ============================================================================
// Field Validation
// ============================================================================

async function validateField<TFieldValue, TFormValues extends Record<string, any>>(
    value: TFieldValue,
    options: RegisterOptions<TFieldValue, TFormValues> | undefined,
    context: Omit<FieldValidationContext<TFormValues>, 'value'>,
    criteriaMode: 'firstError' | 'all'
): Promise<FieldError | undefined> {
    if (!options) return undefined;

    const collector = createErrorCollector(criteriaMode);
    const validationContext: FieldValidationContext<TFormValues> = { ...context, value };

    const requiredRule = normalizeRequiredRule(options.required);
    const isValueEmpty = isEmptyValue(value);

    if (requiredRule?.value) {
        if (isValueEmpty) {
            collector.add('required', requiredRule.message ?? 'This field is required');
            return collector.get();
        }
    } else if (isValueEmpty) {
        return undefined;
    }

    const numericRules: Array<{ option?: NumericRule; type: string; comparator: (ruleValue: number, current: number) => boolean; defaultMessage: (ruleValue: number) => string }> = [
        {
            option: options.min,
            type: 'min',
            comparator: (ruleValue, current) => current < ruleValue,
            defaultMessage: (ruleValue) => `Minimum value is ${ruleValue}`,
        },
        {
            option: options.max,
            type: 'max',
            comparator: (ruleValue, current) => current > ruleValue,
            defaultMessage: (ruleValue) => `Maximum value is ${ruleValue}`,
        },
    ];

    for (const numericRule of numericRules) {
        if (numericRule.option !== undefined) {
            const rule = normalizeNumericRule(numericRule.option);
            if (rule) {
                const numericValue = typeof value === 'number' ? value : Number(value);
                if (!isNaN(numericValue) && numericRule.comparator(rule.value, numericValue)) {
                    const shouldStop = collector.add(
                        numericRule.type,
                        rule.message ?? numericRule.defaultMessage(rule.value)
                    );
                    if (shouldStop) {
                        return collector.get();
                    }
                }
            }
        }
    }

    const lengthRules: Array<{ option?: NumericRule; type: string; predicate: (length: number, ruleValue: number) => boolean; defaultMessage: (ruleValue: number) => string }> = [
        {
            option: options.minLength,
            type: 'minLength',
            predicate: (length, ruleValue) => length < ruleValue,
            defaultMessage: (ruleValue) => `Minimum length is ${ruleValue}`,
        },
        {
            option: options.maxLength,
            type: 'maxLength',
            predicate: (length, ruleValue) => length > ruleValue,
            defaultMessage: (ruleValue) => `Maximum length is ${ruleValue}`,
        },
    ];

    for (const lengthRule of lengthRules) {
        if (lengthRule.option !== undefined && value !== undefined && value !== null) {
            const rule = normalizeNumericRule(lengthRule.option);
            if (rule) {
                const currentLength = (value as any).length;
                if (typeof currentLength === 'number' && lengthRule.predicate(currentLength, rule.value)) {
                    const shouldStop = collector.add(
                        lengthRule.type,
                        rule.message ?? lengthRule.defaultMessage(rule.value)
                    );
                    if (shouldStop) {
                        return collector.get();
                    }
                }
            }
        }
    }

    if (options.pattern !== undefined && typeof value === 'string') {
        const patternRule = normalizePatternRule(options.pattern);
        if (patternRule && !patternRule.value.test(value)) {
            const shouldStop = collector.add('pattern', patternRule.message ?? 'Invalid format');
            if (shouldStop) {
                return collector.get();
            }
        }
    }

    const validateEntries = normalizeValidateOption(options.validate);
    if (validateEntries) {
        for (const [key, validateFn] of Object.entries(validateEntries)) {
            const result = await validateFn(value, validationContext);
            if (result !== true) {
                let message = 'Validation failed';
                let type = key || 'validate';

                if (typeof result === 'string') {
                    message = result;
                } else if (result && typeof result === 'object') {
                    message = result.message ?? message;
                    if (result.type) {
                        type = result.type;
                    }
                }

                const shouldStop = collector.add(type, message);
                if (shouldStop) {
                    return collector.get();
                }
            }
        }
    }

    return collector.get();
}

// ============================================================================
// useForm Hook
// ============================================================================

/**
 * Main form hook for managing form state, validation, and submission.
 *
 * @template T - The type of your form data object
 * @param config - Form configuration options
 * @returns Form methods and state
 *
 * @example Basic Form
 * ```tsx
 * interface ContactForm {
 *   name: string;
 *   email: string;
 *   message: string;
 * }
 *
 * const { register, handleSubmit, errors } = useForm<ContactForm>({
 *   defaultValues: { name: '', email: '', message: '' }
 * });
 *
 * <form onSubmit={handleSubmit((data) => sendMessage(data))}>
 *   <input {...register('name', { required: 'Name is required' })} />
 *   <input {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })} />
 *   <textarea {...register('message', { minLength: 10 })} />
 *   <button type="submit">Send</button>
 * </form>
 * ```
 *
 * @example With Schema Validation
 * ```tsx
 * const schema = v.object({
 *   email: v.string().email(),
 *   password: v.string().min(8),
 * });
 *
 * const { register, handleSubmit } = useForm({
 *   schema,
 *   mode: 'onBlur',
 * });
 * ```
 *
 * @example Watching Values
 * ```tsx
 * const { watch, register } = useForm<{ country: string; state: string }>();
 *
 * // Watch single field
 * const country = watch('country');
 *
 * // Watch all fields
 * const allValues = watch();
 *
 * // Watch with callback
 * watch((data, { name, type }) => {
 *   console.log('Field changed:', name, data);
 * });
 * ```
 *
 * @example Programmatic Control
 * ```tsx
 * const { setValue, getValues, reset, trigger, setError, clearErrors } = useForm();
 *
 * // Set value programmatically
 * setValue('email', 'user@example.com', { shouldValidate: true });
 *
 * // Get current values
 * const email = getValues('email');
 * const allValues = getValues();
 *
 * // Reset form
 * reset(); // Reset to default values
 * reset({ email: 'new@email.com' }); // Reset to specific values
 *
 * // Trigger validation manually
 * await trigger('email'); // Single field
 * await trigger(['email', 'password']); // Multiple fields
 * await trigger(); // All fields
 *
 * // Set error manually
 * setError('email', { type: 'custom', message: 'Email already exists' });
 *
 * // Clear errors
 * clearErrors('email');
 * clearErrors(); // Clear all
 * ```
 */
export function useForm<T extends Record<string, any>>(
    config: UseFormConfig<T> = {}
): UseFormReturn<T> {
    const {
        defaultValues: initialDefaultValues = {} as T,
        values: controlledValues,
        mode = 'onSubmit',
        revalidateMode = 'onChange',
        criteriaMode = 'firstError',
        shouldFocusError = true,
        delayError,
        resolver,
        disabled = false,
        validationRules,
    } = config;

    // Resolve default values
    const getDefaultValues = (): T => {
        if (typeof initialDefaultValues === 'function') {
            const result = (initialDefaultValues as () => T | Promise<T>)();
            if (result instanceof Promise) {
                // Handle async default values
                return {} as T;
            }
            return result;
        }
        return initialDefaultValues;
    };

    const defaultValues = getDefaultValues();

    // Core state signals
    const [values, setValues] = createSignal<T>(cloneDeep(controlledValues ?? defaultValues));
    const [errors, setErrors] = createSignal<FieldErrors<T>>({});
    const [touchedFields, setTouchedFields] = createSignal<Partial<Record<keyof T, boolean>>>({});
    const [dirtyFields, setDirtyFields] = createSignal<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [isSubmitted, setIsSubmitted] = createSignal(false);
    const [isSubmitSuccessful, setIsSubmitSuccessful] = createSignal(false);
    const [submitCount, setSubmitCount] = createSignal(0);
    const [isValidating, setIsValidating] = createSignal(false);
    const [formDisabled, setFormDisabled] = createSignal(disabled);

    // Field references
    const fields = new Map<string, FieldRef>();
    const watchCallbacks = new Set<(data: T, info: { name?: keyof T; type?: string }) => void>();

    const validationRuleMap: ValidationRulesMap<T> | undefined = validationRules
        ? Object.entries(validationRules).reduce((acc, [key, value]) => {
            if (value) {
                acc[key] = value as RegisterOptions<any, T>;
            }
            return acc;
        }, {} as ValidationRulesMap<T>)
        : undefined;

    const getMergedOptions = (
        fieldName: string,
        local?: RegisterOptions<any, T>
    ): RegisterOptions<any, T> | undefined => {
        const preset = resolveValidationRule(fieldName, validationRuleMap);
        return mergeRegisterOptions(preset, local);
    };

    // Update values when controlled values change
    if (controlledValues) {
        createEffect(() => {
            setValues(cloneDeep(controlledValues));
        });
    }

    // Derived state
    const isDirty = createMemo(() => Object.keys(dirtyFields()).length > 0);
    const isValid = createMemo(() => Object.keys(errors()).length === 0);

    // Form state accessor
    const formState = (): FormState<T> => ({
        isDirty: isDirty(),
        isValid: isValid(),
        isSubmitting: isSubmitting(),
        isSubmitted: isSubmitted(),
        isSubmitSuccessful: isSubmitSuccessful(),
        submitCount: submitCount(),
        errors: errors(),
        touchedFields: touchedFields(),
        dirtyFields: dirtyFields(),
        isValidating: isValidating(),
        disabled: formDisabled(),
    });

    // Validation
    const validateFieldInternal = async (name: string): Promise<FieldError | undefined> => {
        const field = fields.get(name);
        const currentValues = values();
        const value = getByPath(currentValues, name);
        const snapshot = formState();

        return validateField(value, field?.options as RegisterOptions<any, T>, {
            name,
            values: currentValues,
            formState: snapshot,
            getValue: (path) => getByPath(currentValues, path as string),
            options: field?.options as RegisterOptions<any, T> | undefined,
        }, criteriaMode);
    };

    const validateForm = async (): Promise<FieldErrors<T>> => {
        setIsValidating(true);

        try {
            let allErrors: FieldErrors<T> = {};

            // Custom resolver
            if (resolver) {
                const result = await resolver(values());
                allErrors = result.errors;
            }

            const currentValues = values();
            const snapshot = formState();

            // Field-level validation (runs even with schema)
            for (const [name, field] of fields) {
                if (!allErrors[name as keyof T]) {
                    const error = await validateField(getByPath(currentValues, name), field.options as RegisterOptions<any, T>, {
                        name,
                        values: currentValues,
                        formState: snapshot,
                        getValue: (path) => getByPath(currentValues, path as string),
                        options: field.options as RegisterOptions<any, T> | undefined,
                    }, criteriaMode);
                    if (error) {
                        allErrors[name as keyof T] = error;
                    }
                }
            }

            return allErrors;
        } finally {
            setIsValidating(false);
        }
    };

    const shouldValidate = (name: string, eventType: 'change' | 'blur'): boolean => {
        const touched = touchedFields()[name as keyof T];

        switch (mode) {
            case 'onChange':
                return eventType === 'change';
            case 'onBlur':
                return eventType === 'blur';
            case 'onTouched':
                return touched ?? false;
            case 'all':
                return true;
            case 'onSubmit':
            default:
                // Revalidate if already has error and in revalidate mode
                if (errors()[name as keyof T]) {
                    if (revalidateMode === 'onChange' && eventType === 'change') return true;
                    if (revalidateMode === 'onBlur' && eventType === 'blur') return true;
                }
                return false;
        }
    };

    // Get value from input
    const getInputValue = (event: Event, options?: RegisterOptions<any, T>): any => {
        const target = event.target as HTMLInputElement;

        if (!target) return undefined;

        let value: any;

        // Handle different input types
        if (target.type === 'checkbox') {
            value = target.checked;
        } else if (target.type === 'file') {
            value = target.files;
        } else if (target.type === 'select-multiple') {
            const selectEl = target as unknown as HTMLSelectElement;
            value = Array.from(selectEl.selectedOptions).map(o => o.value);
        } else {
            value = target.value;
        }

        // Apply transformations
        if (options?.valueAsNumber) {
            const num = parseFloat(value);
            value = isNaN(num) ? undefined : num;
        } else if (options?.valueAsDate) {
            value = value ? new Date(value) : undefined;
        } else if (options?.setValueAs) {
            value = options.setValueAs(value);
        }

        return value;
    };

    // Register a field
    const register = <K extends keyof T | string>(
        name: K,
        options?: RegisterOptions<PathValue<T, K & string>, T>
    ): UseFormRegisterReturn => {
        const fieldName = name as string;
        const mergedOptions = getMergedOptions(fieldName, options as RegisterOptions<any, T>);

        // Store field reference
        fields.set(fieldName, {
            name: fieldName,
            options: mergedOptions as RegisterOptions<any, any>,
        });

        const onChange = async (event: Event) => {
            const inputValue = getInputValue(event, mergedOptions);
            console.log('[form.ts onChange] field:', fieldName, 'value:', inputValue);

            batch(() => {
                // Update value
                const prevVals = values();
                const nextVals = setByPath(prevVals, fieldName, inputValue);
                console.log('[form.ts onChange] setting values from', prevVals, 'to', nextVals);
                setValues(nextVals as T);

                // Mark as dirty
                const defaultValue = getByPath(defaultValues, fieldName);
                if (!deepEqual(inputValue, defaultValue)) {
                    setDirtyFields(prev => ({ ...prev, [fieldName]: true }));
                } else {
                    setDirtyFields(prev => {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    });
                }
            });

            console.log('[form.ts onChange] after batch, values():', values());

            // Notify watchers
            for (const callback of watchCallbacks) {
                callback(values(), { name: fieldName as keyof T, type: 'change' });
            }

            // Validate if needed
            if (shouldValidate(fieldName, 'change')) {
                const error = await validateFieldInternal(fieldName);
                setErrors(prev => {
                    if (error) {
                        return { ...prev, [fieldName]: error };
                    } else {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    }
                });
            }

            // Validate dependent fields
            if (mergedOptions?.deps) {
                for (const dep of mergedOptions.deps) {
                    if (shouldValidate(dep, 'change')) {
                        const error = await validateFieldInternal(dep);
                        setErrors(prev => {
                            if (error) {
                                return { ...prev, [dep]: error };
                            } else {
                                const next = { ...prev };
                                delete next[dep as keyof T];
                                return next;
                            }
                        });
                    }
                }
            }

            // Call user's onChange
            mergedOptions?.onChange?.(event);
        };

        const onBlur = async (event: Event) => {
            // Mark as touched
            setTouchedFields(prev => ({ ...prev, [fieldName]: true }));

            // Validate if needed
            if (shouldValidate(fieldName, 'blur')) {
                const error = await validateFieldInternal(fieldName);
                setErrors(prev => {
                    if (error) {
                        return { ...prev, [fieldName]: error };
                    } else {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    }
                });
            }

            // Validate dependent fields on blur when requested
            if (mergedOptions?.deps) {
                for (const dep of mergedOptions.deps) {
                    if (shouldValidate(dep, 'blur')) {
                        const error = await validateFieldInternal(dep);
                        setErrors(prev => {
                            if (error) {
                                return { ...prev, [dep]: error };
                            } else {
                                const next = { ...prev };
                                delete next[dep as keyof T];
                                return next;
                            }
                        });
                    }
                }
            }

            // Call user's onBlur
            mergedOptions?.onBlur?.(event);
        };

        const ref = (element: HTMLElement | null) => {
            const field = fields.get(fieldName);
            if (field) {
                field.ref = element;
            }

            // Set initial value from defaultValues only on mount
            if (element && 'value' in element) {
                const defaultValue = getByPath(defaultValues, fieldName);
                const inputEl = element as HTMLInputElement;

                if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
                    inputEl.checked = Boolean(defaultValue);
                } else if (defaultValue !== undefined) {
                    inputEl.value = String(defaultValue);
                }
            }
        };

        return {
            name: fieldName,
            ref,
            onInput: onChange,  // Use onInput for real-time updates while typing
            onChange,           // Also keep onChange for select, checkbox, etc.
            onBlur,
            disabled: mergedOptions?.disabled || formDisabled(),
        };
    };

    // Unregister field
    const unregister = (
        name: keyof T | string | (keyof T | string)[],
        options?: { keepValue?: boolean; keepError?: boolean; keepDirty?: boolean; keepTouched?: boolean }
    ): void => {
        const names = Array.isArray(name) ? name : [name];

        batch(() => {
            for (const n of names) {
                const fieldName = n as string;

                fields.delete(fieldName);

                if (!options?.keepValue) {
                    setValues(prev => deleteByPath(prev, fieldName));
                }
                if (!options?.keepError) {
                    setErrors(prev => {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    });
                }
                if (!options?.keepDirty) {
                    setDirtyFields(prev => {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    });
                }
                if (!options?.keepTouched) {
                    setTouchedFields(prev => {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    });
                }
            }
        });
    };

    // Handle submit
    const handleSubmit = (
        onValid: SubmitHandler<T>,
        onInvalid?: SubmitErrorHandler<T>
    ) => {
        return async (e?: Event) => {
            e?.preventDefault?.();

            setIsSubmitting(true);
            setSubmitCount(prev => prev + 1);

            try {
                // Validate all fields
                const formErrors = await validateForm();
                setErrors(formErrors);

                const hasErrors = Object.keys(formErrors).length > 0;

                if (hasErrors) {
                    setIsSubmitted(true);
                    setIsSubmitSuccessful(false);

                    // Focus first error
                    if (shouldFocusError) {
                        const firstErrorField = Object.keys(formErrors)[0];
                        const field = fields.get(firstErrorField);
                        if (field?.ref && 'focus' in field.ref) {
                            (field.ref as HTMLElement).focus();
                        }
                    }

                    onInvalid?.(formErrors, e);
                } else {
                    await onValid(values(), e);
                    setIsSubmitted(true);
                    setIsSubmitSuccessful(true);
                }
            } catch (error) {
                setIsSubmitSuccessful(false);
                throw error;
            } finally {
                setIsSubmitting(false);
            }
        };
    };

    // Watch values - returns reactive accessors for use in effects/memos
    function watch(): () => T;
    function watch<K extends keyof T>(name: K): () => T[K];
    function watch(names: (keyof T)[]): () => Partial<T>;
    function watch(callback: (data: T, info: { name?: keyof T; type?: string }) => void): () => void;
    function watch(nameOrCallback?: any): any {
        if (typeof nameOrCallback === 'function') {
            watchCallbacks.add(nameOrCallback);
            return () => watchCallbacks.delete(nameOrCallback);
        }

        if (nameOrCallback === undefined) {
            // Return accessor for all values
            return () => values();
        }

        if (Array.isArray(nameOrCallback)) {
            // Return accessor for subset of values
            return () => {
                const result: Record<string, any> = {};
                for (const name of nameOrCallback) {
                    result[name as string] = getByPath(values(), name as string);
                }
                return result as Partial<T>;
            };
        }

        // Return accessor for single field
        return () => getByPath(values(), nameOrCallback as string);
    }

    // Get values (tracks when called in effects for reactive display)
    function getValues(): T;
    function getValues<K extends keyof T>(name: K): T[K];
    function getValues(names: (keyof T)[]): Partial<T>;
    function getValues(nameOrNames?: any): any {
        const currentValues = values(); // Track the signal!

        if (nameOrNames === undefined) {
            return currentValues;
        }

        if (Array.isArray(nameOrNames)) {
            const result: Record<string, any> = {};
            for (const name of nameOrNames) {
                result[name as string] = getByPath(currentValues, name as string);
            }
            return result as Partial<T>;
        }

        return getByPath(currentValues, nameOrNames as string);
    }

    // Get field state
    const getFieldState = (name: keyof T) => {
        return {
            invalid: !!errors()[name],
            isDirty: !!dirtyFields()[name],
            isTouched: !!touchedFields()[name],
            error: errors()[name],
        };
    };

    // Set value
    const setValue = <K extends keyof T | string>(
        name: K,
        value: PathValue<T, K & string>,
        options?: SetValueOptions
    ): void => {
        const fieldName = name as string;
        const { shouldValidate: validate = false, shouldDirty = true, shouldTouch = false } = options ?? {};

        batch(() => {
            setValues(prev => setByPath(prev, fieldName, value));

            if (shouldDirty) {
                const defaultValue = getByPath(defaultValues, fieldName);
                if (!deepEqual(value, defaultValue)) {
                    setDirtyFields(prev => ({ ...prev, [fieldName]: true }));
                } else {
                    setDirtyFields(prev => {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    });
                }
            }

            if (shouldTouch) {
                setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
            }
        });

        // Update DOM
        const field = fields.get(fieldName);
        if (field?.ref && 'value' in field.ref) {
            (field.ref as HTMLInputElement).value = String(value ?? '');
        }

        // Validate
        if (validate) {
            validateFieldInternal(fieldName).then(error => {
                setErrors(prev => {
                    if (error) {
                        return { ...prev, [fieldName]: error };
                    } else {
                        const next = { ...prev };
                        delete next[fieldName as keyof T];
                        return next;
                    }
                });
            });
        }

        // Notify watchers
        for (const callback of watchCallbacks) {
            callback(values(), { name: fieldName as keyof T, type: 'change' });
        }
    };

    // Reset form
    const reset = (
        newValues?: T | ((values: T) => T),
        options?: ResetOptions
    ): void => {
        const {
            keepErrors = false,
            keepDirty = false,
            keepDirtyValues = false,
            keepValues = false,
            keepDefaultValues = false,
            keepIsSubmitted = false,
            keepTouched = false,
            keepIsValid = false,
            keepSubmitCount = false,
        } = options ?? {};

        batch(() => {
            if (!keepValues && !keepDirtyValues) {
                const resetValues = typeof newValues === 'function'
                    ? newValues(values())
                    : newValues ?? defaultValues;
                setValues(cloneDeep(resetValues));

                // Update DOM
                for (const [name, field] of fields) {
                    if (field.ref && 'value' in field.ref) {
                        const value = getByPath(resetValues, name);
                        (field.ref as HTMLInputElement).value = String(value ?? '');
                    }
                }
            } else if (keepDirtyValues) {
                const resetValues = typeof newValues === 'function'
                    ? newValues(values())
                    : newValues ?? defaultValues;
                const dirty = dirtyFields();
                const merged = { ...resetValues } as T;

                for (const key of Object.keys(dirty)) {
                    const value = getByPath(values(), key);
                    setByPath(merged, key, value);
                }

                setValues(merged);
            }

            if (!keepErrors) setErrors({});
            if (!keepDirty) setDirtyFields({});
            if (!keepTouched) setTouchedFields({});
            if (!keepIsSubmitted) {
                setIsSubmitted(false);
                setIsSubmitSuccessful(false);
            }
            if (!keepSubmitCount) setSubmitCount(0);
        });
    };

    // Reset field
    const resetField = (
        name: keyof T,
        options?: { keepDirty?: boolean; keepTouched?: boolean; keepError?: boolean; defaultValue?: any }
    ): void => {
        const fieldName = name as string;
        const defaultValue = options?.defaultValue ?? getByPath(defaultValues, fieldName);

        batch(() => {
            setValues(prev => setByPath(prev, fieldName, defaultValue));

            if (!options?.keepDirty) {
                setDirtyFields(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }

            if (!options?.keepTouched) {
                setTouchedFields(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }

            if (!options?.keepError) {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }
        });

        // Update DOM
        const field = fields.get(fieldName);
        if (field?.ref && 'value' in field.ref) {
            (field.ref as HTMLInputElement).value = String(defaultValue ?? '');
        }
    };

    // Clear errors
    const clearErrors = (name?: keyof T | (keyof T)[] | string): void => {
        if (name === undefined) {
            setErrors({});
            return;
        }

        const names = Array.isArray(name) ? name : [name];

        setErrors(prev => {
            const next = { ...prev };
            for (const n of names) {
                delete next[n as keyof T];
            }
            return next;
        });
    };

    // Set error
    const setError = (
        name: keyof T | 'root' | string,
        error: FieldError,
        options?: { shouldFocus?: boolean }
    ): void => {
        setErrors(prev => ({ ...prev, [name]: error }));

        if (options?.shouldFocus) {
            const field = fields.get(name as string);
            if (field?.ref && 'focus' in field.ref) {
                (field.ref as HTMLElement).focus();
            }
        }
    };

    // Set focus
    const setFocus = (name: keyof T, options?: { shouldSelect?: boolean }): void => {
        const field = fields.get(name as string);
        if (field?.ref) {
            if ('focus' in field.ref) {
                (field.ref as HTMLElement).focus();
            }
            if (options?.shouldSelect && 'select' in field.ref) {
                (field.ref as HTMLInputElement).select();
            }
        }
    };

    // Trigger validation
    const trigger = async (name?: keyof T | (keyof T)[]): Promise<boolean> => {
        if (name === undefined) {
            const formErrors = await validateForm();
            setErrors(formErrors);
            return Object.keys(formErrors).length === 0;
        }

        const names = Array.isArray(name) ? name : [name];
        let isValid = true;

        for (const n of names) {
            const error = await validateFieldInternal(n as string);
            setErrors(prev => {
                if (error) {
                    isValid = false;
                    return { ...prev, [n]: error };
                } else {
                    const next = { ...prev };
                    delete next[n];
                    return next;
                }
            });
        }

        return isValid;
    };

    // Control object for field arrays
    const control: FormControl<T> = {
        _formState: formState,
        _getFieldValue: (name: string) => getByPath(values(), name),
        _setFieldValue: (name: string, value: any) => {
            setValues(prev => setByPath(prev, name, value));
        },
        _register: (name: string, options?: RegisterOptions<any, T>) => {
            const merged = getMergedOptions(name, options);
            fields.set(name, { name, options: merged as RegisterOptions<any, any> });
        },
        _unregister: (name: string) => {
            fields.delete(name);
        },
        _fields: fields,
        _defaultValues: defaultValues,
    };

    return {
        register,
        unregister,
        handleSubmit,
        formState,
        errors,
        watch: watch as any,
        getValues: getValues as any,
        getFieldState,
        setValue,
        reset,
        resetField,
        clearErrors,
        setError,
        setFocus,
        trigger,
        control,
        // Direct signal accessors for reactive tracking
        isSubmitting,
        isSubmitted,
        isSubmitSuccessful,
        isDirty,
        isValid,
        isValidating,
    };
}

// ============================================================================
// useFieldArray Hook
// ============================================================================

export interface UseFieldArrayConfig<T extends Record<string, any>, K extends keyof T> {
    control: FormControl<T>;
    name: K;
    keyName?: string;
    rules?: { minLength?: number; maxLength?: number };
}

export interface UseFieldArrayReturn<T> {
    fields: () => FieldArrayField<T>[];
    append: (value: T | T[], options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }) => void;
    prepend: (value: T | T[], options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }) => void;
    insert: (index: number, value: T | T[], options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }) => void;
    remove: (index?: number | number[]) => void;
    swap: (indexA: number, indexB: number) => void;
    move: (from: number, to: number) => void;
    update: (index: number, value: T) => void;
    replace: (values: T[]) => void;
}

/**
 * Hook for managing dynamic field arrays (add/remove/reorder items).
 *
 * @template T - Form data type
 * @template K - Key of the array field in form data
 * @param config - Field array configuration
 * @returns Field array methods
 *
 * @example Basic Usage - Todo List
 * ```tsx
 * interface TodoForm {
 *   todos: Array<{ text: string; completed: boolean }>;
 * }
 *
 * function TodoList() {
 *   const { register, control, handleSubmit } = useForm<TodoForm>({
 *     defaultValues: { todos: [{ text: '', completed: false }] }
 *   });
 *
 *   const { fields, append, remove } = useFieldArray({ control, name: 'todos' });
 *
 *   return (
 *     <form onSubmit={handleSubmit(console.log)}>
 *       {fields().map((field, index) => (
 *         <div key={field.id}>
 *           <input {...register(`todos.${index}.text`)} placeholder="Todo item" />
 *           <input {...register(`todos.${index}.completed`)} type="checkbox" />
 *           <button type="button" onClick={() => remove(index)}>Delete</button>
 *         </div>
 *       ))}
 *
 *       <button type="button" onClick={() => append({ text: '', completed: false })}>
 *         Add Todo
 *       </button>
 *       <button type="submit">Save</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example Order Form with Calculations
 * ```tsx
 * interface OrderForm {
 *   items: Array<{ product: string; quantity: number; price: number }>;
 * }
 *
 * function OrderForm() {
 *   const { register, control, watch } = useForm<OrderForm>({
 *     defaultValues: { items: [] }
 *   });
 *
 *   const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });
 *
 *   const items = watch('items');
 *   const total = items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) ?? 0;
 *
 *   return (
 *     <div>
 *       {fields().map((field, index) => (
 *         <div key={field.id} class="flex gap-2">
 *           <input {...register(`items.${index}.product`)} />
 *           <input {...register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" />
 *           <input {...register(`items.${index}.price`, { valueAsNumber: true })} type="number" step="0.01" />
 *           <button onClick={() => index > 0 && move(index, index - 1)}>↑</button>
 *           <button onClick={() => index < fields().length - 1 && move(index, index + 1)}>↓</button>
 *           <button onClick={() => remove(index)}>×</button>
 *         </div>
 *       ))}
 *
 *       <button onClick={() => append({ product: '', quantity: 1, price: 0 })}>
 *         Add Item
 *       </button>
 *
 *       <p>Total: ${total.toFixed(2)}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example All Field Array Methods
 * ```tsx
 * const { fields, append, prepend, insert, remove, swap, move, update, replace } = useFieldArray({
 *   control,
 *   name: 'items'
 * });
 *
 * // Add to end
 * append({ name: 'New Item' });
 * append([{ name: 'Item 1' }, { name: 'Item 2' }]); // Add multiple
 *
 * // Add to beginning
 * prepend({ name: 'First Item' });
 *
 * // Insert at specific index
 * insert(2, { name: 'Inserted at index 2' });
 *
 * // Remove items
 * remove(0); // Remove first
 * remove([0, 2, 4]); // Remove multiple
 * remove(); // Remove all
 *
 * // Reorder
 * swap(0, 1); // Swap positions
 * move(3, 0); // Move from index 3 to index 0
 *
 * // Update specific item
 * update(0, { name: 'Updated name' });
 *
 * // Replace all items
 * replace([{ name: 'A' }, { name: 'B' }]);
 * ```
 */
export function useFieldArray<
    T extends Record<string, any>,
    K extends keyof T
>(config: UseFieldArrayConfig<T, K>): UseFieldArrayReturn<T[K] extends (infer U)[] ? U : never> {
    type FieldType = T[K] extends (infer U)[] ? U : never;

    const { control, name, keyName = 'id' } = config;

    // Get initial values
    const getInitialFields = (): FieldArrayField<FieldType>[] => {
        const values = control._getFieldValue(name as string) ?? [];
        return values.map((value: FieldType) => ({
            id: generateId(),
            value,
        }));
    };

    const [fieldsState, setFieldsState] = createSignal<FieldArrayField<FieldType>[]>(getInitialFields());

    // Sync with form values
    const syncToForm = (newFields: FieldArrayField<FieldType>[]) => {
        const values = newFields.map(f => f.value);
        control._setFieldValue(name as string, values);
    };

    const fields = () => fieldsState();

    const append = (
        value: FieldType | FieldType[],
        options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }
    ) => {
        const values = Array.isArray(value) ? value : [value];
        const newFields = values.map(v => ({ id: generateId(), value: v }));

        setFieldsState(prev => {
            const result = [...prev, ...newFields];
            syncToForm(result);
            return result;
        });
    };

    const prepend = (
        value: FieldType | FieldType[],
        options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }
    ) => {
        const values = Array.isArray(value) ? value : [value];
        const newFields = values.map(v => ({ id: generateId(), value: v }));

        setFieldsState(prev => {
            const result = [...newFields, ...prev];
            syncToForm(result);
            return result;
        });
    };

    const insert = (
        index: number,
        value: FieldType | FieldType[],
        options?: { focusIndex?: number; focusName?: string; shouldFocus?: boolean }
    ) => {
        const values = Array.isArray(value) ? value : [value];
        const newFields = values.map(v => ({ id: generateId(), value: v }));

        setFieldsState(prev => {
            const result = [...prev.slice(0, index), ...newFields, ...prev.slice(index)];
            syncToForm(result);
            return result;
        });
    };

    const remove = (index?: number | number[]) => {
        if (index === undefined) {
            setFieldsState([]);
            syncToForm([]);
            return;
        }

        const indices = Array.isArray(index) ? index : [index];
        const indexSet = new Set(indices);

        setFieldsState(prev => {
            const result = prev.filter((_, i) => !indexSet.has(i));
            syncToForm(result);
            return result;
        });
    };

    const swap = (indexA: number, indexB: number) => {
        setFieldsState(prev => {
            const result = [...prev];
            [result[indexA], result[indexB]] = [result[indexB], result[indexA]];
            syncToForm(result);
            return result;
        });
    };

    const move = (from: number, to: number) => {
        setFieldsState(prev => {
            const result = [...prev];
            const [item] = result.splice(from, 1);
            result.splice(to, 0, item);
            syncToForm(result);
            return result;
        });
    };

    const update = (index: number, value: FieldType) => {
        setFieldsState(prev => {
            const result = [...prev];
            result[index] = { ...result[index], value };
            syncToForm(result);
            return result;
        });
    };

    const replace = (values: FieldType[]) => {
        const newFields = values.map(v => ({ id: generateId(), value: v }));
        setFieldsState(newFields);
        syncToForm(newFields);
    };

    return {
        fields,
        append,
        prepend,
        insert,
        remove,
        swap,
        move,
        update,
        replace,
    };
}

// ============================================================================
// useWatch Hook
// ============================================================================

export interface UseWatchConfig<T extends Record<string, any>> {
    control: FormControl<T>;
    name?: keyof T | (keyof T)[];
    defaultValue?: any;
    disabled?: boolean;
    exact?: boolean;
}

export function useWatch<T extends Record<string, any>>(
    config: UseWatchConfig<T>
): () => any {
    const { control, name, defaultValue, disabled = false } = config;

    const [value, setValue] = createSignal<any>(
        name
            ? Array.isArray(name)
                ? name.map(n => control._getFieldValue(n as string) ?? defaultValue)
                : control._getFieldValue(name as string) ?? defaultValue
            : control._getFieldValue('') ?? defaultValue
    );

    if (!disabled) {
        createEffect(() => {
            const formState = control._formState();
            // Re-read value when form state changes
            if (name) {
                if (Array.isArray(name)) {
                    setValue(name.map(n => control._getFieldValue(n as string)));
                } else {
                    setValue(control._getFieldValue(name as string));
                }
            }
        });
    }

    return value;
}

// ============================================================================
// useFormState Hook
// ============================================================================

export interface UseFormStateConfig<T extends Record<string, any>> {
    control: FormControl<T>;
    name?: keyof T | (keyof T)[];
    disabled?: boolean;
    exact?: boolean;
}

export function useFormState<T extends Record<string, any>>(
    config: UseFormStateConfig<T>
): () => FormState<T> {
    const { control, disabled = false } = config;

    if (disabled) {
        return () => control._formState();
    }

    return control._formState;
}

// ============================================================================
// useController Hook
// ============================================================================

export interface UseControllerConfig<T extends Record<string, any>, K extends keyof T> {
    control: FormControl<T>;
    name: K;
    rules?: RegisterOptions<T[K], T>;
    shouldUnregister?: boolean;
    defaultValue?: T[K];
}

export interface UseControllerReturn<T> {
    field: {
        name: string;
        value: () => T;
        onChange: (value: T) => void;
        onBlur: () => void;
        ref: (element: HTMLElement | null) => void;
    };
    fieldState: () => {
        invalid: boolean;
        isTouched: boolean;
        isDirty: boolean;
        error?: FieldError;
    };
    formState: () => FormState<any>;
}

export function useController<
    T extends Record<string, any>,
    K extends keyof T
>(config: UseControllerConfig<T, K>): UseControllerReturn<T[K]> {
    const { control, name, rules, shouldUnregister = false, defaultValue } = config;

    const fieldName = name as string;
    let fieldRef: HTMLElement | null = null;

    // Register field
    control._register(fieldName, rules);

    // Cleanup
    if (shouldUnregister) {
        onCleanup(() => {
            control._unregister(fieldName);
        });
    }

    // Get current value
    const value = () => control._getFieldValue(fieldName) ?? defaultValue;

    const onChange = (newValue: T[K]) => {
        control._setFieldValue(fieldName, newValue);
    };

    const onBlur = () => {
        // Trigger touched state (would need to extend control)
    };

    const ref = (element: HTMLElement | null) => {
        fieldRef = element;
        const field = control._fields.get(fieldName);
        if (field) {
            field.ref = element;
        }
    };

    const fieldState = () => {
        const formState = control._formState();
        const errors = formState.errors;
        const touched = formState.touchedFields;
        const dirty = formState.dirtyFields;

        return {
            invalid: !!errors[name],
            isTouched: !!touched[name],
            isDirty: !!dirty[name],
            error: errors[name],
        };
    };

    return {
        field: {
            name: fieldName,
            value,
            onChange,
            onBlur,
            ref,
        },
        fieldState,
        formState: control._formState,
    };
}

// ============================================================================
// Form Component Types
// ============================================================================

export interface FormProps<T extends Record<string, any>> {
    form: UseFormReturn<T>;
    onSubmit: SubmitHandler<T>;
    onError?: SubmitErrorHandler<T>;
    children: any;
    class?: string;
    id?: string;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    useForm,
    useFieldArray,
    useWatch,
    useFormState,
    useController,
};
