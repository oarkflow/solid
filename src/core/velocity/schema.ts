/**
 * Schema Validation System
 *
 * A lightweight, type-safe schema validation library inspired by Zod.
 * Provides chainable validators, type inference, and comprehensive error handling.
 *
 * @example
 * const userSchema = v.object({
 *   name: v.string().min(2).max(50),
 *   email: v.string().email(),
 *   age: v.number().min(18).optional(),
 *   role: v.enum(['admin', 'user', 'guest']),
 * });
 *
 * type User = v.infer<typeof userSchema>;
 *
 * const result = userSchema.safeParse(data);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.errors);
 * }
 */

// ============================================================================
// Types
// ============================================================================

/** Validation error with path information */
export interface ValidationError {
    path: (string | number)[];
    message: string;
    code: string;
}

/** Result of safe parsing */
export type ParseResult<T> =
    | { success: true; data: T; errors: null }
    | { success: false; data: null; errors: ValidationError[] };

/** Parse context for tracking path */
interface ParseContext {
    path: (string | number)[];
    errors: ValidationError[];
    parent?: unknown;
}

/** Issue codes for validation errors */
export const IssueCodes = {
    INVALID_TYPE: 'invalid_type',
    REQUIRED: 'required',
    TOO_SMALL: 'too_small',
    TOO_BIG: 'too_big',
    INVALID_STRING: 'invalid_string',
    INVALID_ENUM: 'invalid_enum',
    INVALID_UNION: 'invalid_union',
    INVALID_LITERAL: 'invalid_literal',
    INVALID_DATE: 'invalid_date',
    CUSTOM: 'custom',
} as const;

export type IssueCode = typeof IssueCodes[keyof typeof IssueCodes];

// ============================================================================
// Base Schema
// ============================================================================

/** Base schema class that all schemas extend */
export abstract class Schema<TOutput, TInput = TOutput> {
    protected _optional: boolean = false;
    protected _nullable: boolean = false;
    protected _default?: TOutput;
    protected _transforms: ((value: TOutput) => TOutput)[] = [];
    protected _refinements: Array<{
        check: (value: TOutput) => boolean;
        message: string | ((value: TOutput) => string);
        code?: string;
    }> = [];
    protected _description?: string;

    /** Parse and validate input, throws on error */
    parse(input: unknown): TOutput {
        const result = this.safeParse(input);
        if (!result.success) {
            const messages = result.errors.map(e =>
                e.path.length > 0
                    ? `${e.path.join('.')}: ${e.message}`
                    : e.message
            );
            throw new ValidationException(messages.join('; '), result.errors);
        }
        return result.data;
    }

    /** Parse and validate input, returns result object */
    safeParse(input: unknown): ParseResult<TOutput> {
        const ctx: ParseContext = { path: [], errors: [] };
        const result = this._parse(input, ctx);

        if (ctx.errors.length > 0) {
            return { success: false, data: null, errors: ctx.errors };
        }

        return { success: true, data: result as TOutput, errors: null };
    }

    /** Check if input is valid */
    isValid(input: unknown): input is TOutput {
        return this.safeParse(input).success;
    }

    /** Internal parse implementation */
    protected abstract _parse(input: unknown, ctx: ParseContext): TOutput | undefined;

    /** Check type and handle optional/nullable */
    protected _checkBase(input: unknown, ctx: ParseContext): { skip: boolean; value?: TOutput } {
        // Handle undefined
        if (input === undefined) {
            if (this._default !== undefined) {
                return { skip: true, value: this._default };
            }
            if (this._optional) {
                return { skip: true, value: undefined as any };
            }
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Required',
                code: IssueCodes.REQUIRED,
            });
            return { skip: true };
        }

        // Handle null
        if (input === null) {
            if (this._nullable) {
                return { skip: true, value: null as any };
            }
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected non-null value',
                code: IssueCodes.INVALID_TYPE,
            });
            return { skip: true };
        }

        return { skip: false };
    }

    /** Apply transforms and refinements */
    protected _finalize(value: TOutput, ctx: ParseContext): TOutput | undefined {
        let result = value;

        // Apply transforms
        for (const transform of this._transforms) {
            try {
                result = transform(result);
            } catch (e) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: e instanceof Error ? e.message : 'Transform failed',
                    code: IssueCodes.CUSTOM,
                });
                return undefined;
            }
        }

        // Apply refinements
        for (const { check, message, code } of this._refinements) {
            if (!check(result)) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: typeof message === 'function' ? message(result) : message,
                    code: code || IssueCodes.CUSTOM,
                });
            }
        }

        return ctx.errors.length === 0 ? result : undefined;
    }

    /** Make this field optional */
    optional(): Schema<TOutput | undefined, TInput | undefined> {
        const clone = this._clone() as Schema<TOutput | undefined, TInput | undefined>;
        clone._optional = true;
        return clone;
    }

    /** Make this field nullable */
    nullable(): Schema<TOutput | null, TInput | null> {
        const clone = this._clone() as Schema<TOutput | null, TInput | null>;
        clone._nullable = true;
        return clone;
    }

    /** Make this field optional and nullable */
    nullish(): Schema<TOutput | null | undefined, TInput | null | undefined> {
        const clone = this._clone() as Schema<TOutput | null | undefined, TInput | null | undefined>;
        clone._optional = true;
        clone._nullable = true;
        return clone;
    }

    /** Set default value */
    default(value: TOutput): Schema<TOutput, TInput | undefined> {
        const clone = this._clone() as Schema<TOutput, TInput | undefined>;
        clone._default = value;
        return clone;
    }

    /** Transform the value */
    transform<U>(fn: (value: TOutput) => U): Schema<U, TInput> {
        const clone = this._clone();
        (clone as any)._transforms.push(fn as any);
        return clone as any;
    }

    /** Add custom validation */
    refine(
        check: (value: TOutput) => boolean,
        message: string | ((value: TOutput) => string)
    ): this {
        const clone = this._clone();
        clone._refinements.push({ check, message });
        return clone as this;
    }

    /** Add custom validation with code */
    superRefine(
        check: (value: TOutput, ctx: { addIssue: (issue: { code: string; message: string }) => void }) => void
    ): this {
        const clone = this._clone();
        const original = clone._parse.bind(clone);
        clone._parse = (input: unknown, ctx: ParseContext) => {
            const result = original(input, ctx);
            if (result !== undefined) {
                check(result, {
                    addIssue: (issue) => {
                        ctx.errors.push({
                            path: [...ctx.path],
                            message: issue.message,
                            code: issue.code,
                        });
                    },
                });
            }
            return ctx.errors.length === 0 ? result : undefined;
        };
        return clone as this;
    }

    /** Add description */
    describe(description: string): this {
        const clone = this._clone();
        clone._description = description;
        return clone as this;
    }

    /** Clone the schema */
    protected _clone(): this {
        const clone = Object.create(Object.getPrototypeOf(this));
        Object.assign(clone, this);
        clone._transforms = [...this._transforms];
        clone._refinements = [...this._refinements];
        return clone;
    }
}

