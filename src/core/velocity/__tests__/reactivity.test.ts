import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    createSignal,
    createEffect,
    createMemo,
    batch,
    onCleanup,
    untrack,
    createRoot,
    onMount,
    on,
    createDebouncedSignal,
    createThrottledSignal,
} from '../reactivity';

describe('Reactivity Core', () => {
    describe('createSignal', () => {
        it('should create a signal with initial value', () => {
            const [count] = createSignal(0);
            expect(count()).toBe(0);
        });

        it('should update signal value', () => {
            const [count, setCount] = createSignal(0);
            setCount(5);
            expect(count()).toBe(5);
        });

        it('should accept function updater', () => {
            const [count, setCount] = createSignal(10);
            setCount(prev => prev + 5);
            expect(count()).toBe(15);
        });

        it('should not trigger effects if value is equal', () => {
            const [count, setCount] = createSignal(0);
            let effectRuns = 0;

            createRoot(() => {
                createEffect(() => {
                    count();
                    effectRuns++;
                });
            });

            expect(effectRuns).toBe(1);
            setCount(0); // Same value
            expect(effectRuns).toBe(1); // Should not run again
        });

        it('should respect equals: false option', () => {
            const [obj, setObj] = createSignal({ a: 1 }, { equals: false });
            let effectRuns = 0;

            createRoot(() => {
                createEffect(() => {
                    obj();
                    effectRuns++;
                });
            });

            expect(effectRuns).toBe(1);
            setObj({ a: 1 }); // Same content, different reference
            expect(effectRuns).toBe(2); // Should run again due to equals: false
        });

        it('should support custom equality function', () => {
            const [obj, setObj] = createSignal(
                { id: 1, name: 'test' },
                { equals: (prev, next) => prev.id === next.id }
            );
            let effectRuns = 0;

            createRoot(() => {
                createEffect(() => {
                    obj();
                    effectRuns++;
                });
            });

            expect(effectRuns).toBe(1);
            setObj({ id: 1, name: 'changed' }); // Same id
            expect(effectRuns).toBe(1); // Should not run
            setObj({ id: 2, name: 'test' }); // Different id
            expect(effectRuns).toBe(2); // Should run
        });
    });

    describe('createEffect', () => {
        it('should run immediately on creation', () => {
            let ran = false;
            createRoot(() => {
                createEffect(() => {
                    ran = true;
                });
            });
            expect(ran).toBe(true);
        });

        it('should track signal dependencies', () => {
            const [count, setCount] = createSignal(0);
            let effectValue = -1;

            createRoot(() => {
                createEffect(() => {
                    effectValue = count();
                });
            });

            expect(effectValue).toBe(0);
            setCount(10);
            expect(effectValue).toBe(10);
        });

        it('should track multiple signals', () => {
            const [a, setA] = createSignal(1);
            const [b, setB] = createSignal(2);
            let sum = 0;

            createRoot(() => {
                createEffect(() => {
                    sum = a() + b();
                });
            });

            expect(sum).toBe(3);
            setA(10);
            expect(sum).toBe(12);
            setB(20);
            expect(sum).toBe(30);
        });

        it('should handle conditional dependencies', () => {
            const [condition, setCondition] = createSignal(true);
            const [a] = createSignal(1);
            const [b] = createSignal(2);
            let result = 0;
            let runs = 0;

            createRoot(() => {
                createEffect(() => {
                    runs++;
                    result = condition() ? a() : b();
                });
            });

            expect(runs).toBe(1);
            setCondition(false);
            expect(runs).toBe(2);
            expect(result).toBe(2);
        });
    });

    describe('createMemo', () => {
        it('should compute derived value', () => {
            const [count] = createSignal(5);
            let memo: () => number;

            createRoot(() => {
                memo = createMemo(() => count() * 2);
            });

            expect(memo!()).toBe(10);
        });

        it('should update when dependencies change', () => {
            const [count, setCount] = createSignal(5);
            let memo: () => number;

            createRoot(() => {
                memo = createMemo(() => count() * 2);
            });

            setCount(10);
            expect(memo!()).toBe(20);
        });

        it('should not recompute if value unchanged', () => {
            const [count, setCount] = createSignal(5);
            let computations = 0;
            let memo: () => number;

            createRoot(() => {
                memo = createMemo(() => {
                    computations++;
                    return count() * 2;
                });
            });

            expect(computations).toBe(1);
            memo!(); // Access memo
            expect(computations).toBe(1); // Should not recompute
            setCount(10);
            memo!(); // Access memo to trigger update
            expect(computations).toBe(2); // Should recompute
        });
    });

    describe('batch', () => {
        it('should batch multiple updates', () => {
            const [a, setA] = createSignal(0);
            const [b, setB] = createSignal(0);
            let runs = 0;

            createRoot(() => {
                createEffect(() => {
                    a();
                    b();
                    runs++;
                });
            });

            expect(runs).toBe(1);

            batch(() => {
                setA(1);
                setB(1);
            });

            expect(runs).toBe(2); // Only one additional run for both updates
        });

        it('should return the result of the function', () => {
            const result = batch(() => {
                return 'hello';
            });
            expect(result).toBe('hello');
        });

        it('should handle nested batches', () => {
            const [count, setCount] = createSignal(0);
            let runs = 0;

            createRoot(() => {
                createEffect(() => {
                    count();
                    runs++;
                });
            });

            batch(() => {
                setCount(1);
                batch(() => {
                    setCount(2);
                });
                setCount(3);
            });

            expect(runs).toBe(2); // Initial + one batch completion
            expect(count()).toBe(3);
        });

        it('should detect infinite loops', () => {
            const [count, setCount] = createSignal(0);

            createRoot(() => {
                createEffect(() => {
                    if (count() < 2000) {
                        setCount(prev => prev + 1);
                    }
                });
            });

            // Should throw after 1000 iterations
            expect(() => {
                batch(() => {
                    setCount(0);
                });
            }).toThrow(/infinite loop/i);
        });
    });

    describe('onCleanup', () => {
        it('should run cleanup when effect re-runs', () => {
            const [count, setCount] = createSignal(0);
            let cleanupRan = false;

            createRoot(() => {
                createEffect(() => {
                    count();
                    onCleanup(() => {
                        cleanupRan = true;
                    });
                });
            });

            expect(cleanupRan).toBe(false);
            setCount(1);
            expect(cleanupRan).toBe(true);
        });

        it('should run cleanup when owner is disposed', () => {
            let cleanupRan = false;

            const dispose = createRoot(dispose => {
                onCleanup(() => {
                    cleanupRan = true;
                });
                return dispose;
            });

            expect(cleanupRan).toBe(false);
            dispose();
            expect(cleanupRan).toBe(true);
        });
    });

    describe('untrack', () => {
        it('should prevent dependency tracking', () => {
            const [a, setA] = createSignal(0);
            const [b, setB] = createSignal(0);
            let result = 0;
            let runs = 0;

            createRoot(() => {
                createEffect(() => {
                    runs++;
                    const aVal = a();
                    const bVal = untrack(() => b());
                    result = aVal + bVal;
                });
            });

            expect(runs).toBe(1);
            setB(10); // Should not trigger effect
            expect(runs).toBe(1);
            setA(5); // Should trigger effect
            expect(runs).toBe(2);
            expect(result).toBe(15); // Uses current b value
        });
    });

    describe('on', () => {
        it('should track explicit dependencies', () => {
            const [count, setCount] = createSignal(0);
            let lastValue: number | undefined;
            let lastPrev: number | undefined;

            createRoot(() => {
                on(count, (value, prev) => {
                    lastValue = value;
                    lastPrev = prev;
                });
            });

            expect(lastValue).toBe(0);
            expect(lastPrev).toBe(undefined);

            setCount(5);
            expect(lastValue).toBe(5);
            expect(lastPrev).toBe(0);
        });

        it('should support defer option', () => {
            const [count, setCount] = createSignal(0);
            let lastValue: number | undefined;

            createRoot(() => {
                on(count, (value) => {
                    lastValue = value;
                }, { defer: true });
            });

            expect(lastValue).toBe(undefined); // Deferred, didn't run initially
            setCount(5);
            expect(lastValue).toBe(5);
        });
    });

    describe('createRoot', () => {
        it('should create isolated ownership context', () => {
            let disposed = false;

            const result = createRoot(dispose => {
                onCleanup(() => {
                    disposed = true;
                });
                return { value: 42, dispose };
            });

            expect(result.value).toBe(42);
            expect(disposed).toBe(false);

            result.dispose();
            expect(disposed).toBe(true);
        });
    });

    describe('createDebouncedSignal', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should debounce value updates', () => {
            const [value, setValue] = createDebouncedSignal('initial', 100);

            setValue('update1');
            setValue('update2');
            setValue('update3');

            expect(value()).toBe('initial'); // Not updated yet

            vi.advanceTimersByTime(100);
            expect(value()).toBe('update3'); // Only final value applied
        });
    });

    describe('createThrottledSignal', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should throttle updates', () => {
            const [value, setValue] = createThrottledSignal(0, 100);

            setValue(1); // Immediate (first call, no throttle)
            expect(value()).toBe(1);

            setValue(2); // Throttled (queued as trailing)
            expect(value()).toBe(1);

            setValue(3); // Overwrites pending trailing value
            expect(value()).toBe(1);

            vi.advanceTimersByTime(100);
            expect(value()).toBe(3); // Trailing value applied after interval
        });
    });
});
