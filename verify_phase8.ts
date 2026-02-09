
import * as fs from 'fs';
import { createStore, produce, unwrap } from './src/core/velocity/store';
import { createEffect, createRoot } from './src/core/velocity/reactivity';

let logOutput = '--- Velocity Phase 8 Verification: Deep Reactivity ---\n';

function log(...args: any[]) {
    const msg = args.map(a => String(a)).join(' ');
    console.log(msg); // Keep console for potential visibility
    logOutput += msg + '\n';
}

createRoot((dispose) => {
    try {
        // 1. Initial State & Basic Access
        log('\n--- 1. Initial State & Access ---');
        const [state, setState] = createStore({ count: 0, user: { name: 'Alice' } });
        log('Initial count:', state.count); // 0
        log('Initial user:', state.user.name); // Alice

        // 2. Reactivity Tracking
        log('\n--- 2. Reactivity Tracking ---');
        let runs = 0;
        createEffect(() => {
            log('Effect run:', state.count);
            runs++;
        });

        // Effect runs once immediately
        if (runs === 1) log('✅ Effect ran initially');
        else log('❌ Effect failed initial run');

        // Update
        setState('count', 1);
        // Effect should run again
        if (runs === 2 && state.count === 1) log('✅ Reactivity works (count updated)');
        else log('❌ Reactivity failed (runs:', runs, 'count:', state.count, ')');

        // 3. Nested Updates
        log('\n--- 3. Nested Updates ---');
        let userRuns = 0;
        createEffect(() => {
            log('User effect:', state.user.name);
            userRuns++;
        });

        if (userRuns === 1) log('✅ User effect ran initially');

        setState('user', 'name', 'Bob');
        if (userRuns === 2 && state.user.name === 'Bob') log('✅ Nested update works');
        else log('❌ Nested update failed (runs:', userRuns, 'name:', state.user.name, ')');

        // 4. Produce (Mutable Proxy)
        log('\n--- 4. Produce (Mutable Proxy) ---');
        const [listState, setListState] = createStore({ items: [1, 2, 3] });

        let listRuns = 0;
        createEffect(() => {
            log('List length:', listState.items.length);
            listRuns++;
        });

        if (listRuns === 1) log('✅ List effect ran initially');

        setListState('items', produce((items: number[]) => {
            items.push(4);
        }));

        if (listRuns === 2 && listState.items.length === 4) log('✅ Produce push works');
        else log('❌ Produce push failed (runs:', listRuns, 'length:', listState.items.length, ')');

        // Verify content
        if (listState.items[3] === 4) log('✅ List content correct');
        else log('❌ List content incorrect:', listState.items);

    } catch (e) {
        log('❌ Error during verification:', e);
    } finally {
        dispose();
    }
});

log('\nVerification Complete.');
fs.writeFileSync('verification_result.txt', logOutput);