// ============================================================================
// Validation Exception
// ============================================================================

export class ValidationException extends Error {
    constructor(
        message: string,
        public readonly errors: ValidationError[]
    ) {
        super(message);
        this.name = 'ValidationException';
    }

    /** Format errors for display */
    format(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        for (const error of this.errors) {
            const key = error.path.length > 0 ? error.path.join('.') : '_root';
            if (!result[key]) result[key] = [];
            result[key].push(error.message);
        }
        return result;
    }

    /** Get flat error messages */
    flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> } {
        const formErrors: string[] = [];
        const fieldErrors: Record<string, string[]> = {};

        for (const error of this.errors) {
            if (error.path.length === 0) {
                formErrors.push(error.message);
            } else {
                const key = error.path.join('.');
                if (!fieldErrors[key]) fieldErrors[key] = [];
                fieldErrors[key].push(error.message);
            }
        }

        return { formErrors, fieldErrors };
    }
}

// ============================================================================
// String Schema
// ============================================================================

export class StringSchema extends Schema<string> {
    private _minLength?: { value: number; message?: string };
    private _maxLength?: { value: number; message?: string };
    private _pattern?: { regex: RegExp; message?: string };
    private _email?: { message?: string };
    private _url?: { message?: string };
    private _uuid?: { message?: string };
    private _cuid?: { message?: string };
    private _datetime?: { message?: string };
    private _trim?: boolean;
    private _toLowerCase?: boolean;
    private _toUpperCase?: boolean;
    private _includes?: { value: string; message?: string };
    private _startsWith?: { value: string; message?: string };
    private _endsWith?: { value: string; message?: string };
    private _nonempty?: { message?: string };

