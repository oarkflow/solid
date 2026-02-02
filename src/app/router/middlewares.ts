import type { Middleware } from '@/velocity';
import { addActivity } from '@/app/stores/app';

export const auditTrailMiddleware: Middleware = ({ to, from }) => {
    if (to.path === from.path) return;
    addActivity(`Route: ${from.path} → ${to.path}`);
};

export const queryShieldMiddleware: Middleware = ({ query }) => {
    for (const [key, value] of query.entries()) {
        if (value.length > 256 || /[<>]/.test(value)) {
            addActivity(`Blocked unsafe query param: ${key}`);
            return '/';
        }
    }
};

export const profileValidationMiddleware: Middleware = ({ params }) => {
    if (!params.name) return;
    if (!/^[a-z0-9-]+$/i.test(params.name)) {
        addActivity('Blocked invalid profile handle');
        return '/';
    }
};
