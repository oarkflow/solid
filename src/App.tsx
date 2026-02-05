import type { FC } from '@/core/velocity';
import { createRouter, lazy, useRouter } from '@/core/velocity';

const NotFoundPage = lazy(() => import('@/app/pages/NotFound').then(m => ({ default: m.NotFoundPage })));

import { Loading } from '@/app/components/layout/Loading';

import { theme, addActivity } from '@/app/stores/app';

import { registerRouterApi } from '@/app/router/navigation';
import AgentPage from '@/app/ai-agent';
const routes = [
    {
        path: '/',
        component: AgentPage,
        meta: {
            title: 'AI Agent',
            description: 'Interact with the Local AI Agent.',
            canonical: '/',
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
import { auditTrailMiddleware, queryShieldMiddleware } from './app/router/middlewares';

export const App: FC = () => {
    // Apply theme to html element reactively
    createEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.className = theme();
        }
    });

    return (
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main class="max-w-7xl mx-auto px-6 py-8">
                <Router fallback={<Loading />} />
            </main>
            <ToastContainer position="top-right" />
        </div>
    );
};