    protected _parse(input: unknown, ctx: ParseContext): string | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input !== 'string') {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected string, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        let value = input;

        // Apply string transformations
        if (this._trim) value = value.trim();
        if (this._toLowerCase) value = value.toLowerCase();
        if (this._toUpperCase) value = value.toUpperCase();

        // Validations
        if (this._nonempty && value.length === 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._nonempty.message || 'String cannot be empty',
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._minLength && value.length < this._minLength.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._minLength.message || `String must be at least ${this._minLength.value} characters`,
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._maxLength && value.length > this._maxLength.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._maxLength.message || `String must be at most ${this._maxLength.value} characters`,
                code: IssueCodes.TOO_BIG,
            });
        }

        if (this._pattern && !this._pattern.regex.test(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._pattern.message || 'Invalid format',
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._email.message || 'Invalid email address',
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._url) {
            try {
                new URL(value);
            } catch {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: this._url.message || 'Invalid URL',
                    code: IssueCodes.INVALID_STRING,
                });
            }
        }

        if (this._uuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._uuid.message || 'Invalid UUID',
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._cuid && !/^c[a-z0-9]{24}$/i.test(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._cuid.message || 'Invalid CUID',
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._datetime) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: this._datetime.message || 'Invalid datetime',
                    code: IssueCodes.INVALID_STRING,
                });
            }
        }

        if (this._includes && !value.includes(this._includes.value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._includes.message || `String must include "${this._includes.value}"`,
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._startsWith && !value.startsWith(this._startsWith.value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._startsWith.message || `String must start with "${this._startsWith.value}"`,
                code: IssueCodes.INVALID_STRING,
            });
        }

        if (this._endsWith && !value.endsWith(this._endsWith.value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._endsWith.message || `String must end with "${this._endsWith.value}"`,
                code: IssueCodes.INVALID_STRING,
            });
        }

        return this._finalize(value, ctx);
    }

    min(length: number, message?: string): this {
        const clone = this._clone();
        clone._minLength = { value: length, message };
        return clone;
    }

    max(length: number, message?: string): this {
        const clone = this._clone();
        clone._maxLength = { value: length, message };
        return clone;
    }

    length(length: number, message?: string): this {
        return this.min(length, message).max(length, message);
    }

    regex(pattern: RegExp, message?: string): this {
        const clone = this._clone();
        clone._pattern = { regex: pattern, message };
        return clone;
    }

    email(message?: string): this {
        const clone = this._clone();
        clone._email = { message };
        return clone;
    }

    url(message?: string): this {
        const clone = this._clone();
        clone._url = { message };
        return clone;
    }

    uuid(message?: string): this {
        const clone = this._clone();
        clone._uuid = { message };
        return clone;
    }

    cuid(message?: string): this {
        const clone = this._clone();
        clone._cuid = { message };
        return clone;
    }

    datetime(message?: string): this {
        const clone = this._clone();
        clone._datetime = { message };
        return clone;
    }

    includes(value: string, message?: string): this {
        const clone = this._clone();
        clone._includes = { value, message };
        return clone;
    }

    startsWith(value: string, message?: string): this {
        const clone = this._clone();
        clone._startsWith = { value, message };
        return clone;
    }

    endsWith(value: string, message?: string): this {
        const clone = this._clone();
        clone._endsWith = { value, message };
        return clone;
    }

    nonempty(message?: string): this {
        const clone = this._clone();
        clone._nonempty = { message };
        return clone;
    }

    trim(): this {
        const clone = this._clone();
        clone._trim = true;
        return clone;
    }

    toLowerCase(): this {
        const clone = this._clone();
        clone._toLowerCase = true;
        return clone;
    }

    toUpperCase(): this {
        const clone = this._clone();
        clone._toUpperCase = true;
        return clone;
    }

    protected _clone(): this {
        const clone = super._clone();
        clone._minLength = this._minLength;
        clone._maxLength = this._maxLength;
        clone._pattern = this._pattern;
        clone._email = this._email;
        clone._url = this._url;
        clone._uuid = this._uuid;
        clone._cuid = this._cuid;
        clone._datetime = this._datetime;
        clone._trim = this._trim;
        clone._toLowerCase = this._toLowerCase;
        clone._toUpperCase = this._toUpperCase;
        clone._includes = this._includes;
        clone._startsWith = this._startsWith;
        clone._endsWith = this._endsWith;
        clone._nonempty = this._nonempty;
        return clone;
    }
}

// ============================================================================
// Number Schema
// ============================================================================

export class NumberSchema extends Schema<number> {
    private _min?: { value: number; message?: string; inclusive: boolean };
    private _max?: { value: number; message?: string; inclusive: boolean };
    private _int?: { message?: string };
    private _positive?: { message?: string };
    private _negative?: { message?: string };
    private _nonnegative?: { message?: string };
    private _nonpositive?: { message?: string };
    private _multipleOf?: { value: number; message?: string };
    private _finite?: { message?: string };
    private _safe?: { message?: string };

    protected _parse(input: unknown, ctx: ParseContext): number | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        let value: number;

