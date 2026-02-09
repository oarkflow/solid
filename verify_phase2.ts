
import { createSignal, createEffect, createMemo, createRoot, batch } from './src/core/velocity/reactivity';

console.log('--- Velocity Phase 2 Verification ---');

createRoot((dispose) => {
    const [count, setCount] = createSignal(0, { name: 'count' });
    const doubled = createMemo(() => count() * 2);

    let effectRuns = 0;
    createEffect(() => {
        console.log(`Effect run ${++effectRuns}: count = ${count()}, doubled = ${doubled()}`);
    });

    console.log('Setting count to 1...');
    setCount(1);

    console.log('Setting count to 2 via batch...');
    batch(() => {
        setCount(2);
        console.log('Inside batch, count is still:', count());
    });

    console.log('Final check:');
    if (count() === 2 && doubled() === 4 && effectRuns === 3) {
        console.log('✅ Basic Reactivity PASSED');
    } else {
        console.log('❌ Basic Reactivity FAILED');
        console.log(`Expectations: count=2, doubled=4, effectRuns=3`);
        console.log(`Actual: count=${count()}, doubled=${doubled()}, effectRuns=${effectRuns}`);
    }

    dispose();
    console.log('After dispose, setting count to 3...');
    setCount(3);
    if (effectRuns === 3) {
        console.log('✅ Cleanup PASSED');
    } else {
        console.log('❌ Cleanup FAILED (Effect ran after dispose)');
    }
});
