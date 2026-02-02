import type { FC } from '@/velocity';
import { appStore } from '@/app/stores/app';

export const ActivityFeed: FC = () => (
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
