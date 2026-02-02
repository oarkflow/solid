import { createStore } from '@/core/velocity';

export type AppState = {
    counter: number;
    preferences: {
        theme: 'light' | 'dark';
        accent: string;
    };
    flags: {
        secureMode: boolean;
        betaAccess: boolean;
    };
    activity: string[];
};

const initialAppState: AppState = {
    counter: 0,
    preferences: {
        theme: 'light',
        accent: '#4f46e5',
    },
    flags: {
        secureMode: true,
        betaAccess: false,
    },
    activity: [],
};

export const appStore = createStore<AppState>(initialAppState, {
    storageKey: 'solid-app',
    version: 1,
});

export const counter = appStore.select(state => state.counter);
export const theme = appStore.select(state => state.preferences.theme);
export const accent = appStore.select(state => state.preferences.accent);
export const secureMode = appStore.select(state => state.flags.secureMode);
export const betaAccess = appStore.select(state => state.flags.betaAccess);

export const addActivity = (message: string) => {
    appStore.patch(prev => ({
        activity: [`${new Date().toLocaleTimeString()} • ${message}`, ...prev.activity].slice(0, 6),
    }));
};
