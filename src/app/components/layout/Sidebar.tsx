import type { FC } from '@/core/velocity';
import { ActivityFeed } from '@/app/components/widgets/ActivityFeed';
import { ThreatIntel } from '@/app/components/widgets/ThreatIntel';
import { JobRunner } from '@/app/components/widgets/JobRunner';
import { SessionStatus } from '@/app/components/widgets/SessionStatus';

export const Sidebar: FC = () => (
    <aside class="space-y-6">
        <ActivityFeed />
        <ThreatIntel />
        <JobRunner />
        <SessionStatus />
    </aside>
);
