import { createMemo, createSignal, onCleanup, untrack, batch } from './reactivity';
import { createElement } from './jsx';
import type { FC, Props } from './jsx';

// ============================================================================
// Types
// ============================================================================

export type MetaTagDescriptor = {
    name?: string;
    property?: string;
    content: string;
};

export type RouteMeta = {
    title?: string;
    description?: string;
    keywords?: string | string[];
    robots?: string;
    canonical?: string;
    tags?: MetaTagDescriptor[];
};

type RouteMetaFactoryContext = {
    params: Record<string, string>;
    query: URLSearchParams;
};

export type RouteMetaInput = RouteMeta | ((ctx: RouteMetaFactoryContext) => RouteMeta);

export type RouteSnapshot = {
    path: string;
    meta?: RouteMeta;
    route?: Route;
};

export type MiddlewareContext = {
    to: RouteSnapshot;
    from: RouteSnapshot;
    params: Record<string, string>;
    query: URLSearchParams;
    navigate: (to: string, options?: NavigateOptions) => void;
};

export type MiddlewareResult = void | boolean | string;
export type Middleware = (ctx: MiddlewareContext) => MiddlewareResult;

export type Route = {
    path: string;
    component: FC;
    guard?: () => boolean;
    redirectTo?: string;
    meta?: RouteMetaInput;
    middlewares?: Middleware[];
};

type CompiledRoute = Route & {
    regex: RegExp;
    keys: string[];
    score: number;
};

export type HeadConfig = {
    defaultTitle?: string;
    titleTemplate?: string | ((title: string) => string);
    persistentTags?: MetaTagDescriptor[];
};

type RouterOptions = {
    notFound?: FC;
    notFoundMeta?: RouteMetaInput;
    onBlocked?: (path: string) => void;
    beforeEach?: (to: string, from: string) => boolean | string | void;
    middlewares?: Middleware[];
    head?: HeadConfig;
};

type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

