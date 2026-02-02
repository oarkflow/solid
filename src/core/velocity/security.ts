/**
 * Security Utilities
 *
 * Centralized security functions for XSS prevention, URL validation,
 * input sanitization, and CSP helpers.
 */

// ============================================================================
// HTML Sanitization
// ============================================================================

// Dangerous tags that should always be removed
const DANGEROUS_TAGS = new Set([
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'textarea', 'select', 'style', 'link', 'meta', 'base', 'applet',
    'frame', 'frameset', 'layer', 'ilayer', 'bgsound', 'xml'
]);

// Dangerous attributes that could execute code
const DANGEROUS_ATTRS = new Set([
    'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
    'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onerror', 'onabort',
    'onblur', 'onchange', 'onfocus', 'onreset', 'onsubmit', 'onunload',
    'onresize', 'onscroll', 'oninput', 'oncontextmenu', 'ondrag', 'ondrop',
    'oncopy', 'oncut', 'onpaste', 'onanimationend', 'onanimationstart',
    'ontransitionend', 'onpointerdown', 'onpointerup', 'ontouchstart',
    'ontouchend', 'ontouchmove', 'formaction', 'xlink:href', 'data-bind'
]);

// Protocol patterns that are dangerous in URLs
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

// Allowed URL protocols
const SAFE_PROTOCOLS = /^(https?|mailto|tel|sms|geo):/i;

export interface SanitizeOptions {
    /** Allow specific tags beyond defaults */
    allowTags?: string[];
    /** Allow specific attributes beyond defaults */
    allowAttrs?: string[];
    /** Strip all tags, return text only */
    textOnly?: boolean;
    /** Maximum length of output */
    maxLength?: number;
    /** Allow data: URLs for images */
    allowDataUrls?: boolean;
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHTML(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Unescape HTML entities back to characters
 */
export function unescapeHTML(str: string): string {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

/**
 * Sanitize HTML string by removing dangerous elements and attributes
 */
export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
    if (!html) return '';

    const {
        allowTags = [],
        allowAttrs = [],
        textOnly = false,
        maxLength,
        allowDataUrls = false
    } = options;

    // If text only, strip all HTML
    if (textOnly) {
        const text = html.replace(/<[^>]*>/g, '').trim();
        return maxLength ? text.slice(0, maxLength) : text;
    }

    // Use DOMParser if available (browser)
    if (typeof DOMParser !== 'undefined') {
        return sanitizeWithDOM(html, allowTags, allowAttrs, allowDataUrls, maxLength);
    }

    // Fallback: regex-based sanitization (less accurate but works in SSR)
    return sanitizeWithRegex(html, allowTags, maxLength);
}

function sanitizeWithDOM(
    html: string,
    allowTags: string[],
    allowAttrs: string[],
    allowDataUrls: boolean,
    maxLength?: number
): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const allowedTags = new Set(allowTags.map(t => t.toLowerCase()));
    const allowedAttrs = new Set(allowAttrs.map(a => a.toLowerCase()));

    function cleanNode(node: Node): void {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();

            // Remove dangerous tags unless explicitly allowed
            if (DANGEROUS_TAGS.has(tagName) && !allowedTags.has(tagName)) {
                el.remove();
                return;
            }

            // Clean attributes
            const attrsToRemove: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                const attrName = attr.name.toLowerCase();
                const attrValue = attr.value.toLowerCase().trim();

                // Remove dangerous attributes
                if (DANGEROUS_ATTRS.has(attrName) && !allowedAttrs.has(attrName)) {
                    attrsToRemove.push(attr.name);
                    continue;
                }

                // Check URL attributes
                if (['href', 'src', 'action', 'poster', 'background'].includes(attrName)) {
                    if (DANGEROUS_PROTOCOLS.test(attrValue)) {
                        // Allow data: URLs for images if configured
                        if (allowDataUrls && attrName === 'src' && attrValue.startsWith('data:image/')) {
                            continue;
                        }
                        attrsToRemove.push(attr.name);
                    }
                }

                // Check style attribute for javascript:
                if (attrName === 'style' && attrValue.includes('javascript:')) {
                    attrsToRemove.push(attr.name);
                }
            }

            attrsToRemove.forEach(attr => el.removeAttribute(attr));
        }

        // Recursively clean children
        Array.from(node.childNodes).forEach(cleanNode);
    }

    cleanNode(doc.body);

    let result = doc.body.innerHTML;
    return maxLength ? result.slice(0, maxLength) : result;
}

