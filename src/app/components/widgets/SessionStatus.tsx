import type { FC } from '@/velocity';
import { authStore, isAuthenticated } from '@/app/stores/auth';

export const SessionStatus: FC = () => (
    <section class="card">
        <h2>Session Status</h2>
        <div class="list">
            <div><strong>Authenticated:</strong> {() => isAuthenticated() ? 'Yes' : 'No'}</div>
            <div><strong>Token:</strong> {() => authStore.state().token ? authStore.state().token.slice(0, 8) + '…' : '—'}</div>
        </div>
    </section>
);
