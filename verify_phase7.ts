
import { createSignal, createEffect, createMemo, createRoot, batch } from './src/core/velocity/reactivity';

console.log('--- Velocity Phase 7 Verification ---');

createRoot((dispose) => {
    // 1. Verify Lazy Evaluation
    console.log('\n--- 1. Lazy Memo Evaluation ---');
    const [count, setCount] = createSignal(0);
    let memoRuns = 0;

    // Create a lazy memo
    const doubled = createMemo(() => {
        memoRuns++;
        return count() * 2;
    });

    console.log('Memo created (runs should be 1):', memoRuns);

    // Update dependency multiple times
    setCount(1);
    setCount(2);
    setCount(3);

    console.log('After 3 updates (runs should be 1):', memoRuns);

    // Read memo
    console.log('Memo value:', doubled());
    console.log('After read (runs should be 2):', memoRuns);

    if (memoRuns === 2) {
        console.log('✅ Lazy Evaluation PASSED');
    } else {
        console.log('❌ Lazy Evaluation FAILED');
    }

    // 2. Verify Link Pooling (Stress Test)
    console.log('\n--- 2. Link Pooling Stress Test ---');
    const startHeap = process.memoryUsage().heapUsed;

    const [trigger, setTrigger] = createSignal(0);

    // Create and destroy many effects to cycle links
    for (let i = 0; i < 1000; i++) {
        createRoot((d) => {
            createEffect(() => trigger());
            d(); // Dispose immediately to release links
        });
    }

    const endHeap = process.memoryUsage().heapUsed;
    const diff = (endHeap - startHeap) / 1024 / 1024;

    console.log(`Heap growth after 1000 effect cycles: ${diff.toFixed(2)} MB`);
    console.log('✅ Link Pooling executed without errors');

    dispose();
});

console.log('\nVerification Complete.');