function sanitizeWithRegex(html: string, allowTags: string[], maxLength?: number): string {
    // Remove dangerous tags with content
    const dangerousTags = Array.from(DANGEROUS_TAGS).filter(t => !allowTags.includes(t));
    let result = html;

    dangerousTags.forEach(tag => {
        const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
        result = result.replace(regex, '');
        // Also remove self-closing
        result = result.replace(new RegExp(`<${tag}[^>]*/?>`, 'gi'), '');
    });

    // Remove dangerous attributes
    DANGEROUS_ATTRS.forEach(attr => {
        result = result.replace(new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi'), '');
        result = result.replace(new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]+`, 'gi'), '');
    });

    // Remove javascript: URLs
    result = result.replace(/\s*(href|src|action|poster|background)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '');

    // Remove data: URLs except for images if configured
    result = result.replace(/\s*(href|src|action|poster|background)\s*=\s*["']?\s*data:[^"'\s>]+/gi, (match) => {
        return match.toLowerCase().includes('data:image/') ? match : '';
    });

    // Remove event handlers and script content
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    return maxLength ? result.slice(0, maxLength) : result;
}

// ============================================================================
// URL Validation & Sanitization
// ============================================================================

/**
 * Check if a URL is valid and safe
 */
export function isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsed = new URL(url, 'https://example.com');

        // Block dangerous protocols
        if (DANGEROUS_PROTOCOLS.test(parsed.protocol)) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Sanitize a URL, returning empty string if invalid
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();

    // Block dangerous protocols
    if (DANGEROUS_PROTOCOLS.test(trimmed)) {
        return '';
    }

    // Allow relative URLs
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
        return trimmed;
    }

    // Allow hash links
    if (trimmed.startsWith('#')) {
        return trimmed;
    }

    // Allow safe protocols
    if (SAFE_PROTOCOLS.test(trimmed)) {
        return trimmed;
    }

    // If no protocol, assume relative
    if (!trimmed.includes(':')) {
        return trimmed;
    }

    // Block everything else
    return '';
}

/**
 * Create a safe external link URL (adds noopener, noreferrer attributes)
 */
export function safeExternalLink(url: string): { href: string; rel: string; target: string } | null {
    const sanitized = sanitizeUrl(url);
    if (!sanitized) return null;

    return {
        href: sanitized,
        rel: 'noopener noreferrer',
        target: '_blank'
    };
}

// ============================================================================
// Input Sanitization
// ============================================================================

export interface InputSanitizeOptions {
    /** Maximum length */
    maxLength?: number;
    /** Minimum length */
    minLength?: number;
    /** Allowed characters regex pattern */
    allowedPattern?: RegExp;
    /** Trim whitespace */
    trim?: boolean;
    /** Convert to lowercase */
    lowercase?: boolean;
    /** Convert to uppercase */
    uppercase?: boolean;
    /** Remove HTML tags */
    stripHtml?: boolean;
    /** Normalize whitespace (collapse multiple spaces) */
    normalizeWhitespace?: boolean;
}

/**
 * Sanitize user input with various options
 */
export function sanitizeInput(input: string, options: InputSanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') return '';

    let result = input;

    // Strip HTML first
    if (options.stripHtml) {
        result = result.replace(/<[^>]*>/g, '');
    }

    // Trim
    if (options.trim !== false) {
        result = result.trim();
    }

    // Normalize whitespace
    if (options.normalizeWhitespace) {
        result = result.replace(/\s+/g, ' ');
    }

    // Apply allowed pattern
    if (options.allowedPattern) {
        result = result.replace(new RegExp(`[^${options.allowedPattern.source}]`, 'g'), '');
    }

    // Case transformation
    if (options.lowercase) {
        result = result.toLowerCase();
    } else if (options.uppercase) {
        result = result.toUpperCase();
    }

    // Length constraints
    if (options.minLength && result.length < options.minLength) {
        return '';
    }
    if (options.maxLength) {
        result = result.slice(0, options.maxLength);
    }

    return result;
}

// ============================================================================
// CSP Utilities
// ============================================================================

export interface CSPDirective {
    name: string;
    values: string[];
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
    // Browser
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    // SSR (Node.js)
    try {
        const nodeCrypto = (globalThis as any).require?.('crypto');
        if (nodeCrypto && nodeCrypto.randomBytes) {
            return nodeCrypto.randomBytes(16).toString('base64');
        }
    } catch {
        // Fallback for non-Node SSR or failed require
    }

    // Last resort fallback (non-secure)
    console.warn('[Security] Using weak nonce fallback. Use in production with caution.');
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create CSP meta tag content
 */
export function createCSPContent(directives: CSPDirective[]): string {
    return directives
        .map(d => `${d.name} ${d.values.join(' ')}`)
        .join('; ');
}

/**
 * Common CSP presets
 */
export const CSP_PRESETS = {
    strict: [
        { name: 'default-src', values: ["'self'"] },
        { name: 'script-src', values: ["'self'"] },
        { name: 'style-src', values: ["'self'", "'unsafe-inline'"] },
        { name: 'img-src', values: ["'self'", 'data:', 'https:'] },
        { name: 'font-src', values: ["'self'"] },
        { name: 'connect-src', values: ["'self'"] },
        { name: 'frame-ancestors', values: ["'none'"] },
    ] as CSPDirective[],

    moderate: [
        { name: 'default-src', values: ["'self'"] },
        { name: 'script-src', values: ["'self'", "'unsafe-inline'"] },
        { name: 'style-src', values: ["'self'", "'unsafe-inline'"] },
        { name: 'img-src', values: ["'self'", 'data:', 'https:', 'blob:'] },
        { name: 'font-src', values: ["'self'", 'https:'] },
        { name: 'connect-src', values: ["'self'", 'https:'] },
    ] as CSPDirective[],
};

// ============================================================================
// Security Validation
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
} {
    const feedback: string[] = [];
    let score = 0;

    if (!password) return { score: 0, feedback: ['Password is required'] };

    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length < 8) feedback.push('Use at least 8 characters');

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Common patterns (reduce score)
    if (/^[a-z]+$/i.test(password)) score -= 1;
    if (/^[0-9]+$/.test(password)) score -= 2;
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated chars

    return { score: Math.max(0, Math.min(7, score)), feedback };
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';

    return filename
        .replace(/[/\\:*?"<>|]/g, '') // Remove dangerous chars
        .replace(/\.\./g, '') // Prevent path traversal
        .replace(/^\.+/, '') // Remove leading dots
        .trim()
        .slice(0, 255); // Max filename length
}
