import { createSignal, createSuspense, createResource, type FC } from '@/velocity';
import { addActivity } from '@/app/stores/app';

type ThreatIntel = {
    id: string;
    entry: string;
    severity: 'low' | 'medium' | 'high';
};

const threatPool = [
    'Credential stuffing prevented via velocity guardrail',
    'Anomalous MFA attempt sandboxed',
    'New device enrollment flagged for review',
    'Privileged token rotated after expiry drift',
    'Edge firewall absorbed volumetric probe',
    'API key recycling policy enforced',
    'Idle admin session revoked',
] as const;

const severityLevels: ThreatIntel['severity'][] = ['low', 'medium', 'high'];
const severityLabels: Record<ThreatIntel['severity'], string> = {
    low: 'Normal',
    medium: 'Elevated',
    high: 'Critical',
};

const buildIntelFeed = (seed: number): ThreatIntel[] => {
    const offset = Math.abs(seed) % threatPool.length;
    return Array.from({ length: 3 }, (_, idx) => {
        const entry = threatPool[(offset + idx) % threatPool.length];
        const severity = severityLevels[(entry.length + seed + idx) % severityLevels.length];
        return {
            id: `${seed}-${idx}-${entry.length}`,
            entry,
            severity,
        };
    });
};

export const ThreatIntel: FC = () => {
    const [refreshIndex, setRefreshIndex] = createSignal(0);
    const [suspenseState] = createSuspense({ timeout: 200 });
    const [intel] = createResource(refreshIndex, async (seed) => {
        await new Promise(resolve => setTimeout(resolve, 450));
        const normalizedSeed = typeof seed === 'number' ? seed : 0;
        addActivity('Threat intel synced');
        return buildIntelFeed(normalizedSeed + 1);
    }, { initialValue: buildIntelFeed(0) });

    const pending = () => suspenseState().pending || intel().loading;
    const entries = () => intel().data ?? [];

    return (
        <section class="card">
            <div class="row gap">
                <h2>Threat Intel</h2>
                <button
                    class="button small"
                    disabled={pending}
                    onClick={() => setRefreshIndex(v => v + 1)}
                >
                    {() => pending() ? 'Syncing…' : 'Refresh'}
                </button>
            </div>
            <div class="list">
                {() => pending()
                    ? <div class="muted">Syncing intelligence feed…</div>
                    : entries().map(item => (
                        <div class="muted row gap" data-level={item.severity}>
                            <span class="pill" data-variant={item.severity}>{severityLabels[item.severity]}</span>
                            <span>{item.entry}</span>
                        </div>
                    ))
                }
            </div>
        </section>
    );
};
