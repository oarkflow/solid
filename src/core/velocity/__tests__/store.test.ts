import { describe, it, expect, vi } from 'vitest';
import { createStore, produce, reconcile } from '../store';
import { createEffect, createRoot } from '../reactivity';

describe('createStore', () => {
    it('should create a store with initial state', () => {
        const [state, setState] = createStore({ count: 0 });
        expect(state.count).toBe(0);
    });

    it('should track property access', () => {
        const [state, setState] = createStore({ count: 0 });
        let runs = 0;

        createRoot(() => {
            createEffect(() => {
                state.count;
                runs++;
            });
        });

        expect(runs).toBe(1);
        setState('count', 1);
        expect(runs).toBe(2);
        expect(state.count).toBe(1);
    });

    it('should handle nested updates', () => {
        const [state, setState] = createStore({ user: { name: 'John', address: { city: 'New York' } } });
        let runs = 0;

        createRoot(() => {
            createEffect(() => {
                state.user.address.city;
                runs++;
            });
        });

        expect(runs).toBe(1);
        setState('user', 'address', 'city', 'London');
        expect(runs).toBe(2);
        expect(state.user.address.city).toBe('London');
    });

    it('should not trigger unrelated updates', () => {
        const [state, setState] = createStore({ user: { name: 'John', age: 30 } });
        let runs = 0;

        createRoot(() => {
            createEffect(() => {
                state.user.name;
                runs++;
            });
        });

        expect(runs).toBe(1);
        setState('user', 'age', 31);
        expect(runs).toBe(1); // Should not trigger
    });

    it('should support array mutations', () => {
        const [state, setState] = createStore({ list: [1, 2, 3] });
        let runs = 0;

        createRoot(() => {
            createEffect(() => {
                state.list.length;
                runs++;
            });
        });

        expect(runs).toBe(1);
        setState('list', (l: number[]) => [...l, 4]);
        expect(runs).toBe(2);
        expect(state.list).toEqual([1, 2, 3, 4]);
    });

    it('should support produce for complex updates', () => {
        const [state, setState] = createStore({ list: [{ id: 1, done: false }] });

        setState('list', 0, produce((item: any) => {
            item.done = true;
        }));

        expect(state.list[0].done).toBe(true);
    });

    it('should unwrap proxies', () => {
        // TODO: Implement unwrap test
    });
});
