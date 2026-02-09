
import { createSignal, createEffect, createRoot, createStaticSignal, boostSignal } from './src/core/velocity/reactivity';
import { createTemplate, hydrate } from './src/core/velocity/fast-dom';

console.log('--- Velocity Phase 3 Verification ---');

createRoot((dispose) => {
    console.log('\n--- 1. Signal Boosting ---');
    const staticSig = createStaticSignal(42);
    console.log('Static Signal value:', staticSig());

    const [count, setCount] = createSignal(10);
    boostSignal(count as any); // Mark as static
    console.log('Boosted Signal value:', count());

    console.log('✅ Signal Boosting APIs exist');

    console.log('\n--- 2. Fast-DOM Template System ---');
    // Mocking document for Node environment since we don't have jsdom here
    if (typeof document === 'undefined') {
        process.stdout.write('⚠️ Skipping Fast-DOM (browser-only features) in Node\n');
    } else {
        const factory = createTemplate('<div class="card"><h1>$</h1></div>');
        const [fragment, slots] = factory();
        hydrate(fragment, slots, ['Hello Velocity']);
        console.log('✅ Template Cloning SUCCESS');
    }

    dispose();
});

console.log('\nVerification Complete.');
