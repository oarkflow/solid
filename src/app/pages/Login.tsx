import { createSignal, type FC, startTransition } from '@/core/velocity';
import { authActions } from '@/app/stores/auth';
import { addActivity } from '@/app/stores/app';
import { getRouterApi } from '@/app/router/navigation';

export const LoginPage: FC = () => {
    const [name, setName] = createSignal('');
    const router = getRouterApi();

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
                        startTransition(() => router.navigate('/dashboard'));
                    }}
                >
                    Sign In
                </button>
            </div>

            {/* Visual test area for colors, rings, shadows, gradients, and filters */}
            <div class="mt-6 space-y-4">
                <div class="flex gap-2">
                    <button class="bg-blue-600 text-white px-3 py-1 rounded shadow-md hover:bg-blue-700">Blue</button>
                    <button class="bg-green-500 text-white px-3 py-1 rounded shadow-md">Green</button>
                    <button class="bg-red-500 text-white px-3 py-1 rounded shadow-md">Red</button>
                </div>

                <div class="p-4 rounded ring-2 ring-offset-2 ring-blue-500">Ring example (ring-2 ring-blue-500)</div>

                <div class="w-full h-24 rounded overflow-hidden bg-gradient-to-r from-blue-500 via-green-200 to-red-500 flex items-center justify-center text-white font-medium">Gradient (from/via/to bg-gradient-to-r)</div>

                <div class="p-4 rounded filter blur-2 drop-shadow-md">Filter examples (blur-2 drop-shadow-md)</div>
            </div>
        </section>
    );
};
