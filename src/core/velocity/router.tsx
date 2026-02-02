import { createMemo, createSignal, onCleanup, untrack, batch, createSuspense } from './reactivity';
import { createElement } from './jsx';
import type { FC, Props } from './jsx';

// ============================================================================
// Global Router Instance
// ============================================================================

let globalLink: any = null;
let globalUseRouter: any = null;

export function _setGlobalRouter(Link: any, useRouter: any) {
    globalLink = Link;
    globalUseRouter = useRouter;
}

export const Link: any = (props: any) => {
    if (!globalLink) throw new Error('Router not initialized. Call createRouter first.');
    return globalLink(props);
};

export const useRouter = (): any => {
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
                queueMicrotask(() => navigate(outcome, { replace: true }));
                return 'redirected';
            }
        }
        return 'ok';
    };

    const resolve = createMemo(() => {
        const currentPath = normalizePath(path());
        const currentQuery = query();

        const extractParams = (route: CompiledRoute, match: RegExpExecArray | null) => {
            const nextParams: Record<string, string> = {};
            if (!match) return nextParams;
            route.keys.forEach((key, index) => {
                const value = match[index + 1];
                if (value) {
                    nextParams[key] = decodeURIComponent(value);
                }
            });
            return nextParams;
        };

        const findBestMatch = (routesToSearch: CompiledRoute[]): { stack: CompiledRoute[]; params: Record<string, string>; score: number } | null => {
            let best: { stack: CompiledRoute[]; params: Record<string, string>; score: number } | null = null;

            for (const route of routesToSearch) {
                const hasChildren = Boolean(route.children && route.children.length);
                const prefixMatch = hasChildren ? route.prefixRegex.exec(currentPath) : null;
                const exactMatch = route.regex.exec(currentPath);

                if (!hasChildren && !exactMatch) continue;
                if (hasChildren && !prefixMatch && !exactMatch) continue;

                const baseMatch = prefixMatch ?? exactMatch;
                const baseParams = extractParams(route, baseMatch);

                let candidate: { stack: CompiledRoute[]; params: Record<string, string>; score: number } | null = null;
                if (hasChildren) {
                    const childMatch = findBestMatch(route.children!);
                    if (childMatch) {
                        candidate = {
                            stack: [route, ...childMatch.stack],
                            params: { ...baseParams, ...childMatch.params },
                            score: route.score + childMatch.score,
                        };
                    }
                }

                if (!candidate && exactMatch) {
                    candidate = { stack: [route], params: baseParams, score: route.score };
                }

                if (candidate) {
                    if (!best || candidate.score > best.score || candidate.stack.length > best.stack.length) {
                        best = candidate;
                    }
                }
            }

            return best;
        };

        const matched = findBestMatch(compiled);

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
                            queueMicrotask(() => navigate(fallback, { replace: true }));
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