        if (typeof input === 'number') {
            value = input;
        } else if (typeof input === 'string' && input.trim() !== '') {
            const parsed = Number(input);
            if (isNaN(parsed)) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: `Expected number, received ${typeof input}`,
                    code: IssueCodes.INVALID_TYPE,
                });
                return undefined;
            }
            value = parsed;
        } else {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected number, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        if (isNaN(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected number, received NaN',
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        // Validations
        if (this._min) {
            const valid = this._min.inclusive ? value >= this._min.value : value > this._min.value;
            if (!valid) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: this._min.message ||
                        `Number must be ${this._min.inclusive ? 'at least' : 'greater than'} ${this._min.value}`,
                    code: IssueCodes.TOO_SMALL,
                });
            }
        }

        if (this._max) {
            const valid = this._max.inclusive ? value <= this._max.value : value < this._max.value;
            if (!valid) {
                ctx.errors.push({
                    path: [...ctx.path],
                    message: this._max.message ||
                        `Number must be ${this._max.inclusive ? 'at most' : 'less than'} ${this._max.value}`,
                    code: IssueCodes.TOO_BIG,
                });
            }
        }

        if (this._int && !Number.isInteger(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._int.message || 'Expected integer',
                code: IssueCodes.INVALID_TYPE,
            });
        }

        if (this._positive && value <= 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._positive.message || 'Number must be positive',
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._negative && value >= 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._negative.message || 'Number must be negative',
                code: IssueCodes.TOO_BIG,
            });
        }

        if (this._nonnegative && value < 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._nonnegative.message || 'Number must be non-negative',
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._nonpositive && value > 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._nonpositive.message || 'Number must be non-positive',
                code: IssueCodes.TOO_BIG,
            });
        }

        if (this._multipleOf && value % this._multipleOf.value !== 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._multipleOf.message || `Number must be a multiple of ${this._multipleOf.value}`,
                code: IssueCodes.CUSTOM,
            });
        }

        if (this._finite && !Number.isFinite(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._finite.message || 'Number must be finite',
                code: IssueCodes.INVALID_TYPE,
            });
        }

        if (this._safe && !Number.isSafeInteger(value)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._safe.message || 'Number must be a safe integer',
                code: IssueCodes.INVALID_TYPE,
            });
        }

        return this._finalize(value, ctx);
    }

    min(value: number, message?: string): this {
        const clone = this._clone();
        clone._min = { value, message, inclusive: true };
        return clone;
    }

    max(value: number, message?: string): this {
        const clone = this._clone();
        clone._max = { value, message, inclusive: true };
        return clone;
    }

    gt(value: number, message?: string): this {
        const clone = this._clone();
        clone._min = { value, message, inclusive: false };
        return clone;
    }

    gte(value: number, message?: string): this {
        return this.min(value, message);
    }

    lt(value: number, message?: string): this {
        const clone = this._clone();
        clone._max = { value, message, inclusive: false };
        return clone;
    }

    lte(value: number, message?: string): this {
        return this.max(value, message);
    }

    int(message?: string): this {
        const clone = this._clone();
        clone._int = { message };
        return clone;
    }

    positive(message?: string): this {
        const clone = this._clone();
        clone._positive = { message };
        return clone;
    }

    negative(message?: string): this {
        const clone = this._clone();
        clone._negative = { message };
        return clone;
    }

    nonnegative(message?: string): this {
        const clone = this._clone();
        clone._nonnegative = { message };
        return clone;
    }

    nonpositive(message?: string): this {
        const clone = this._clone();
        clone._nonpositive = { message };
        return clone;
    }

    multipleOf(value: number, message?: string): this {
        const clone = this._clone();
        clone._multipleOf = { value, message };
        return clone;
    }

    finite(message?: string): this {
        const clone = this._clone();
        clone._finite = { message };
        return clone;
    }

    safe(message?: string): this {
        const clone = this._clone();
        clone._safe = { message };
        return clone;
    }

    protected _clone(): this {
        const clone = super._clone();
        clone._min = this._min;
        clone._max = this._max;
        clone._int = this._int;
        clone._positive = this._positive;
        clone._negative = this._negative;
        clone._nonnegative = this._nonnegative;
        clone._nonpositive = this._nonpositive;
        clone._multipleOf = this._multipleOf;
        clone._finite = this._finite;
        clone._safe = this._safe;
        return clone;
    }
}

// ============================================================================
// Boolean Schema
// ============================================================================

export class BooleanSchema extends Schema<boolean> {
    protected _parse(input: unknown, ctx: ParseContext): boolean | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input === 'boolean') {
            return this._finalize(input, ctx);
        }

        // Coerce common truthy/falsy values
        if (input === 'true' || input === 1 || input === '1') {
            return this._finalize(true, ctx);
        }
        if (input === 'false' || input === 0 || input === '0') {
            return this._finalize(false, ctx);
        }

        ctx.errors.push({
            path: [...ctx.path],
            message: `Expected boolean, received ${typeof input}`,
            code: IssueCodes.INVALID_TYPE,
        });
        return undefined;
    }
}

// ============================================================================
// Date Schema
// ============================================================================

export class DateSchema extends Schema<Date> {
    private _min?: { value: Date; message?: string };
    private _max?: { value: Date; message?: string };

    protected _parse(input: unknown, ctx: ParseContext): Date | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        let date: Date;

        if (input instanceof Date) {
            date = input;
        } else if (typeof input === 'string' || typeof input === 'number') {
            date = new Date(input);
        } else {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected date, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        if (isNaN(date.getTime())) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Invalid date',
                code: IssueCodes.INVALID_DATE,
            });
            return undefined;
        }

        if (this._min && date < this._min.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._min.message || `Date must be after ${this._min.value.toISOString()}`,
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._max && date > this._max.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._max.message || `Date must be before ${this._max.value.toISOString()}`,
                code: IssueCodes.TOO_BIG,
            });
        }

        return this._finalize(date, ctx);
    }

    min(date: Date, message?: string): this {
        const clone = this._clone();
        clone._min = { value: date, message };
        return clone;
    }

    max(date: Date, message?: string): this {
        const clone = this._clone();
        clone._max = { value: date, message };
        return clone;
    }

    protected _clone(): this {
        const clone = super._clone();
        clone._min = this._min;
        clone._max = this._max;
        return clone;
    }
}

// ============================================================================
// Array Schema
// ============================================================================

export class ArraySchema<T> extends Schema<T[]> {
    private _minLength?: { value: number; message?: string };
    private _maxLength?: { value: number; message?: string };
    private _nonempty?: { message?: string };

