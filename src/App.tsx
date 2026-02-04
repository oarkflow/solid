import type { FC } from '@/core/velocity';
import { createRouter, lazy, useRouter } from '@/core/velocity';

const HomePage = lazy(() => import('@/app/pages/Home').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/app/pages/Login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/app/pages/Register').then(m => ({ default: m.RegisterPage })));
const FormTestPage = lazy(() => import('@/app/pages/FormTest').then(m => ({ default: m.FormTestPage })));
const DashboardPage = lazy(() => import('@/app/pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import('@/app/pages/Settings').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('@/app/pages/Profile').then(m => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import('@/app/pages/Analytics').then(m => ({ default: m.AnalyticsPage })));
const NotFoundPage = lazy(() => import('@/app/pages/NotFound').then(m => ({ default: m.NotFoundPage })));

import { Header } from '@/app/components/layout/Header';
import { Sidebar } from '@/app/components/layout/Sidebar';
import { Loading } from '@/app/components/layout/Loading';

import { isAuthenticated } from '@/app/stores/auth';
import { theme, addActivity } from '@/app/stores/app';

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
        path: '/register',
        component: RegisterPage,
        meta: {
            title: 'Register',
            description: 'Create a new account with comprehensive form validation examples.',
            canonical: '/register',
            tags: [{ name: 'robots', content: 'noindex, nofollow' }],
        },
    },
    {
        path: '/form-demo',
        component: DemoForm,
        meta: {
            title: 'Form Demo',
            description: 'Minimal form testing page.',
            canonical: '/form-demo',
        },
    },
    {
        path: '/form-test',
        component: FormTestPage,
        meta: {
            title: 'Form Test',
            description: 'Minimal form testing page.',
            canonical: '/form-test',
        },
    },
    {
        path: '/icons',
        component: IconExample,
        meta: {
            title: 'Icons',
            description: 'Showcase of all icons.',
            canonical: '/icons',
        },
    },
    {
        path: '/components',
        component: ComponentShowcase,
        meta: {
            title: 'Components',
            description: 'Showcase of all components.',
            canonical: '/components',
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

const { Router } = createRouter(routes, routerOptions);
registerRouterApi(useRouter());

import { createEffect } from '@/core/velocity';
import { DemoForm } from './app/pages/DemoForm';
import { ComponentShowcase } from './app/pages/ComponentShowcase';
import { ToastContainer } from '@/core/ui';
import IconExample from './app/pages/example';

export const App: FC = () => {
    // Apply theme to html element reactively
    createEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.className = theme();
        }
    });

    return (
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main class="max-w-7xl mx-auto px-6 py-8">
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div class="lg:col-span-3">
                        <Router fallback={<Loading />} />
                    </div>
                    <div class="lg:col-span-1">
                        <Sidebar />
                    </div>
                </div>
            </main>
            <ToastContainer position="top-right" />
        </div>
    );
};
