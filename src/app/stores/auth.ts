import { createMemo, createStore, createActions } from '@/core/velocity';

export type AuthState = {
    user: { name: string; role: 'user' | 'admin' } | null;
    token: string;
    lastLogin: string | null;
};

const initialAuthState: AuthState = {
    user: null,
    token: '',
    lastLogin: null,
};

const generateToken = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
};

export const authStore = createStore<AuthState>(initialAuthState, {
    storageKey: 'solid-auth',
    version: 1,
});

export const authActions = createActions(authStore, ({ patch }) => ({
    login: (name: string) => {
        patch({
            user: { name, role: 'user' },
            token: generateToken(),
            lastLogin: new Date().toISOString(),
        });
    },
    logout: () => {
        patch({ user: null, token: '', lastLogin: null });
    },
}));

export const isAuthenticated = createMemo(() => Boolean(authStore.state().token));
export const userName = authStore.select(state => state.user?.name ?? 'Guest');
export const lastLogin = authStore.select(state => state.lastLogin);