    constructor(private readonly _element: Schema<T>) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): T[] | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (!Array.isArray(input)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected array, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        // Length validations
        if (this._nonempty && input.length === 0) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._nonempty.message || 'Array cannot be empty',
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._minLength && input.length < this._minLength.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._minLength.message || `Array must contain at least ${this._minLength.value} items`,
                code: IssueCodes.TOO_SMALL,
            });
        }

        if (this._maxLength && input.length > this._maxLength.value) {
            ctx.errors.push({
                path: [...ctx.path],
                message: this._maxLength.message || `Array must contain at most ${this._maxLength.value} items`,
                code: IssueCodes.TOO_BIG,
            });
        }

        const result: T[] = [];
        for (let i = 0; i < input.length; i++) {
            ctx.path.push(i);
            const parsed = (this._element as any)._parse(input[i], ctx);
            if (parsed !== undefined) {
                result.push(parsed);
            }
            ctx.path.pop();
        }

        return ctx.errors.length === 0 ? this._finalize(result, ctx) : undefined;
    }

    min(length: number, message?: string): this {
        const clone = this._clone();
        clone._minLength = { value: length, message };
        return clone;
    }

    max(length: number, message?: string): this {
        const clone = this._clone();
        clone._maxLength = { value: length, message };
        return clone;
    }

    length(length: number, message?: string): this {
        return this.min(length, message).max(length, message);
    }

    nonempty(message?: string): this {
        const clone = this._clone();
        clone._nonempty = { message };
        return clone;
    }

    protected _clone(): this {
        const clone = new ArraySchema(this._element) as this;
        Object.assign(clone, super._clone());
        clone._minLength = this._minLength;
        clone._maxLength = this._maxLength;
        clone._nonempty = this._nonempty;
        return clone;
    }
}

// ============================================================================
// Object Schema
// ============================================================================

type ObjectShape = Record<string, Schema<any>>;

type InferObjectOutput<T extends ObjectShape> = {
    [K in keyof T]: T[K] extends Schema<infer O> ? O : never;
};

export class ObjectSchema<T extends ObjectShape> extends Schema<InferObjectOutput<T>> {
    private _strict: boolean = false;
    private _passthrough: boolean = false;
    private _catchall?: Schema<any>;

    constructor(private readonly _shape: T) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): InferObjectOutput<T> | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected object, received ${Array.isArray(input) ? 'array' : typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        const inputObj = input as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        const knownKeys = new Set(Object.keys(this._shape));

        // Parse known keys
        for (const key of knownKeys) {
            ctx.path.push(key);
            const schema = this._shape[key];
            const parsed = (schema as any)._parse(inputObj[key], ctx);
            if (parsed !== undefined || key in inputObj) {
                result[key] = parsed;
            }
            ctx.path.pop();
        }

        // Handle unknown keys
        const unknownKeys = Object.keys(inputObj).filter(k => !knownKeys.has(k));

        if (this._strict && unknownKeys.length > 0) {
            for (const key of unknownKeys) {
                ctx.errors.push({
                    path: [...ctx.path, key],
                    message: `Unrecognized key: ${key}`,
                    code: IssueCodes.CUSTOM,
                });
            }
        } else if (this._passthrough) {
            for (const key of unknownKeys) {
                result[key] = inputObj[key];
            }
        } else if (this._catchall) {
            for (const key of unknownKeys) {
                ctx.path.push(key);
                const parsed = (this._catchall as any)._parse(inputObj[key], ctx);
                if (parsed !== undefined) {
                    result[key] = parsed;
                }
                ctx.path.pop();
            }
        }

        return ctx.errors.length === 0
            ? this._finalize(result as InferObjectOutput<T>, ctx)
            : undefined;
    }

    /** Mark all fields as optional */
    partial(): ObjectSchema<{ [K in keyof T]: ReturnType<T[K]['optional']> }> {
        const partialShape: any = {};
        for (const key in this._shape) {
            partialShape[key] = this._shape[key].optional();
        }
        return new ObjectSchema(partialShape);
    }

    /** Make specific fields required (reverses optional) */
    required(): ObjectSchema<T> {
        // For now, just return a clone (implement if needed)
        return this._clone();
    }

    /** Pick specific keys */
    pick<K extends keyof T>(keys: K[]): ObjectSchema<Pick<T, K>> {
        const newShape: any = {};
        for (const key of keys) {
            if (key in this._shape) {
                newShape[key] = this._shape[key];
            }
        }
        return new ObjectSchema(newShape);
    }

    /** Omit specific keys */
    omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>> {
        const newShape: any = {};
        for (const key in this._shape) {
            if (!keys.includes(key as any)) {
                newShape[key] = this._shape[key];
            }
        }
        return new ObjectSchema(newShape);
    }

    /** Extend with additional fields */
    extend<U extends ObjectShape>(shape: U): ObjectSchema<T & U> {
        return new ObjectSchema({ ...this._shape, ...shape });
    }

    /** Merge with another object schema */
    merge<U extends ObjectShape>(other: ObjectSchema<U>): ObjectSchema<T & U> {
        return new ObjectSchema({ ...this._shape, ...other._shape });
    }

    /** Disallow unknown keys (throws error) */
    strict(): this {
        const clone = this._clone();
        clone._strict = true;
        clone._passthrough = false;
        return clone;
    }

    /** Allow and pass through unknown keys */
    passthrough(): this {
        const clone = this._clone();
        clone._passthrough = true;
        clone._strict = false;
        return clone;
    }

    /** Strip unknown keys (default behavior) */
    strip(): this {
        const clone = this._clone();
        clone._passthrough = false;
        clone._strict = false;
        clone._catchall = undefined;
        return clone;
    }

    /** Validate unknown keys against a schema */
    catchall<C>(schema: Schema<C>): this {
        const clone = this._clone();
        clone._catchall = schema;
        clone._passthrough = false;
        clone._strict = false;
        return clone;
    }

    /** Get the shape definition */
    get shape(): T {
        return this._shape;
    }

    /** Get keys array */
    keyof(): (keyof T)[] {
        return Object.keys(this._shape) as (keyof T)[];
    }

    protected _clone(): this {
        const clone = new ObjectSchema(this._shape) as this;
        Object.assign(clone, super._clone());
        clone._strict = this._strict;
        clone._passthrough = this._passthrough;
        clone._catchall = this._catchall;
        return clone;
    }
}

