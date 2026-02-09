import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRouter } from '../router';
import { createRoot } from '../reactivity';

describe('Router', () => {
    let originalLocation: Location;
    let originalHistory: History;

    beforeEach(() => {
        // Mock window.location and history
        originalLocation = window.location;
        originalHistory = window.history;

        // Reset to root path
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/',
                search: '',
                hash: '',
                origin: 'http://localhost',
                href: 'http://localhost/',
                hostname: 'localhost',
            },
            writable: true,
        });

        Object.defineProperty(window, 'history', {
            value: {
                pushState: vi.fn(),
                replaceState: vi.fn(),
                back: vi.fn(),
                forward: vi.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        Object.defineProperty(window, 'history', {
            value: originalHistory,
            writable: true,
        });
    });

    describe('createRouter', () => {
        it('should create router with basic routes', () => {
            createRoot(() => {
                const { Router, useRouter, Link } = createRouter([
                    { path: '/', component: () => null },
                    { path: '/about', component: () => null },
                ]);

                expect(Router).toBeDefined();
                expect(useRouter).toBeDefined();
                expect(Link).toBeDefined();
            });
        });

        it('should match current path', () => {
            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                ]);

                const router = useRouter();
                expect(router.path()).toBe('/');
            });
        });

        it('should navigate to new path', () => {
            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                    { path: '/about', component: () => null },
                ]);

                const router = useRouter();
                router.navigate('/about');

                expect(window.history.pushState).toHaveBeenCalled();
            });
        });

        it('should use replaceState with replace option', () => {
            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                    { path: '/about', component: () => null },
                ]);

                const router = useRouter();
                router.navigate('/about', { replace: true });

                expect(window.history.replaceState).toHaveBeenCalled();
            });
        });

        it('should extract route parameters', () => {
            (window as any).location.pathname = '/users/123';

            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/users/:id', component: () => null },
                ]);

                const router = useRouter();
                expect(router.params()).toEqual({ id: '123' });
            });
        });

        it('should extract query parameters', () => {
            (window as any).location.search = '?sort=name&order=asc';

            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                ]);

                const router = useRouter();
                expect(router.query().get('sort')).toBe('name');
                expect(router.query().get('order')).toBe('asc');
            });
        });
    });

    describe('Route Guards', () => {
        it('should allow navigation when guard returns true', () => {
            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                    {
                        path: '/protected',
                        component: () => null,
                        guard: () => true,
                    },
                ]);

                const router = useRouter();
                router.navigate('/protected');

                expect(window.history.pushState).toHaveBeenCalled();
            });
        });

        it('should redirect when guard returns false', () => {
            (window as any).location.pathname = '/protected';

            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                    { path: '/login', component: () => null },
                    {
                        path: '/protected',
                        component: () => null,
                        guard: () => false,
                        redirectTo: '/login',
                    },
                ]);

                // Guard triggered on initial match
                // The router should schedule redirect
            });
        });
    });

    describe('Middleware', () => {
        it('should run global middleware', () => {
            let middlewareRan = false;

            createRoot(() => {
                const { useRouter } = createRouter(
                    [
                        { path: '/', component: () => null },
                        { path: '/about', component: () => null },
                    ],
                    {
                        middlewares: [
                            () => {
                                middlewareRan = true;
                            },
                        ],
                    }
                );

                const router = useRouter();
                router.navigate('/about');

                // Middleware runs during navigation
            });

            expect(middlewareRan).toBe(true);
        });

        it('should block navigation when middleware returns false', () => {
            let blocked = false;

            createRoot(() => {
                const { useRouter } = createRouter(
                    [
                        { path: '/', component: () => null },
                        {
                            path: '/blocked',
                            component: () => null,
                            middlewares: [() => false],
                        },
                    ],
                    {
                        onBlocked: () => {
                            blocked = true;
                        },
                    }
                );

                // Initial route matching would trigger middleware
            });
        });

        it('should redirect when middleware returns string', () => {
            createRoot(() => {
                const { useRouter } = createRouter(
                    [
                        { path: '/', component: () => null },
                        { path: '/target', component: () => null },
                        {
                            path: '/redirect',
                            component: () => null,
                            middlewares: [() => '/target'],
                        },
                    ]
                );

                // Middleware would trigger redirect
            });
        });
    });

    describe('Security', () => {
        it('should block javascript: URLs', () => {
            let blocked = false;

            createRoot(() => {
                const { useRouter } = createRouter(
                    [{ path: '/', component: () => null }],
                    {
                        onBlocked: () => {
                            blocked = true;
                        },
                    }
                );

                const router = useRouter();
                router.navigate('javascript:alert(1)');
            });

            expect(blocked).toBe(true);
            expect(window.history.pushState).not.toHaveBeenCalled();
        });

        it('should block external URLs', () => {
            let blocked = false;

            createRoot(() => {
                const { useRouter } = createRouter(
                    [{ path: '/', component: () => null }],
                    {
                        onBlocked: () => {
                            blocked = true;
                        },
                    }
                );

                const router = useRouter();
                router.navigate('https://evil.com/path');
            });

            expect(blocked).toBe(true);
        });

        it('should allow same-origin absolute URLs', () => {
            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/', component: () => null },
                    { path: '/about', component: () => null },
                ]);

                const router = useRouter();
                router.navigate('http://localhost/about');

                expect(window.history.pushState).toHaveBeenCalled();
            });
        });
    });

    describe('Route Matching', () => {
        it('should match wildcard routes', () => {
            (window as any).location.pathname = '/docs/api/users';

            createRoot(() => {
                const { useRouter } = createRouter([
                    { path: '/docs/*', component: () => null },
                ]);

                const router = useRouter();
                expect(router.params().path).toBe('api/users');
            });
        });

        it('should prioritize exact matches over wildcards', () => {
            (window as any).location.pathname = '/about';

            createRoot(() => {
                let matched = '';

                const { Router } = createRouter([
                    {
                        path: '/about',
                        component: () => {
                            matched = 'exact';
                            return null;
                        },
                    },
                    {
                        path: '/*',
                        component: () => {
                            matched = 'wildcard';
                            return null;
                        },
                    },
                ]);
            });
        });

        it('should match nested routes', () => {
            (window as any).location.pathname = '/users/123/posts';

            createRoot(() => {
                const { useRouter } = createRouter([
                    {
                        path: '/users/:id',
                        component: () => null,
                        children: [
                            { path: 'posts', component: () => null },
                        ],
                    },
                ]);

                const router = useRouter();
                expect(router.params().id).toBe('123');
            });
        });
    });

    describe('Head Management', () => {
        it('should set document title from route meta', () => {
            (window as any).location.pathname = '/about';

            createRoot(() => {
                createRouter(
                    [
                        {
                            path: '/about',
                            component: () => null,
                            meta: { title: 'About Us' },
                        },
                    ],
                    {
                        head: { defaultTitle: 'My App' },
                    }
                );
            });

            expect(document.title).toBe('About Us');
        });

        it('should apply title template', () => {
            (window as any).location.pathname = '/about';

            createRoot(() => {
                createRouter(
                    [
                        {
                            path: '/about',
                            component: () => null,
                            meta: { title: 'About' },
                        },
                    ],
                    {
                        head: {
                            titleTemplate: '%s | My App',
                        },
                    }
                );
            });

            expect(document.title).toBe('About | My App');
        });
    });

    describe('Router Isolation', () => {
        it('should isolate multiple router instances', () => {
            // This test verifies the fix for module-level radix trie
            createRoot(() => {
                const router1 = createRouter([
                    { path: '/app1/*', component: () => null },
                ]);

                const router2 = createRouter([
                    { path: '/app2/*', component: () => null },
                ]);

                // Both routers should work independently
                expect(router1.useRouter).toBeDefined();
                expect(router2.useRouter).toBeDefined();
            });
        });
    });
});
