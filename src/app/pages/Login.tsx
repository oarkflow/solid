import { createSignal, type FC, startTransition } from '@/velocity';
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
        </section>
    );
};
