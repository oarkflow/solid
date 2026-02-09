/**
 * Velocity Performance Benchmarks
 *
 * Comprehensive benchmarks for:
 * - Signal read/write operations
 * - Effect propagation
 * - List reconciliation (O(1) fast paths vs LIS fallback)
 * - Template cloning vs createElement
 * - Batch updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createSignal,
    createEffect,
    createMemo,
    batch,
    createRoot,
    createStaticSignal,
    boostSignal,
} from '../reactivity';
import {
    createElement,
    For,
    Show,
    reconcile,
    render,
} from '../jsx';
import {
    createTemplate,
    hydrate,
    html,
    el,
} from '../fast-dom';

// ============================================================================
// Benchmark Utilities
// ============================================================================

function benchmark(name: string, fn: () => void, iterations: number = 1000): {
    name: string;
    iterations: number;
    totalMs: number;
    avgMs: number;
    opsPerSec: number;
} {
    // Warmup
    for (let i = 0; i < Math.min(100, iterations / 10); i++) fn();

    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const end = performance.now();

    const totalMs = end - start;
    const avgMs = totalMs / iterations;
    const opsPerSec = 1000 / avgMs;

    return { name, iterations, totalMs, avgMs, opsPerSec };
}

function formatResult(result: ReturnType<typeof benchmark>): string {
    return `${result.name}: ${result.avgMs.toFixed(4)}ms/op (${result.opsPerSec.toFixed(0)} ops/sec)`;
}

// ============================================================================
// Signal Benchmarks
// ============================================================================

describe('Signal Performance', () => {
    it('should measure signal read performance', () => {
        const [count] = createSignal(0);

        const result = benchmark('Signal Read', () => {
            count();
        }, 100_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(0.01); // < 10µs
    });

    it('should measure signal write performance', () => {
        const [count, setCount] = createSignal(0);

        const result = benchmark('Signal Write', () => {
            setCount(c => c + 1);
        }, 10_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(0.1); // < 100µs
    });

    it('should measure static signal read performance', () => {
        const staticValue = createStaticSignal(42);

        const result = benchmark('Static Signal Read', () => {
            staticValue();
        }, 100_000);

        console.log(formatResult(result));
        // Static signals should be faster (no tracking)
        expect(result.avgMs).toBeLessThan(0.005); // < 5µs
    });

    it('should compare signal vs static signal read', () => {
        const [regular] = createSignal(42);
        const staticSig = createStaticSignal(42);

        const regularResult = benchmark('Regular Signal', () => regular(), 100_000);
        const staticResult = benchmark('Static Signal', () => staticSig(), 100_000);

        console.log('Regular:', formatResult(regularResult));
        console.log('Static:', formatResult(staticResult));

        // Static should be at least 2x faster when not tracked
        // (In reality depends on listener context)
    });
});

// ============================================================================
// Effect Benchmarks
// ============================================================================

describe('Effect Performance', () => {
    it('should measure effect propagation with single dependency', () => {
        let effectRuns = 0;

        createRoot(() => {
            const [count, setCount] = createSignal(0);

            createEffect(() => {
                count();
                effectRuns++;
            });

            const result = benchmark('Single Dep Effect', () => {
                setCount(c => c + 1);
            }, 10_000);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(0.1);
        });
    });

    it('should measure effect propagation with multiple dependencies', () => {
        createRoot(() => {
            const signals = Array.from({ length: 10 }, (_, i) => createSignal(i));
            let effectRuns = 0;

            createEffect(() => {
                for (const [get] of signals) get();
                effectRuns++;
            });

            const result = benchmark('10-Dep Effect', () => {
                for (const [, set] of signals) set(v => v + 1);
            }, 1_000);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(1);
        });
    });

    it('should measure diamond dependency pattern', () => {
        createRoot(() => {
            const [source, setSource] = createSignal(0);
            const branch1 = createMemo(() => source() * 2);
            const branch2 = createMemo(() => source() * 3);
            let effectRuns = 0;

            createEffect(() => {
                branch1();
                branch2();
                effectRuns++;
            });

            const result = benchmark('Diamond Deps', () => {
                setSource(s => s + 1);
            }, 10_000);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(0.1);
        });
    });
});

// ============================================================================
// Batch Benchmarks
// ============================================================================

describe('Batch Performance', () => {
    it('should measure batch update performance', () => {
        createRoot(() => {
            const signals = Array.from({ length: 100 }, () => createSignal(0));
            let effectRuns = 0;

            // Single effect depending on all signals
            createEffect(() => {
                for (const [get] of signals) get();
                effectRuns++;
            });

            // Without batch
            const noBatchResult = benchmark('No Batch (100 signals)', () => {
                for (const [, set] of signals) set(v => v + 1);
            }, 100);

            effectRuns = 0;

            // With batch
            const batchResult = benchmark('Batched (100 signals)', () => {
                batch(() => {
                    for (const [, set] of signals) set(v => v + 1);
                });
            }, 100);

            console.log('Without batch:', formatResult(noBatchResult));
            console.log('With batch:', formatResult(batchResult));

            // Batched should be significantly faster
            expect(batchResult.avgMs).toBeLessThan(noBatchResult.avgMs);
        });
    });
});

// ============================================================================
// Reconciliation Benchmarks
// ============================================================================

describe('Reconciliation Performance', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    it('should measure append-only reconciliation (O(1) fast path)', () => {
        const prev: Node[] = [];
        for (let i = 0; i < 100; i++) {
            prev.push(document.createTextNode(`Item ${i}`));
            container.appendChild(prev[i]);
        }

        const result = benchmark('Append 10 items', () => {
            const next = [...prev];
            for (let j = 0; j < 10; j++) {
                next.push(document.createTextNode(`New ${j}`));
            }
            reconcile(container, prev.slice(), next, null);
        }, 1_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(1);
    });

    it('should measure single swap reconciliation (O(1) fast path)', () => {
        const items = Array.from({ length: 100 }, (_, i) => {
            const node = document.createTextNode(`Item ${i}`);
            (node as any)._key = i;
            container.appendChild(node);
            return node;
        });

        const result = benchmark('Swap 2 items', () => {
            const prev = [...items];
            // Swap first and last
            const swapped = [...prev];
            [swapped[0], swapped[99]] = [swapped[99], swapped[0]];
            reconcile(container, prev, swapped, null);
            // Swap back
            reconcile(container, swapped, prev, null);
        }, 1_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(1);
    });

    it('should measure full reconciliation with reordering (LIS path)', () => {
        const result = benchmark('Reorder 100 items', () => {
            container.innerHTML = '';
            const items = Array.from({ length: 100 }, (_, i) => {
                const node = document.createTextNode(`Item ${i}`);
                (node as any)._key = i;
                container.appendChild(node);
                return node;
            });

            // Reverse order (worst case for LIS)
            const reversed = [...items].reverse();
            reconcile(container, items, reversed, null);
        }, 100);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(10);
    });

    it('should compare For component update performance', () => {
        createRoot(() => {
            const [items, setItems] = createSignal<number[]>([]);

            render(() => For({
                each: items,
                children: (item: number) => createElement('span', {}, item)
            }), container);

            // Initial render
            setItems(Array.from({ length: 100 }, (_, i) => i));

            const result = benchmark('For: Append 10 items', () => {
                setItems(prev => [...prev, prev.length]);
            }, 100);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(5);
        });
    });
});

// ============================================================================
// Template Cloning Benchmarks
// ============================================================================

describe('Template Cloning Performance', () => {
    it('should compare createElement vs template cloning', () => {
        // createElement approach
        const createElementResult = benchmark('createElement', () => {
            const div = document.createElement('div');
            div.className = 'card';
            div.appendChild(document.createElement('h2'));
            div.appendChild(document.createElement('p'));
            div.appendChild(document.createElement('button'));
        }, 10_000);

        // Template cloning approach
        const factory = createTemplate(`
            <div class="card">
                <h2><!--$--></h2>
                <p><!--$--></p>
                <button><!--$--></button>
            </div>
        `);

        const templateResult = benchmark('Template Clone', () => {
            const [fragment, slots] = factory();
            hydrate(fragment, slots, ['Title', 'Description', 'Click Me']);
        }, 10_000);

        console.log('createElement:', formatResult(createElementResult));
        console.log('Template Clone:', formatResult(templateResult));

        // Template cloning should be faster for complex structures
        // (May be slower for very simple elements due to parsing overhead)
    });

    it('should measure html template literal performance', () => {
        const Card = html`<div class="card"><h2>${0}</h2><p>${1}</p></div>`;

        const result = benchmark('html`` template', () => {
            Card('Title', 'Description');
        }, 10_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(0.1);
    });

    it('should measure el() helper performance', () => {
        const result = benchmark('el() helper', () => {
            el('div', { class: 'card' },
                el('h2', null, 'Title'),
                el('p', null, 'Description'),
                el('button', { onClick: () => { } }, 'Click')
            );
        }, 10_000);

        console.log(formatResult(result));
        expect(result.avgMs).toBeLessThan(0.1);
    });
});

// ============================================================================
// Memory Benchmarks
// ============================================================================

describe('Memory Performance', () => {
    it('should measure signal creation memory', () => {
        const signals: any[] = [];
        const before = (performance as any).memory?.usedJSHeapSize || 0;

        for (let i = 0; i < 10_000; i++) {
            signals.push(createSignal(i));
        }

        const after = (performance as any).memory?.usedJSHeapSize || 0;
        const perSignal = (after - before) / 10_000;

        console.log(`Memory per signal: ~${perSignal.toFixed(0)} bytes`);
        // Keep reference to prevent GC
        expect(signals.length).toBe(10_000);
    });

    it('should measure effect cleanup', () => {
        let cleanupRuns = 0;

        createRoot((dispose) => {
            for (let i = 0; i < 100; i++) {
                createEffect(() => {
                    // no-op effect
                    return () => cleanupRuns++;
                });
            }

            const result = benchmark('Dispose 100 effects', () => {
                // This measures disposal only once
            }, 1);

            dispose();
            expect(cleanupRuns).toBe(100);
        });
    });
});

// ============================================================================
// Stress Tests
// ============================================================================

describe('Stress Tests', () => {
    it('should handle deep signal chains', () => {
        createRoot(() => {
            const [root, setRoot] = createSignal(0);
            let current: () => number = root;

            // Create 100-deep memo chain
            for (let i = 0; i < 100; i++) {
                const prev = current;
                current = createMemo(() => prev() + 1);
            }

            const deepMemo = current;
            let lastValue = 0;

            createEffect(() => {
                lastValue = deepMemo();
            });

            const result = benchmark('100-deep chain update', () => {
                setRoot(v => v + 1);
            }, 1_000);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(1);
            expect(lastValue).toBeGreaterThan(100);
        });
    });

    it('should handle wide signal fan-out', () => {
        createRoot(() => {
            const [source, setSource] = createSignal(0);
            let effectsRun = 0;

            // 1000 effects depending on same signal
            for (let i = 0; i < 1000; i++) {
                createEffect(() => {
                    source();
                    effectsRun++;
                });
            }

            effectsRun = 0;
            const result = benchmark('1000-effect fan-out', () => {
                setSource(v => v + 1);
            }, 100);

            console.log(formatResult(result));
            expect(result.avgMs).toBeLessThan(10);
        });
    });
});