// ============================================================================
// Enum Schema
// ============================================================================

export class EnumSchema<T extends readonly [string, ...string[]]> extends Schema<T[number]> {
    constructor(private readonly _values: T) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): T[number] | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input !== 'string' || !this._values.includes(input as any)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected one of: ${this._values.join(', ')}`,
                code: IssueCodes.INVALID_ENUM,
            });
            return undefined;
        }

        return this._finalize(input as T[number], ctx);
    }

    /** Get enum values */
    get options(): T {
        return this._values;
    }

    /** Get enum as object */
    get enum(): { [K in T[number]]: K } {
        const result: any = {};
        for (const value of this._values) {
            result[value] = value;
        }
        return result;
    }

    protected _clone(): this {
        return new EnumSchema(this._values) as this;
    }
}

// ============================================================================
// Native Enum Schema
// ============================================================================

type EnumLike = { [k: string]: string | number;[nu: number]: string };

export class NativeEnumSchema<T extends EnumLike> extends Schema<T[keyof T]> {
    private readonly _values: Set<string | number>;

    constructor(private readonly _enum: T) {
        super();
        // Extract values from enum (handles both string and numeric enums)
        this._values = new Set(
            Object.values(_enum).filter(v => typeof v === 'string' || typeof v === 'number')
        );
    }

    protected _parse(input: unknown, ctx: ParseContext): T[keyof T] | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (!this._values.has(input as any)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Invalid enum value`,
                code: IssueCodes.INVALID_ENUM,
            });
            return undefined;
        }

        return this._finalize(input as T[keyof T], ctx);
    }

    protected _clone(): this {
        return new NativeEnumSchema(this._enum) as this;
    }
}

// ============================================================================
// Literal Schema
// ============================================================================

type Primitive = string | number | boolean | null | undefined;

export class LiteralSchema<T extends Primitive> extends Schema<T> {
    constructor(private readonly _literal: T) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): T | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (input !== this._literal) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected ${JSON.stringify(this._literal)}, received ${JSON.stringify(input)}`,
                code: IssueCodes.INVALID_LITERAL,
            });
            return undefined;
        }

        return this._finalize(input as T, ctx);
    }

    /** Get literal value */
    get value(): T {
        return this._literal;
    }

    protected _clone(): this {
        return new LiteralSchema(this._literal) as this;
    }
}

// ============================================================================
// Union Schema
// ============================================================================

export class UnionSchema<T extends readonly Schema<any>[]> extends Schema<T[number] extends Schema<infer O> ? O : never> {
    constructor(private readonly _schemas: T) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        const errors: ValidationError[][] = [];

        for (const schema of this._schemas) {
            const tempCtx: ParseContext = { path: [...ctx.path], errors: [] };
            const result = (schema as any)._parse(input, tempCtx);

            if (tempCtx.errors.length === 0) {
                return result;
            }
            errors.push(tempCtx.errors);
        }

        ctx.errors.push({
            path: [...ctx.path],
            message: 'Invalid union: value does not match any variant',
            code: IssueCodes.INVALID_UNION,
        });

        return undefined;
    }

    /** Get union options */
    get options(): T {
        return this._schemas;
    }

    protected _clone(): this {
        return new UnionSchema(this._schemas) as this;
    }
}

// ============================================================================
// Discriminated Union Schema
// ============================================================================

export class DiscriminatedUnionSchema<
    D extends string,
    T extends readonly ObjectSchema<any>[]
> extends Schema<T[number] extends Schema<infer O> ? O : never> {
    private readonly _discriminatorMap: Map<any, ObjectSchema<any>>;

    constructor(
        private readonly _discriminator: D,
        private readonly _schemas: T
    ) {
        super();
        this._discriminatorMap = new Map();

        for (const schema of _schemas) {
            const shape = schema.shape;
            const discField = shape[_discriminator];
            if (discField instanceof LiteralSchema) {
                this._discriminatorMap.set(discField.value, schema);
            }
        }
    }

    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input !== 'object' || input === null) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected object',
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        const discValue = (input as any)[this._discriminator];
        const schema = this._discriminatorMap.get(discValue);

        if (!schema) {
            ctx.errors.push({
                path: [...ctx.path, this._discriminator],
                message: `Invalid discriminator value: ${JSON.stringify(discValue)}`,
                code: IssueCodes.INVALID_UNION,
            });
            return undefined;
        }

        return (schema as any)._parse(input, ctx);
    }

    protected _clone(): this {
        return new DiscriminatedUnionSchema(this._discriminator, this._schemas) as this;
    }
}

// ============================================================================
// Tuple Schema
// ============================================================================

export class TupleSchema<T extends readonly Schema<any>[]> extends Schema<{
    [K in keyof T]: T[K] extends Schema<infer O> ? O : never;
}> {
    private _rest?: Schema<any>;

    constructor(private readonly _items: T) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (!Array.isArray(input)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected array, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        if (!this._rest && input.length !== this._items.length) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected ${this._items.length} items, received ${input.length}`,
                code: IssueCodes.TOO_SMALL,
            });
            return undefined;
        }

        const result: any[] = [];

        for (let i = 0; i < this._items.length; i++) {
            ctx.path.push(i);
            const parsed = (this._items[i] as any)._parse(input[i], ctx);
            result.push(parsed);
            ctx.path.pop();
        }

        if (this._rest && input.length > this._items.length) {
            for (let i = this._items.length; i < input.length; i++) {
                ctx.path.push(i);
                const parsed = (this._rest as any)._parse(input[i], ctx);
                result.push(parsed);
                ctx.path.pop();
            }
        }

        return ctx.errors.length === 0 ? this._finalize(result as any, ctx) : undefined;
    }

    rest<R>(schema: Schema<R>): TupleSchema<T> {
        const clone = this._clone();
        clone._rest = schema;
        return clone;
    }

    protected _clone(): this {
        const clone = new TupleSchema(this._items) as this;
        Object.assign(clone, super._clone());
        clone._rest = this._rest;
        return clone;
    }
}

