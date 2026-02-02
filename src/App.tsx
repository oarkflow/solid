import type { FC } from '@/velocity';
import { createRouter, lazy } from '@/velocity';
import './index.css';

const HomePage = lazy(() => import('@/app/pages/Home').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/app/pages/Login').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/app/pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import('@/app/pages/Settings').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('@/app/pages/Profile').then(m => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import('@/app/pages/Analytics').then(m => ({ default: m.AnalyticsPage })));
const NotFoundPage = lazy(() => import('@/app/pages/NotFound').then(m => ({ default: m.NotFoundPage })));

import { Header } from '@/app/components/layout/Header';
import { Sidebar } from '@/app/components/layout/Sidebar';
import { Loading } from '@/app/components/layout/Loading';

import { isAuthenticated } from '@/app/stores/auth';
import { theme, accent, addActivity } from '@/app/stores/app';

import { registerRouterApi } from '@/app/router/navigation';
import { auditTrailMiddleware, queryShieldMiddleware, profileValidationMiddleware } from '@/app/router/middlewares';

const routes = [
    {
        path: '/',
        component: HomePage,
        meta: {
            title: 'Home',
            description: 'Secure Reactive Suite showcases persistent stores, guards, and zero-copy updates.',
            canonical: '/',
            tags: [
                { property: 'og:title', content: 'Secure Reactive Suite' },
                { property: 'og:type', content: 'website' },
            ],
        },
    },
    {
        path: '/login',
        component: LoginPage,
        meta: {
            title: 'Authenticate',
            description: 'Start a signed session to unlock dashboards and protected controls.',
            canonical: '/login',
            tags: [{ name: 'robots', content: 'noindex, nofollow' }],
        },
    },
    {
        path: '/dashboard',
        component: DashboardPage,
        guard: () => isAuthenticated(),
        redirectTo: '/login',
        meta: {
            title: 'Dashboard',
            description: 'Encrypted overview of user posture, secure-mode flags, and last login insights.',
            canonical: '/dashboard',
            tags: [{ property: 'og:title', content: 'Secure Dashboard' }],
        },
    },
    {
        path: '/settings',
        component: SettingsPage,
        guard: () => isAuthenticated(),
        redirectTo: '/login',
        meta: {
            title: 'Security Settings',
            description: 'Toggle fine-grained security and beta-access flags backed by a reactive store.',
            canonical: '/settings',
            tags: [{ property: 'og:title', content: 'Security Controls' }],
        },
    },
    {
        path: '/analytics',
        component: AnalyticsPage,
        guard: () => isAuthenticated(),
        redirectTo: '/login',
        meta: {
            title: 'Analytics Dashboard',
            description: 'Heavy analytics dashboard with lazy-loaded components and code splitting.',
            canonical: '/analytics',
            tags: [{ property: 'og:title', content: 'Analytics' }],
        },
    },
    {
        path: '/profile/:name',
        component: ProfilePage,
        guard: () => isAuthenticated(),
        redirectTo: '/login',
        middlewares: [profileValidationMiddleware],
        meta: ({ params }: { params: Record<string, string> }) => {
            const safeName = params.name ?? 'profile';
            const encodedName = encodeURIComponent(safeName);
            return {
                title: `${safeName} Profile`,
                description: `Security dossier for ${safeName} with live status signals.`,
                canonical: `/profile/${encodedName}`,
                tags: [
                    { property: 'og:title', content: `${safeName} – Secure Reactive Suite` },
                    { name: 'robots', content: 'noindex, noarchive' },
                ],
            };
        },
    },
];

const routerOptions = {
    notFound: NotFoundPage,
    notFoundMeta: {
        title: 'Route Missing',
        description: 'The requested view could not be found inside the Secure Reactive Suite.',
        canonical: '/404',
        tags: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
    middlewares: [auditTrailMiddleware, queryShieldMiddleware],
    head: {
        defaultTitle: 'Secure Reactive Suite',
        titleTemplate: '%s • Secure Reactive Suite',
        persistentTags: [
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { name: 'theme-color', content: '#4f46e5' },
        ],
    },
    onBlocked: () => addActivity('Blocked unsafe navigation'),
};

const { Router, Link, useRouter } = createRouter(routes, routerOptions);
registerRouterApi(useRouter());

export const App: FC = () => (
    <div class="app" data-theme={theme} style={() => ({ '--accent': accent() } as any)}>
        <Header Link={Link} />
        <main class="grid">
            <div class="stack">
                <Router fallback={<Loading />} />
            </div>
            <Sidebar />
        </main>
    </div>
);
