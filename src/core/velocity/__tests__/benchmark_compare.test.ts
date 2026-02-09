
import { describe, it } from 'vitest';
import { createSignal as vSignal, createEffect as vEffect, createRoot as vRoot } from '../reactivity';
import { createSignal as sSignal, createEffect as sEffect, createRoot as sRoot } from 'solid-js';

describe('Factual Comparative Benchmark', () => {
    const iterations = 100000;

    it('Signal/State Creation (10k)', () => {
        const count = 10000;

        let start = performance.now();
        vRoot(() => {
            for (let i = 0; i < count; i++) vSignal(0);
        });
        const vTime = performance.now() - start;

        start = performance.now();
        sRoot(() => {
            for (let i = 0; i < count; i++) sSignal(0);
        });
        const sTime = performance.now() - start;

        console.log(`\nCreation 10k items:`);
        console.log(`Velocity: ${vTime.toFixed(2)}ms`);
        console.log(`SolidJS:  ${sTime.toFixed(2)}ms`);
    });

    it('Signal/State Update Speed (100k writes)', () => {
        // Velocity
        const [vGet, vSet] = vSignal(0);
        let start = performance.now();
        for (let i = 0; i < iterations; i++) vSet(i);
        const vTime = performance.now() - start;

        // SolidJS
        const [sGet, sSet] = sSignal(0);
        start = performance.now();
        for (let i = 0; i < iterations; i++) sSet(i);
        const sTime = performance.now() - start;

        // React (Simulated logic - just the state setter overhead)
        // In React, setting state is async and involves scheduling.
        // We'll simulate a synchronous loop that triggers a callback to mimic the work.
        let reactVal = 0;
        const listeners = new Set<Function>();
        const reactSet = (val: number) => {
            reactVal = val;
            listeners.forEach(l => l());
        };
        listeners.add(() => { }); // Minimal observer
        start = performance.now();
        for (let i = 0; i < iterations; i++) reactSet(i);
        const rTime = performance.now() - start;

        console.log(`\nUpdate Speed (100k):`);
        console.log(`Velocity: ${vTime.toFixed(2)}ms`);
        console.log(`SolidJS:  ${sTime.toFixed(2)}ms`);
        console.log(`React (Simulated): ${rTime.toFixed(2)}ms`);
    });

    it('Effect Propagation (50k triggers)', () => {
        const effectIterations = 50000;

        // Velocity
        const [vGet, vSet] = vSignal(0);
        let vCount = 0;
        vEffect(() => { vGet(); vCount++; });
        let start = performance.now();
        for (let i = 0; i < effectIterations; i++) vSet(i);
        const vTime = performance.now() - start;

        // SolidJS
        const [sGet, sSet] = sSignal(0);
        let sCount = 0;
        sEffect(() => { sGet(); sCount++; });
        start = performance.now();
        for (let i = 0; i < effectIterations; i++) sSet(i);
        const sTime = performance.now() - start;

        console.log(`\nEffect Propagation (50k):`);
        console.log(`Velocity: ${vTime.toFixed(2)}ms`);
        console.log(`SolidJS:  ${sTime.toFixed(2)}ms`);
    });
});
