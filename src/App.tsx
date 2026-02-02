import {
    createSignal,
    type FC,
    createMemo,
    createStore,
    createActions,
    createRouter,
    type Middleware,
} from './velocity';
import './index.css';

type AuthState = {
    user: { name: string; role: 'user' | 'admin' } | null;
    token: string;
    lastLogin: string | null;
};

type AppState = {
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

const authStore = createStore<AuthState>(
    {
        user: null,
        token: '',
        lastLogin: null,
    },
    { storageKey: 'solid-auth', version: 1 }
);

const appStore = createStore<AppState>(
    {
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
    },
    { storageKey: 'solid-app', version: 1 }
);

const authActions = createActions(authStore, ({ patch }) => ({
    login: (name: string) => {
        const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        patch({
            user: { name, role: 'user' },
            token,
            lastLogin: new Date().toISOString(),
        });
    },
    logout: () => {
        patch({ user: null, token: '', lastLogin: null });
    },
}));

const addActivity = (message: string) => {
    appStore.patch(prev => ({
        activity: [`${new Date().toLocaleTimeString()} • ${message}`, ...prev.activity].slice(0, 6),
    }));
};

const auditTrailMiddleware: Middleware = ({ to, from }) => {
    if (to.path === from.path) return;
    addActivity(`Route: ${from.path} → ${to.path}`);
};

const queryShieldMiddleware: Middleware = ({ query }) => {
    for (const [key, value] of query.entries()) {
        if (value.length > 256 || /[<>]/.test(value)) {
            addActivity(`Blocked unsafe query param: ${key}`);
            return '/';
        }
    }
};

const profileValidationMiddleware: Middleware = ({ params }) => {
    if (!params.name) return;
    if (!/^[a-z0-9-]+$/i.test(params.name)) {
        addActivity('Blocked invalid profile handle');
        return '/';
    }
};

const isAuthenticated = createMemo(() => Boolean(authStore.state().token));
const userName = authStore.select(state => state.user?.name ?? 'Guest');
const theme = appStore.select(state => state.preferences.theme);
const accent = appStore.select(state => state.preferences.accent);
const counter = appStore.select(state => state.counter);

const Home: FC = () => (
    <section class="card">
        <h2>Reactive Store</h2>
        <p class="muted">State is persisted and fully reactive.</p>

        <div class="row gap">
            <button class="button" onClick={() => {
                appStore.patch(prev => ({ counter: prev.counter + 1 }));
                addActivity('Counter incremented');
            }}>
                Increment ({counter})
            </button>
            <button class="button ghost" onClick={() => {
                appStore.patch(prev => ({ counter: Math.max(0, prev.counter - 1) }));
                addActivity('Counter decremented');
            }}>
                Decrement
            </button>
        </div>

        <div class="row gap">
            <button
                class="button ghost"
                onClick={() => {
                    appStore.update('preferences.theme', theme() === 'light' ? 'dark' : 'light');
                    addActivity('Theme toggled');
                }}
            >
                Toggle Theme ({theme})
            </button>
            <input
                class="color"
                type="color"
                value={accent}
                onChange={(event: any) => {
                    appStore.update('preferences.accent', event.target.value);
                    addActivity('Accent updated');
                }}
            />
        </div>
    </section>
);

const Login: FC = () => {
    const [name, setName] = createSignal('');
    const { navigate } = useRouter();

    return (
        <section class="card">
            <h2>Secure Login</h2>
            <p class="muted">Protected routes require a valid session.</p>

            <div class="row gap">
                <input
                    class="input"
                    type="text"
                    placeholder="Enter name"
                    value={name}
                    onInput={(event: any) => setName(event.target.value)}
                />
                <button
                    class="button"
                    onClick={() => {
                        if (!name().trim()) return;
                        authActions.login(name().trim());
                        addActivity('Signed in');
                        navigate('/dashboard');
                    }}
                >
                    Sign In
                </button>
            </div>
        </section>
    );
};

const Dashboard: FC = () => (
    <section class="card">
        <h2>Protected Dashboard</h2>
        <p class="muted">Only authenticated users can access this view.</p>
        <div class="list">
            <div><strong>User:</strong> {userName}</div>
            <div><strong>Last login:</strong> {() => authStore.state().lastLogin ?? '—'}</div>
            <div><strong>Secure mode:</strong> {() => appStore.state().flags.secureMode ? 'Enabled' : 'Disabled'}</div>
        </div>
    </section>
);

const Settings: FC = () => (
    <section class="card">
        <h2>Security Controls</h2>
        <p class="muted">Fine-grained flags stored in reactive state.</p>
        <div class="row gap">
            <button
                class="button ghost"
                onClick={() => {
                    appStore.update('flags.secureMode', (v: boolean) => !v);
                    addActivity('Secure mode toggled');
                }}
            >
                Secure Mode: {() => (appStore.state().flags.secureMode ? 'On' : 'Off')}
            </button>
            <button
                class="button ghost"
                onClick={() => {
                    appStore.update('flags.betaAccess', (v: boolean) => !v);
                    addActivity('Beta access toggled');
                }}
            >
                Beta Access: {() => (appStore.state().flags.betaAccess ? 'On' : 'Off')}
            </button>
        </div>
    </section>
);

const Profile: FC = () => {
    const { params } = useRouter();
    return (
        <section class="card">
            <h2>Profile</h2>
            <p class="muted">Dynamic route with parameters.</p>
            <div><strong>Profile name:</strong> {() => params().name || 'unknown'}</div>
        </section>
    );
};

const Activity: FC = () => (
    <section class="card">
        <h2>Recent Activity</h2>
        <div class="list">
            {() => appStore.state().activity.length
                ? appStore.state().activity.map(entry => <div class="muted">{entry}</div>)
                : <div class="muted">No activity yet.</div>
            }
        </div>
    </section>
);

const NotFound: FC = () => (
    <section class="card">
        <h2>Route not found</h2>
        <p class="muted">The requested page does not exist.</p>
    </section>
);

const routes = [
    {
        path: '/',
        component: Home,
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
        component: Login,
        meta: {
            title: 'Authenticate',
            description: 'Start a signed session to unlock dashboards and protected controls.',
            canonical: '/login',
            tags: [{ name: 'robots', content: 'noindex, nofollow' }],
        },
    },
    {
        path: '/dashboard',
        component: Dashboard,
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
        component: Settings,
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
        path: '/profile/:name',
        component: Profile,
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

const { Router, Link, useRouter } = createRouter(routes, {
    notFound: NotFound,
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
});

export const App: FC = () => (
    <div class="app" data-theme={theme} style={() => ({ '--accent': accent() } as any)}>
        <header class="topbar">
            <div class="brand">Secure Reactive Suite</div>
            <nav class="nav">
                <Link to="/" class="nav-link" activeClass="active">Home</Link>
                <Link to="/dashboard" class="nav-link" activeClass="active">Dashboard</Link>
                <Link to="/settings" class="nav-link" activeClass="active">Settings</Link>
                <Link to="/profile/ava" class="nav-link" activeClass="active">Profile</Link>
            </nav>
            <div class="session">
                <span class="pill">{userName}</span>
                <button
                    class="button small"
                    onClick={() => {
                        if (isAuthenticated()) {
                            authActions.logout();
                            addActivity('Signed out');
                        } else {
                            addActivity('Navigate to sign in');
                        }
                    }}
                >
                    {() => isAuthenticated() ? 'Sign Out' : 'Guest Mode'}
                </button>
            </div>
        </header>

        <main class="grid">
            <div class="stack">
                <Router />
            </div>
            <aside class="stack">
                <Activity />
                <section class="card">
                    <h2>Session Status</h2>
                    <div class="list">
                        <div><strong>Authenticated:</strong> {() => isAuthenticated() ? 'Yes' : 'No'}</div>
                        <div><strong>Token:</strong> {() => authStore.state().token ? authStore.state().token.slice(0, 8) + '…' : '—'}</div>
                    </div>
                </section>
            </aside>
        </main>
    </div>
);
