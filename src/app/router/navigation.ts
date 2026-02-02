import type { RouterApi } from '@/velocity';

let routerApi: RouterApi | null = null;

export function registerRouterApi(api: RouterApi) {
    routerApi = api;
}

export function getRouterApi(): RouterApi {
    if (!routerApi) {
        throw new Error('Router API has not been registered yet.');
    }
    return routerApi;
}
