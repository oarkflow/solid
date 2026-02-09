import { createMemo, createSignal, onCleanup, untrack, batch, createSuspense } from './reactivity';
import { createElement } from './jsx';
import type { FC, Props } from './jsx';

// ============================================================================
// Global Router Instance
// ============================================================================

let globalLink: any = null;
let globalUseRouter: any = null;

export function _setGlobalRouter(Link: FC<any>, useRouter: () => RouterApi) {
    globalLink = Link;
    globalUseRouter = useRouter;
}

export const Link: FC<Props & { to: string; activeClass?: string; exactActiveClass?: string }> = (props) => {
    if (!globalLink) throw new Error('Router not initialized. Call createRouter first.');
    return globalLink(props);
};

export const useRouter = (): RouterApi => {
    if (!globalUseRouter) throw new Error('Router not initialized. Call createRouter first.');
    return globalUseRouter();
};

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
    children?: Route[];
};

type CompiledRoute = Route & {
    regex: RegExp;
    prefixRegex: RegExp;
    keys: string[];
    score: number;
    children?: CompiledRoute[];
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
// Route Matching (Radix Trie)
// ============================================================================

type RadixNode = {
    children: Map<string, RadixNode>;
    param?: string;
    wildcard?: boolean;
    stack?: CompiledRoute[]; // Stack of routes (for nested outlets)
};

function createRadixNode(): RadixNode {
    return { children: new Map() };
}


function insertRoute(rootNode: RadixNode, route: CompiledRoute, parentStack: CompiledRoute[] = []) {
    // console.log('Insert:', route.path, 'Stack:', parentStack.map(r => r.path));
    let current = rootNode;
    const stack = [...parentStack, route];
    const parts = route.path.split('/').filter(p => p !== '');

    if (parts.length === 0 && parentStack.length === 0) {
        current.stack = stack;
    } else {
        for (const part of parts) {
            if (part.startsWith(':')) {
                let paramNode = current.children.get(':');
                if (!paramNode) {
                    paramNode = createRadixNode();
                    paramNode.param = part.slice(1);
                    current.children.set(':', paramNode);
                }
                current = paramNode;
            } else if (part.startsWith('*')) {
                let wildNode = current.children.get('*');
                if (!wildNode) {
                    wildNode = createRadixNode();
                    wildNode.wildcard = true;
                    wildNode.param = part.slice(1) || 'path';
                    current.children.set('*', wildNode);
                }
                current = wildNode;
                break;
            } else {
                let next = current.children.get(part);
                if (!next) {
                    next = createRadixNode();
                    current.children.set(part, next);
                }
                current = next;
            }
        }
        current.stack = stack;
    }

    if (route.children) {
        for (const child of route.children) {
            insertRoute(rootNode, child, stack);
        }
    }
}

function findMatch(rootNode: RadixNode, path: string): { stack: CompiledRoute[]; params: Record<string, string> } | null {
    // console.log('FindMatch:', path);
    const parts = path.split('/').filter(p => p !== '');
    const params: Record<string, string> = {};

    function search(node: RadixNode, index: number): CompiledRoute[] | null {
        if (index === parts.length) return node.stack || null;

        const part = parts[index];

        const exact = node.children.get(part);
        if (exact) {
            const res = search(exact, index + 1);
            if (res) return res;
        }

        const paramNode = node.children.get(':');
        if (paramNode) {
            const res = search(paramNode, index + 1);
            if (res) {
                // console.log('Found param:', paramNode.param, '=', part);
                params[paramNode.param!] = decodeURIComponent(part);
                return res;
            }
        }

        const wildNode = node.children.get('*');
        if (wildNode) {
            params[wildNode.param!] = parts.slice(index).map(decodeURIComponent).join('/');
            return wildNode.stack || null;
        }

        return null;
    }

    const stack = search(rootNode, 0);
    // console.log('Result:', stack ? 'Match' : 'No match', 'Params:', params);
    return stack ? { stack, params } : null;
}

// ============================================================================
// Security
// ============================================================================

function sanitizePath(to: string): string | null {
    if (!to) return null;

    // Block potential protocol attacks (javascript:, data:, etc.)
    const lower = to.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
        console.warn(`[Router] Blocked dangerous protocol: ${to}`);
        return null;
    }

    try {
        // Handle absolute URLs
        if (to.includes('://')) {
            const url = new URL(to);
            if (url.origin !== window.location.origin) {
                console.warn(`[Router] Blocked external navigation: ${to}`);
                return null;
            }
            return url.pathname + url.search + url.hash;
        }

        // Handle protocol-relative URLs
        if (to.startsWith('//')) {
            return null;
        }

        // Must be a relative path or absolute path within same origin
        if (to.startsWith('/')) {
            return to;
        }

        // Relative path: Resolve against current pathname to be safe
        const resolved = new URL(to, window.location.href);
        return resolved.pathname + resolved.search + resolved.hash;
    } catch {
        return to.startsWith('/') ? to : null;
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

function joinPaths(base: string, path: string): string {
    if (!path) return base || '/';
    if (path.startsWith('/')) return path;
    if (base === '/' || !base) return `/${path}`;
    return `${base}/${path}`;
}

function compileRoute(route: Route, basePath: string): CompiledRoute {
    const { children, ...rest } = route;
    const keys: string[] = [];
    const normalized = normalizePath(joinPaths(basePath, route.path));

    if (normalized === '*' || normalized === '/*') {
        return { ...rest, regex: /^.*$/, prefixRegex: /^.*$/, keys, score: -1 };
    }

    const pattern = normalized
        .replace(/\//g, '\\/')
        .replace(/:(\w+)(\?)?/g, (_, key: string, optional: string) => {
            keys.push(key);
            return optional ? '(?:\\/([^\\/]+))?' : '([^\\/]+)';
        })
        .replace(/\*/g, '.*');

    return {
        ...rest,
        path: normalized,
        regex: new RegExp(`^${pattern}\/?$`),
        prefixRegex: new RegExp(`^${pattern}(?:\/.*)?$`),
        keys,
        score: scoreRoute(normalized),
    };
}

function compileRoutes(routes: Route[], basePath = ''): CompiledRoute[] {
    return routes
        .map(route => {
            const compiled = compileRoute(route, basePath);
            if (route.children?.length) {
                compiled.children = compileRoutes(route.children, normalizePath(joinPaths(basePath, route.path)));
            }
            return compiled;
        })
        .sort((a, b) => b.score - a.score);
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

    const compiled = compileRoutes(routes);

    // Route match cache with size limit to prevent unbounded growth
    const MAX_CACHE_SIZE = 100;
    const matchCache = new Map<string, { stack: CompiledRoute[]; params: Record<string, string>; score: number } | null>();

    // Create instance-specific Radix Trie (not shared across router instances)
    const rootNode = createRadixNode();
    compiled.forEach(r => insertRoute(rootNode, r));

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
        currentQuery: URLSearchParams,
        includeGlobal = true
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

        const pipeline = [
            ...(includeGlobal ? globalMiddlewares : []),
            ...(route.middlewares ?? []),
        ];
        for (const middleware of pipeline) {
            const outcome = untrack(() => middleware(context));
            if (outcome === false) {
                return 'blocked';
            }
            if (typeof outcome === 'string') {
                setTimeout(() => navigate(outcome, { replace: true }), 0);
                return 'redirected';
            }
        }
        return 'ok';
    };

    const resolve = createMemo(() => {
        const currentPath = normalizePath(path());
        const currentQuery = query();

        // Check cache first
        const cacheKey = currentPath + currentQuery.toString();
        let matched = matchCache.get(cacheKey);

        if (!matched) {
            const res = findMatch(rootNode, currentPath);
            if (res) {
                matched = {
                    stack: res.stack,
                    params: res.params,
                    score: 0 // Score not needed for trie but kept for type compatibility
                };
            }
            // Evict oldest entry if cache is full
            if (matchCache.size >= MAX_CACHE_SIZE) {
                const firstKey = matchCache.keys().next().value;
                if (firstKey !== undefined) matchCache.delete(firstKey);
            }
            matchCache.set(cacheKey, matched || null);
        }

        if (matched) {
            let routeMeta: RouteMeta | undefined;
            let blocked = false;

            for (let i = 0; i < matched.stack.length; i++) {
                const route = matched.stack[i];

                if (route.guard) {
                    const allowed = route.guard!();
                    if (!allowed) {
                        const fallback = route.redirectTo ?? '/login';
                        if (normalizePath(fallback) !== currentPath) {
                            setTimeout(() => navigate(fallback, { replace: true }), 0);
                        }
                        setParams({});
                        applyMeta(undefined);
                        options?.onBlocked?.(currentPath);
                        blocked = true;
                        break;
                    }
                }

                routeMeta = resolveMeta(route.meta, matched.params, currentQuery);
                const middlewareOutcome = runMiddlewares(route, matched.params, routeMeta, currentPath, currentQuery, i === 0);
                if (middlewareOutcome === 'blocked') {
                    setParams({});
                    applyMeta(undefined);
                    options?.onBlocked?.(currentPath);
                    blocked = true;
                    break;
                }
                if (middlewareOutcome === 'redirected') {
                    blocked = true;
                    break;
                }
            }

            if (blocked) {
                return { stack: [], blocked: true, meta: routeMeta };
            }

            setParams(matched.params);
            applyMeta(routeMeta);
            const leaf = matched.stack[matched.stack.length - 1];
            lastSnapshot = { path: currentPath, meta: routeMeta, route: leaf };
            return { stack: matched.stack, blocked: false, meta: routeMeta };
        }

        setParams({});
        const fallbackMeta = resolveMeta(options?.notFoundMeta, {}, currentQuery);
        applyMeta(fallbackMeta);
        lastSnapshot = { path: currentPath, meta: fallbackMeta };
        return {
            stack: options?.notFound ? [{
                path: '*',
                component: options.notFound,
                regex: /^.*$/,
                prefixRegex: /^.*$/,
                keys: [],
                score: -1,
            }] : [], blocked: false, meta: fallbackMeta
        };
    });

    /**
     * Router component - renders matched route
     */
    let currentOutlet: (() => JSX.Element | null) | null = null;

    const renderStack = (stack: CompiledRoute[], index = 0): JSX.Element | null => {
        const route = stack[index];
        if (!route) return null;
        const Component = route.component;
        const prevOutlet = currentOutlet;
        currentOutlet = () => renderStack(stack, index + 1);
        try {
            return <Component />;
        } finally {
            currentOutlet = prevOutlet;
        }
    };

    const Outlet: FC = () => createElement('div', { style: { display: 'contents' } }, () => currentOutlet ? currentOutlet() : null);

    const Router: FC<{ fallback?: JSX.Element }> = (props) => {
        const [suspenseState] = createSuspense();
        return (
            <div class="router-view" data-path={path}>
                {() => {
                    const result = resolve();
                    if (result.blocked || !result.stack.length) return null;
                    const suspense = suspenseState();
                    return (
                        <div style={{ display: 'contents' }}>
                            {suspense.pending ? (props.fallback ?? null) : null}
                            <div style={{ display: suspense.pending ? 'none' : 'contents' }}>
                                {renderStack(result.stack)}
                            </div>
                        </div>
                    );
                }}
            </div>
        );
    };

    /**
     * Link component - declarative navigation
     */
    const LocalLink: FC<Props & {
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
    const localUseRouter = (): RouterApi => ({
        path,
        params,
        query,
        meta,
        navigate,
        back,
        forward,
    });

    // Set global exports
    _setGlobalRouter(LocalLink, localUseRouter);

    return { Router, Link: LocalLink, useRouter: localUseRouter, Outlet };
}
