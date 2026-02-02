import type { FC } from '@/velocity';
import { createSignal, createMemo } from '@/velocity';
import { addActivity } from '@/app/stores/app';

// Simulated large component with heavy computation
const generateLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        category: ['Alpha', 'Beta', 'Gamma', 'Delta'][i % 4],
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }));
};

export const AnalyticsPage: FC = () => {
    const [filterCategory, setFilterCategory] = createSignal<string | null>(null);
    const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');

    const dataset = createMemo(() => generateLargeDataset(100));

    const filtered = createMemo(() => {
        const data = dataset();
        const category = filterCategory();
        return category ? data.filter(item => item.category === category) : data;
    });

    const sorted = createMemo(() => {
        const data = [...filtered()];
        return data.sort((a, b) =>
            sortOrder() === 'asc' ? a.value - b.value : b.value - a.value
        );
    });

    const stats = createMemo(() => {
        const data = filtered();
        return {
            total: data.length,
            sum: data.reduce((acc, item) => acc + item.value, 0),
            avg: data.length > 0 ? data.reduce((acc, item) => acc + item.value, 0) / data.length : 0,
            max: data.length > 0 ? Math.max(...data.map(item => item.value)) : 0,
            min: data.length > 0 ? Math.min(...data.map(item => item.value)) : 0,
        };
    });

    return (
        <section class="card">
            <h2>Analytics Dashboard</h2>
            <p class="muted">Lazy-loaded heavy component demonstrating code splitting.</p>

            <div class="row gap">
                <button
                    class="button small"
                    onClick={() => {
                        setFilterCategory(null);
                        addActivity('Analytics: Cleared filter');
                    }}
                >
                    All
                </button>
                {['Alpha', 'Beta', 'Gamma', 'Delta'].map(cat => (
                    <button
                        class="button ghost small"
                        onClick={() => {
                            setFilterCategory(cat);
                            addActivity(`Analytics: Filtered to ${cat}`);
                        }}
                    >
                        {cat}
                    </button>
                ))}
                <button
                    class="button ghost small"
                    onClick={() => {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        addActivity('Analytics: Toggled sort order');
                    }}
                >
                    Sort: {sortOrder}
                </button>
            </div>

            <div class="list">
                <div><strong>Stats:</strong></div>
                <div class="muted">Total: {() => stats().total} items</div>
                <div class="muted">Sum: {() => stats().sum.toFixed(2)}</div>
                <div class="muted">Average: {() => stats().avg.toFixed(2)}</div>
                <div class="muted">Range: {() => stats().min.toFixed(2)} - {() => stats().max.toFixed(2)}</div>
            </div>

            <div class="list" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {() => sorted().slice(0, 20).map(item => (
                    <div class="muted row gap" style={{ justifyContent: 'space-between' }}>
                        <span>{item.name} ({item.category})</span>
                        <span>{item.value.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};
