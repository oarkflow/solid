import type { FC } from '@/core/velocity';
import { getRouterApi } from '@/app/router/navigation';

export const ProfilePage: FC = () => {
    const router = getRouterApi();
    return (
        <section class="card">
            <h2>Profile</h2>
            <p class="muted">Dynamic route with parameters.</p>
            <div><strong>Profile name:</strong> {() => router.params().name || 'unknown'}</div>
        </section>
    );
};
