import { createMemo, createSignal, onCleanup, untrack, batch } from './reactivity';
import { createElement } from './jsx';
import type { FC, Props } from './jsx';

// ============================================================================
// Types
// ============================================================================

export type Route = {
    path: string;
    component: FC;
    guard?: () => boolean;
    redirectTo?: string;
    meta?: Record<string, unknown>;
};

type CompiledRoute = Route & {
    regex: RegExp;
    keys: string[];
};

type RouterOptions = {
    notFound?: FC;
    onBlocked?: (path: string) => void;
    beforeEach?: (to: string, from: string) => boolean | string | void;
};

type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

export type RouterApi = {
    path: () => string;
    params: () => Record<string, string>;
    query: () => URLSearchParams;
    navigate: (to: string, options?: NavigateOptions) => void;
    back: () => void;
    forward: () => void;
};

// ============================================================================
// Security
// ============================================================================

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

/**
 * Sanitize and validate navigation path
 */
function sanitizePath(to: string): string | null {
    if (typeof to !== 'string') return null;

    const trimmed = to.trim();
    if (DANGEROUS_PROTOCOLS.test(trimmed.toLowerCase())) {
        console.warn(`[Router] Blocked dangerous URL: ${to}`);
        return null;
    }

    try {
        const url = new URL(to, window.location.origin);

        // Block external navigation
        if (url.origin !== window.location.origin) {
            console.warn(`[Router] Blocked external navigation: ${to}`);
            return null;
        }

        return url.pathname + url.search + url.hash;
    } catch {
        // If URL parsing fails, treat as relative path
        if (to.startsWith('/')) {
            return to;
        }
        return null;
    }
}

// ============================================================================
// Path Utilities
// ============================================================================

function normalizePath(path: string): string {
    if (!path) return '/';
    let clean = path.split(/[?#]/)[0];
    if (!clean.startsWith('/')) clean = `/${clean}`;
    if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean;
}

function compileRoute(route: Route): CompiledRoute {
    const keys: string[] = [];
    const normalized = normalizePath(route.path);

    // Catch-all route
    if (normalized === '*' || normalized === '/*') {
        return { ...route, regex: /^.*$/, keys };
    }

    // Build regex pattern
    const pattern = normalized
        .replace(/\//g, '\\/')
        .replace(/:(\w+)(\?)?/g, (_, key: string, optional: string) => {
            keys.push(key);
            return optional ? '(?:\\/([^\\/]+))?' : '([^\\/]+)';
        })
        .replace(/\*/g, '.*');

    return {
        ...route,
        regex: new RegExp(`^${pattern}\\/?$`),
        keys,
    };
}

// ============================================================================
// Router Factory
// ============================================================================

export function createRouter(routes: Route[], options?: RouterOptions) {
    const compiled = routes.map(compileRoute);

    // Reactive state
    const [path, setPath] = createSignal(window.location.pathname);
    const [params, setParams] = createSignal<Record<string, string>>({});
    const [query, setQuery] = createSignal(new URLSearchParams(window.location.search));

    // Update query params
    const updateQuery = () => {
        setQuery(new URLSearchParams(window.location.search));
    };

    /**
     * Navigate to a new path
     */
    const navigate = (to: string, navOptions?: NavigateOptions) => {
        const safe = sanitizePath(to);
        if (!safe) {
            options?.onBlocked?.(to);
            return;
        }

        const currentPath = normalizePath(path());
        const nextPath = normalizePath(safe);

        // Skip if same path
        if (nextPath === currentPath && !to.includes('?')) {
            return;
        }

        // Before navigation hook
        if (options?.beforeEach) {
            const result = options.beforeEach(nextPath, currentPath);
            if (result === false) {
                options?.onBlocked?.(to);
                return;
            }
            if (typeof result === 'string') {
                navigate(result, { replace: true });
                return;
            }
        }

        batch(() => {
            if (navOptions?.replace) {
                window.history.replaceState(navOptions?.state ?? {}, '', safe);
            } else {
                window.history.pushState(navOptions?.state ?? {}, '', safe);
            }

            setPath(window.location.pathname);
            updateQuery();
        });
    };

    /**
     * Go back in history
     */
    const back = () => window.history.back();

    /**
     * Go forward in history
     */
    const forward = () => window.history.forward();

    // Listen for popstate events
    const handlePopState = () => {
        batch(() => {
            setPath(window.location.pathname);
            updateQuery();
        });
    };

    window.addEventListener('popstate', handlePopState);

    onCleanup(() => {
        window.removeEventListener('popstate', handlePopState);
    });

    /**
     * Resolve current route
     */
    const resolve = createMemo(() => {
        const current = normalizePath(path());

        for (const route of compiled) {
            const match = route.regex.exec(current);
            if (!match) continue;

            // Extract params
            const nextParams: Record<string, string> = {};
            route.keys.forEach((key, index) => {
                const value = match[index + 1];
                if (value) {
                    nextParams[key] = decodeURIComponent(value);
                }
            });

            // Check guard
            if (route.guard) {
                const allowed = untrack(() => route.guard!());
                if (!allowed) {
                    const fallback = route.redirectTo ?? '/login';
                    if (normalizePath(fallback) !== current) {
                        // Defer redirect to avoid loop
                        queueMicrotask(() => navigate(fallback, { replace: true }));
                    }
                    setParams({});
                    return { component: null, blocked: true, meta: route.meta };
                }
            }

            setParams(nextParams);
            return { component: route.component, blocked: false, meta: route.meta };
        }

        setParams({});
        return { component: options?.notFound ?? null, blocked: false, meta: {} };
    });

    /**
     * Router component - renders matched route
     */
    const Router: FC = () => (
        <div class="router-view" data-path={path}>
            {() => {
                const result = resolve();
                if (result.blocked || !result.component) return null;
                const Component = result.component;
                return <Component />;
            }}
        </div>
    );

    /**
     * Link component - declarative navigation
     */
    const Link: FC<Props & {
        to: string;
        class?: string;
        activeClass?: string;
        exactActiveClass?: string;
    }> = (props) => {
        const isActive = createMemo(() => {
            const currentPath = normalizePath(path());
            const targetPath = normalizePath(props.to);
            return currentPath === targetPath || currentPath.startsWith(targetPath + '/');
        });

        const isExactActive = createMemo(() => {
            return normalizePath(path()) === normalizePath(props.to);
        });

        const handleClick = (event: MouseEvent) => {
            // Allow default behavior for modifier keys
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            navigate(props.to);
        };

        const classes = createMemo(() => {
            const classList: string[] = [];
            if (props.class) classList.push(props.class);
            if (props.activeClass && isActive()) classList.push(props.activeClass);
            if (props.exactActiveClass && isExactActive()) classList.push(props.exactActiveClass);
            return classList.join(' ');
        });

        return (
            <a
                href={props.to}
                class={classes}
                onClick={handleClick}
            >
                {props.children}
            </a>
        );
    };

    /**
     * Hook to access router API
     */
    const useRouter = (): RouterApi => ({
        path,
        params,
        query,
        navigate,
        back,
        forward,
    });

    return { Router, Link, useRouter };
}
