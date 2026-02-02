import { createMemo, createSignal } from './reactivity';
import { createElement } from './jsx';
import type { FC, Props } from './jsx';

export type Route = {
    path: string;
    component: FC;
    guard?: () => boolean;
    redirectTo?: string;
};

type CompiledRoute = Route & {
    regex: RegExp;
    keys: string[];
};

type RouterOptions = {
    notFound?: FC;
    onBlocked?: (path: string) => void;
};

type NavigateOptions = {
    replace?: boolean;
};

export type RouterApi = {
    path: () => string;
    params: () => Record<string, string>;
    navigate: (to: string, options?: NavigateOptions) => void;
};

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
    if (normalized === '*' || normalized === '/*') {
        return { ...route, regex: /^.*$/, keys };
    }

    const pattern = normalized
        .replace(/\//g, '\\/')
        .replace(/:(\w+)/g, (_, key: string) => {
            keys.push(key);
            return '([^\\/]+)';
        })
        .replace(/\*/g, '.*');

    return {
        ...route,
        regex: new RegExp(`^${pattern}\/?$`),
        keys,
    };
}

function sanitizePath(to: string): string | null {
    if (typeof to !== 'string') return null;
    const lower = to.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) return null;

    try {
        const url = new URL(to, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return url.pathname + url.search + url.hash;
    } catch {
        return null;
    }
}

export function createRouter(routes: Route[], options?: RouterOptions) {
    const compiled = routes.map(compileRoute);
    const [path, setPath] = createSignal(window.location.pathname);
    const [params, setParams] = createSignal<Record<string, string>>({});

    const navigate = (to: string, navOptions?: NavigateOptions) => {
        const safe = sanitizePath(to);
        if (!safe) {
            options?.onBlocked?.(to);
            return;
        }
        const nextPath = normalizePath(safe);
        if (nextPath === normalizePath(path())) return;

        if (navOptions?.replace) {
            window.history.replaceState({}, '', safe);
        } else {
            window.history.pushState({}, '', safe);
        }
        setPath(window.location.pathname);
    };

    window.addEventListener('popstate', () => {
        setPath(window.location.pathname);
    });

    const resolve = createMemo(() => {
        const current = normalizePath(path());

        for (const route of compiled) {
            const match = route.regex.exec(current);
            if (!match) continue;

            const nextParams: Record<string, string> = {};
            route.keys.forEach((key, index) => {
                nextParams[key] = decodeURIComponent(match[index + 1] ?? '');
            });

            if (route.guard && !route.guard()) {
                const fallback = route.redirectTo ?? '/login';
                if (normalizePath(fallback) !== current) {
                    navigate(fallback, { replace: true });
                }
                setParams({});
                return { component: null, blocked: true } as const;
            }

            setParams(nextParams);
            return { component: route.component, blocked: false } as const;
        }

        setParams({});
        return { component: options?.notFound ?? null, blocked: false } as const;
    });

    const Router: FC = () => (
        <div class="router-view">
            {() => {
                const result = resolve();
                if (result.blocked || !result.component) return null;
                const Component = result.component;
                return <Component />;
            }}
        </div>
    );

    const Link: FC<Props & { to: string; class?: string; activeClass?: string }> = props => {
        const isActive = () => normalizePath(path()) === normalizePath(props.to);

        const handleClick = (event: Event) => {
            event.preventDefault();
            navigate(props.to);
        };

        if (props.activeClass) {
            return (
                <a
                    href={props.to}
                    class={props.class}
                    classList={{ [props.activeClass]: isActive }}
                    onClick={handleClick}
                >
                    {props.children}
                </a>
            );
        }

        return (
            <a href={props.to} class={props.class} onClick={handleClick}>
                {props.children}
            </a>
        );
    };

    const useRouter = (): RouterApi => ({ path, params, navigate });

    return { Router, Link, useRouter };
}
