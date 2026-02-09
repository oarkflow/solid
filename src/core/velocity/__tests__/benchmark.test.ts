
import { describe, it } from 'vitest';
import { createSignal, createEffect, batch, createRoot } from '../reactivity';
import { createElement } from '../jsx';

describe('Velocity Benchmark', () => {
    it('should run performance benchmarks', () => {
        function benchmark(name: string, fn: () => void, iterations: number = 1000) {
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                fn();
            }
            const end = performance.now();
            const duration = end - start;
            const ops = Math.round(iterations / (duration / 1000));
            console.log(`${name}: ${duration.toFixed(2)}ms (${ops.toLocaleString()} ops/sec)`);
        }

        createRoot(() => {
            console.log('Starting Velocity Benchmark...');

            // 1. Signal Creation
            benchmark('Create Signal', () => {
                createSignal(0);
            }, 100000);

            // 2. Signal Update
            const [count, setCount] = createSignal(0);
            benchmark('Update Signal', () => {
                setCount(c => c + 1);
            }, 100000);

            // 3. Effect Execution
            const [eCount, setECount] = createSignal(0);
            createEffect(() => eCount());
            benchmark('Effect Run', () => {
                setECount(c => c + 1);
            }, 100000);

            // 4. Batch Update
            const [b1, setB1] = createSignal(0);
            const [b2, setB2] = createSignal(0);
            createEffect(() => { b1(); b2(); });
            benchmark('Batch Update', () => {
                batch(() => {
                    setB1(c => c + 1);
                    setB2(c => c + 1);
                });
            }, 50000);

            // 5. DOM Creation (Virtual/JSDOM)
            if (typeof document !== 'undefined') {
                benchmark('Create 1000 Elements', () => {
                    const div = document.createElement('div');
                    for (let i = 0; i < 1000; i++) {
                        const sp = document.createElement('span');
                        sp.textContent = String(i);
                        div.appendChild(sp);
                    }
                }, 100);

                benchmark('Velocity JSX Create', () => {
                    createElement('div', { id: 'test' }, 'Content');
                }, 10000);
            }
        });
    });
});