// ============================================================================
// Record Schema
// ============================================================================

export class RecordSchema<K extends Schema<string>, V extends Schema<any>> extends Schema<Record<string, V extends Schema<infer O> ? O : never>> {
    constructor(
        private readonly _keySchema: K,
        private readonly _valueSchema: V
    ) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: `Expected object, received ${typeof input}`,
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }

        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(input)) {
            // Validate key
            ctx.path.push(key);
            const keyResult = (this._keySchema as any)._parse(key, ctx);

            // Validate value
            const valueResult = (this._valueSchema as any)._parse(value, ctx);

            if (keyResult !== undefined && valueResult !== undefined) {
                result[keyResult] = valueResult;
            }
            ctx.path.pop();
        }

        return ctx.errors.length === 0 ? this._finalize(result, ctx) : undefined;
    }

    protected _clone(): this {
        return new RecordSchema(this._keySchema, this._valueSchema) as this;
    }
}

// ============================================================================
// Any/Unknown Schemas
// ============================================================================

export class AnySchema extends Schema<any> {
    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;
        return this._finalize(input, ctx);
    }
}

export class UnknownSchema extends Schema<unknown> {
    protected _parse(input: unknown, ctx: ParseContext): unknown {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;
        return this._finalize(input, ctx);
    }
}

// ============================================================================
// Never/Void Schemas
// ============================================================================

export class NeverSchema extends Schema<never> {
    protected _parse(_input: unknown, ctx: ParseContext): never {
        ctx.errors.push({
            path: [...ctx.path],
            message: 'Invalid type: expected never',
            code: IssueCodes.INVALID_TYPE,
        });
        return undefined as never;
    }
}

export class VoidSchema extends Schema<void> {
    protected _parse(input: unknown, ctx: ParseContext): void {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        if (input !== undefined) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected undefined',
                code: IssueCodes.INVALID_TYPE,
            });
        }
        return undefined;
    }
}

// ============================================================================
// Null/Undefined Schemas
// ============================================================================

export class NullSchema extends Schema<null> {
    protected _parse(input: unknown, ctx: ParseContext): null | undefined {
        if (input !== null) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected null',
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }
        return null;
    }
}

export class UndefinedSchema extends Schema<undefined> {
    protected _parse(input: unknown, ctx: ParseContext): undefined {
        if (input !== undefined) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Expected undefined',
                code: IssueCodes.INVALID_TYPE,
            });
        }
        return undefined;
    }
}

// ============================================================================
// Intersection Schema
// ============================================================================

export class IntersectionSchema<L extends Schema<any>, R extends Schema<any>> extends Schema<
    (L extends Schema<infer LO> ? LO : never) & (R extends Schema<infer RO> ? RO : never)
> {
    constructor(
        private readonly _left: L,
        private readonly _right: R
    ) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): any {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        const leftResult = (this._left as any)._parse(input, ctx);
        const rightResult = (this._right as any)._parse(input, ctx);

        if (ctx.errors.length > 0) return undefined;

        // Merge results (works for objects)
        if (typeof leftResult === 'object' && typeof rightResult === 'object') {
            return this._finalize({ ...leftResult, ...rightResult }, ctx);
        }

        return this._finalize(leftResult, ctx);
    }

    protected _clone(): this {
        return new IntersectionSchema(this._left, this._right) as this;
    }
}

// ============================================================================
// Lazy Schema (for recursive types)
// ============================================================================

