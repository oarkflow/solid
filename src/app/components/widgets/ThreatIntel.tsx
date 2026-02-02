import { createSignal, createSuspense, createResource, type FC } from '@/core/velocity';
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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Threat Intel</h3>
                <button
                    class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    disabled={pending}
                    onClick={() => setRefreshIndex(v => v + 1)}
                >
                    {() => pending() ? 'Syncing…' : 'Refresh'}
                </button>
            </div>
            <div class="space-y-2">
                {() => pending()
                    ? <div class="text-sm text-gray-500 dark:text-gray-400 italic">Syncing intelligence feed…</div>
                    : entries().map(item => (
                        <div class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                                {severityLabels[item.severity]}
                            </span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">{item.entry}</span>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};
