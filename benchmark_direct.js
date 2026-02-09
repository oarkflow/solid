// Direct benchmark without test runner
import { createSignal, createEffect, createMemo, createRoot, batch } from './src/core/velocity/reactivity.ts';

console.log('\n=== VELOCITY DIRECT BENCHMARKS ===\n');

function benchmark(name, fn, iterations = 10000) {
    // Warmup
    for (let i = 0; i < Math.min(100, iterations / 10); i++) fn();

    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const end = performance.now();

    const totalMs = end - start;
    const avgMs = totalMs / iterations;
    const opsPerSec = Math.round(1000 / avgMs);

    console.log(`${name}:`);
    console.log(`  Total: ${totalMs.toFixed(2)}ms for ${iterations} ops`);
    console.log(`  Avg: ${avgMs.toFixed(4)}ms/op`);
    console.log(`  Throughput: ${opsPerSec.toLocaleString()} ops/sec\n`);

    return { name, totalMs, avgMs, opsPerSec };
}

// 1. Signal Creation
console.log('--- Signal Creation ---');
benchmark('Create 10k signals', () => {
    createRoot(() => {
        for (let i = 0; i < 10000; i++) {
            createSignal(i);
        }
    });
}, 1);

// 2. Signal Read
console.log('--- Signal Read Performance ---');
createRoot(() => {
    const [count] = createSignal(42);
    benchmark('Signal read', () => count(), 100000);
});

// 3. Signal Write
console.log('--- Signal Write Performance ---');
createRoot(() => {
    const [count, setCount] = createSignal(0);
    benchmark('Signal write', () => setCount(x => x + 1), 50000);
});

// 4. Effect Propagation
console.log('--- Effect Propagation ---');
createRoot(() => {
    const [count, setCount] = createSignal(0);
    let runs = 0;
    createEffect(() => {
        count();
        runs++;
    });

    benchmark('Effect trigger', () => setCount(x => x + 1), 10000);
    console.log(`  (Effect ran ${runs} times)\n`);
});

// 5. Memo Performance
console.log('--- Memo Performance ---');
createRoot(() => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const sum = createMemo(() => a() + b());

    benchmark('Memo read (cached)', () => sum(), 100000);

    benchmark('Memo write + read', () => {
        setA(x => x + 1);
        sum();
    }, 10000);
});

// 6. Batch Updates
console.log('--- Batch Performance ---');
createRoot(() => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));
    let effectRuns = 0;

    createEffect(() => {
        for (const [get] of signals) get();
        effectRuns++;
    });

    // Without batch
    effectRuns = 0;
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
        for (const [, set] of signals) set(x => x + 1);
    }
    const time1 = performance.now() - start1;
    console.log(`Without batch (100 signals × 100 updates):`);
    console.log(`  Time: ${time1.toFixed(2)}ms`);
    console.log(`  Effect runs: ${effectRuns}\n`);

    // With batch
    effectRuns = 0;
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
        batch(() => {
            for (const [, set] of signals) set(x => x + 1);
        });
    }
    const time2 = performance.now() - start2;
    console.log(`With batch (100 signals × 100 updates):`);
    console.log(`  Time: ${time2.toFixed(2)}ms`);
    console.log(`  Effect runs: ${effectRuns}`);
    console.log(`  Speedup: ${(time1 / time2).toFixed(2)}x\n`);
});

// 7. Diamond Dependency
console.log('--- Diamond Dependency Pattern ---');
createRoot(() => {
    const [source, setSource] = createSignal(0);
    const left = createMemo(() => source() * 2);
    const right = createMemo(() => source() * 3);
    const combined = createMemo(() => left() + right());

    benchmark('Diamond update', () => {
        setSource(x => x + 1);
        combined();
    }, 10000);
});

// 8. Deep Chain
console.log('--- Deep Memo Chain (100 levels) ---');
createRoot(() => {
    const [root, setRoot] = createSignal(0);
    let current = root;

    for (let i = 0; i < 100; i++) {
        const prev = current;
        current = createMemo(() => prev() + 1);
    }

    const deep = current;

    benchmark('Deep chain update', () => {
        setRoot(x => x + 1);
        deep();
    }, 1000);
});

console.log('\n=== BENCHMARKS COMPLETE ===\n');