export class LazySchema<T> extends Schema<T> {
    constructor(private readonly _getter: () => Schema<T>) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): T | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        const schema = this._getter();
        return (schema as any)._parse(input, ctx);
    }

    protected _clone(): this {
        return new LazySchema(this._getter) as this;
    }
}

// ============================================================================
// Preprocess & Pipeline
// ============================================================================

export class PreprocessSchema<T> extends Schema<T> {
    constructor(
        private readonly _preprocess: (input: unknown) => unknown,
        private readonly _schema: Schema<T>
    ) {
        super();
    }

    protected _parse(input: unknown, ctx: ParseContext): T | undefined {
        const preprocessed = this._preprocess(input);
        return (this._schema as any)._parse(preprocessed, ctx);
    }

    protected _clone(): this {
        return new PreprocessSchema(this._preprocess, this._schema) as this;
    }
}

// ============================================================================
// Coercion Schemas
// ============================================================================

export class CoercedStringSchema extends StringSchema {
    protected _parse(input: unknown, ctx: ParseContext): string | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        // Coerce to string
        const coerced = String(input);
        return super._parse(coerced, ctx);
    }
}

export class CoercedNumberSchema extends NumberSchema {
    protected _parse(input: unknown, ctx: ParseContext): number | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        // Coerce to number
        const coerced = Number(input);
        if (isNaN(coerced)) {
            ctx.errors.push({
                path: [...ctx.path],
                message: 'Invalid number',
                code: IssueCodes.INVALID_TYPE,
            });
            return undefined;
        }
        return super._parse(coerced, ctx);
    }
}

export class CoercedBooleanSchema extends BooleanSchema {
    protected _parse(input: unknown, ctx: ParseContext): boolean | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        // Coerce to boolean
        const coerced = Boolean(input);
        return super._parse(coerced, ctx);
    }
}

export class CoercedDateSchema extends DateSchema {
    protected _parse(input: unknown, ctx: ParseContext): Date | undefined {
        const base = this._checkBase(input, ctx);
        if (base.skip) return base.value;

        // Coerce to date
        const coerced = new Date(input as any);
        return super._parse(coerced, ctx);
    }
}

// ============================================================================
// Schema Factory (API)
// ============================================================================

/** Type inference helper */
export type infer<T extends Schema<any>> = T extends Schema<infer O> ? O : never;

/** Type for schema input */
export type input<T extends Schema<any, any>> = T extends Schema<any, infer I> ? I : never;

/** Create schema validation namespace */
export const v = {
    // Primitive types
    string: () => new StringSchema(),
    number: () => new NumberSchema(),
    boolean: () => new BooleanSchema(),
    date: () => new DateSchema(),

    // Complex types
    array: <T>(schema: Schema<T>) => new ArraySchema(schema),
    object: <T extends ObjectShape>(shape: T) => new ObjectSchema(shape),
    tuple: <T extends readonly Schema<any>[]>(items: T) => new TupleSchema(items),
    record: <V>(valueSchema: Schema<V>) => new RecordSchema(new StringSchema(), valueSchema),

    // Enum types
    enum: <T extends readonly [string, ...string[]]>(values: T) => new EnumSchema(values),
    nativeEnum: <T extends EnumLike>(e: T) => new NativeEnumSchema(e),

    // Literal types
    literal: <T extends Primitive>(value: T) => new LiteralSchema(value),

    // Union types
    union: <T extends readonly Schema<any>[]>(schemas: T) => new UnionSchema(schemas),
    discriminatedUnion: <D extends string, T extends readonly ObjectSchema<any>[]>(
        discriminator: D,
        schemas: T
    ) => new DiscriminatedUnionSchema(discriminator, schemas),

    // Intersection
    intersection: <L extends Schema<any>, R extends Schema<any>>(left: L, right: R) =>
        new IntersectionSchema(left, right),
    and: <L extends Schema<any>, R extends Schema<any>>(left: L, right: R) =>
        new IntersectionSchema(left, right),

    // Special types
    any: () => new AnySchema(),
    unknown: () => new UnknownSchema(),
    never: () => new NeverSchema(),
    void: () => new VoidSchema(),
    null: () => new NullSchema(),
    undefined: () => new UndefinedSchema(),

    // Recursive types
    lazy: <T>(getter: () => Schema<T>) => new LazySchema(getter),

    // Preprocessing
    preprocess: <T>(preprocess: (input: unknown) => unknown, schema: Schema<T>) =>
        new PreprocessSchema(preprocess, schema),

    // Coercion helpers
    coerce: {
        string: () => new CoercedStringSchema(),
        number: () => new CoercedNumberSchema(),
        boolean: () => new CoercedBooleanSchema(),
        date: () => new CoercedDateSchema(),
    },

    // Custom schema
    custom: <T>(check: (value: unknown) => value is T, message?: string): Schema<T> => {
        return new AnySchema().refine(check, message || 'Invalid value') as any;
    },

    // Instanceof check
    instanceof: <T extends new (...args: any[]) => any>(cls: T, message?: string): Schema<InstanceType<T>> => {
        return new AnySchema().refine(
            (value): value is InstanceType<T> => value instanceof cls,
            message || `Expected instance of ${cls.name}`
        ) as any;
    },
};

// Default export
export default v;