export type RouterApi = {
    path: () => string;
    params: () => Record<string, string>;
    query: () => URLSearchParams;
    meta: () => RouteMeta | undefined;
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
// Path & Meta Utilities
// ============================================================================

function normalizePath(path: string): string {
    if (!path) return '/';
    let clean = path.split(/[?#]/)[0];
    clean = clean.replace(/\/{2,}/g, '/');
    if (!clean.startsWith('/')) clean = `/${clean}`;
    if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean || '/';
}

function scoreRoute(path: string): number {
    if (!path || path === '*' || path === '/*') return -1;
    return path.split('/').reduce((score, segment) => {
        if (!segment) return score;
        if (segment === '*') return score - 10;
        if (segment.startsWith(':')) return score + (segment.endsWith('?') ? 1 : 2);
        return score + 10;
    }, 0);
}

function compileRoute(route: Route): CompiledRoute {
    const keys: string[] = [];
    const normalized = normalizePath(route.path);

    if (normalized === '*' || normalized === '/*') {
        return { ...route, regex: /^.*$/, keys, score: -1 };
    }

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
        score: scoreRoute(normalized),
    };
}

function resolveMeta(
    metaInput: RouteMetaInput | undefined,
    params: Record<string, string>,
    query: URLSearchParams
): RouteMeta | undefined {
    if (!metaInput) return undefined;
    const base = typeof metaInput === 'function'
        ? metaInput({ params, query })
        : metaInput;
    if (!base) return undefined;
    return {
        ...base,
        keywords: Array.isArray(base.keywords) ? base.keywords.join(', ') : base.keywords,
    };
}

function formatTitle(title: string, template?: HeadConfig['titleTemplate']): string {
    if (!title) return '';
    if (!template) return title;
    if (typeof template === 'function') return template(title);
    return template.replace(/%s/g, title);
}

function createHeadManager(config?: HeadConfig) {
    let managedNodes: HTMLElement[] = [];
    let canonicalNode: HTMLLinkElement | null = null;

    const cleanup = () => {
        managedNodes.forEach(node => node.remove());
        managedNodes = [];
        if (canonicalNode) {
            canonicalNode.remove();
            canonicalNode = null;
        }
    };

    const apply = (meta?: RouteMeta) => {
        if (typeof document === 'undefined' || typeof window === 'undefined') {
            return;
        }

        if (meta?.title || config?.defaultTitle) {
            const title = meta?.title ?? config?.defaultTitle ?? '';
            document.title = formatTitle(title, config?.titleTemplate);
        }

        cleanup();

        const tags: MetaTagDescriptor[] = [];
        if (config?.persistentTags?.length) {
            tags.push(...config.persistentTags);
        }
        if (meta?.description) {
            tags.push({ name: 'description', content: meta.description });
        }
        if (meta?.keywords) {
            tags.push({ name: 'keywords', content: typeof meta.keywords === 'string' ? meta.keywords : String(meta.keywords) });
        }
        if (meta?.robots) {
            tags.push({ name: 'robots', content: meta.robots });
        }
        if (meta?.tags?.length) {
            tags.push(...meta.tags);
        }

        tags.forEach(tag => {
            const node = document.createElement('meta');
            if (tag.name) node.setAttribute('name', tag.name);
            if (tag.property) node.setAttribute('property', tag.property);
            node.setAttribute('content', tag.content);
            node.setAttribute('data-router-head', '');
            document.head.appendChild(node);
            managedNodes.push(node);
        });

        if (meta?.canonical) {
            canonicalNode = document.createElement('link');
            canonicalNode.setAttribute('rel', 'canonical');
            const url = meta.canonical.startsWith('http')
                ? meta.canonical
                : `${window.location.origin}${meta.canonical}`;
            canonicalNode.setAttribute('href', url);
            canonicalNode.setAttribute('data-router-head', '');
            document.head.appendChild(canonicalNode);
        }
    };

    return { apply };
}

// ============================================================================
// Router Factory
// ============================================================================

export function createRouter(routes: Route[], options?: RouterOptions) {
    if (typeof window === 'undefined') {
        throw new Error('[Router] Window is not available.');
    }

    const compiled = routes
        .map(compileRoute)
        .sort((a, b) => b.score - a.score);

    const headManager = createHeadManager(options?.head);
    const globalMiddlewares = options?.middlewares ?? [];

    const [path, setPath] = createSignal(normalizePath(window.location.pathname));
    const [params, setParams] = createSignal<Record<string, string>>({});
    const [query, setQuery] = createSignal(new URLSearchParams(window.location.search));
    const [meta, setMeta] = createSignal<RouteMeta | undefined>(undefined);

    let lastSnapshot: RouteSnapshot = { path: normalizePath(window.location.pathname) };

    const updateQuery = () => {
        setQuery(new URLSearchParams(window.location.search));
    };

    const applyMeta = (nextMeta?: RouteMeta) => {
        setMeta(nextMeta);
        headManager.apply(nextMeta);
    };

    const navigate = (to: string, navOptions?: NavigateOptions) => {
        const safe = sanitizePath(to);
        if (!safe) {
            options?.onBlocked?.(to);
            return;
        }

        const currentPath = normalizePath(path());
        const nextPath = normalizePath(safe);

        if (nextPath === currentPath && !to.includes('?')) {
            return;
        }

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

            setPath(normalizePath(window.location.pathname));
            updateQuery();
        });
    };

    const back = () => window.history.back();
    const forward = () => window.history.forward();

    const handlePopState = () => {
        batch(() => {
            setPath(normalizePath(window.location.pathname));
            updateQuery();
        });
    };

    window.addEventListener('popstate', handlePopState);

    onCleanup(() => {
        window.removeEventListener('popstate', handlePopState);
    });

    const runMiddlewares = (
        route: Route,
        nextParams: Record<string, string>,
        nextMeta: RouteMeta | undefined,
        currentPath: string,
        currentQuery: URLSearchParams
    ): 'ok' | 'blocked' | 'redirected' => {
        if (!globalMiddlewares.length && !(route.middlewares?.length)) {
            return 'ok';
        }

        const context: MiddlewareContext = {
            to: { path: currentPath, meta: nextMeta, route },
            from: lastSnapshot,
            params: nextParams,
            query: currentQuery,
            navigate,
        };

        const pipeline = [...globalMiddlewares, ...(route.middlewares ?? [])];
        for (const middleware of pipeline) {
            const outcome = untrack(() => middleware(context));
            if (outcome === false) {
                return 'blocked';
            }
            if (typeof outcome === 'string') {
                queueMicrotask(() => navigate(outcome, { replace: true }));
                return 'redirected';
            }
        }
        return 'ok';
    };

    const resolve = createMemo(() => {
        const currentPath = normalizePath(path());
        const currentQuery = query();

        for (const route of compiled) {
            const match = route.regex.exec(currentPath);
            if (!match) continue;

            const nextParams: Record<string, string> = {};
            route.keys.forEach((key, index) => {
                const value = match[index + 1];
                if (value) {
                    nextParams[key] = decodeURIComponent(value);
                }
            });

            if (route.guard) {
                const allowed = untrack(() => route.guard!());
                if (!allowed) {
                    const fallback = route.redirectTo ?? '/login';
                    if (normalizePath(fallback) !== currentPath) {
                        queueMicrotask(() => navigate(fallback, { replace: true }));
                    }
                    setParams({});
                    applyMeta(undefined);
                    options?.onBlocked?.(currentPath);
                    return { component: null, blocked: true, meta: undefined };
                }
            }

            const routeMeta = resolveMeta(route.meta, nextParams, currentQuery);
            const middlewareOutcome = runMiddlewares(route, nextParams, routeMeta, currentPath, currentQuery);
            if (middlewareOutcome === 'blocked') {
                setParams({});
                applyMeta(undefined);
                options?.onBlocked?.(currentPath);
                return { component: null, blocked: true, meta: routeMeta };
            }
            if (middlewareOutcome === 'redirected') {
                return { component: null, blocked: true, meta: routeMeta };
            }

            setParams(nextParams);
            applyMeta(routeMeta);
            lastSnapshot = { path: currentPath, meta: routeMeta, route };
            return { component: route.component, blocked: false, meta: routeMeta };
        }

        setParams({});
        const fallbackMeta = resolveMeta(options?.notFoundMeta, {}, currentQuery);
        applyMeta(fallbackMeta);
        lastSnapshot = { path: currentPath, meta: fallbackMeta };
        return { component: options?.notFound ?? null, blocked: false, meta: fallbackMeta };
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
        meta,
        navigate,
        back,
        forward,
    });

    return { Router, Link, useRouter };
}
