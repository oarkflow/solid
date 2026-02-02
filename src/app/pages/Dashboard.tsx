import type { FC } from '@/core/velocity';
import { authStore, userName } from '@/app/stores/auth';
import { appStore } from '@/app/stores/app';

export const DashboardPage: FC = () => (
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
