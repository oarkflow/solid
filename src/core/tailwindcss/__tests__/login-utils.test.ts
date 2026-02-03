import { describe, it, expect } from 'vitest';
import { TailwindEngine } from '../../tailwindcss/engine';

describe('Login page utility parsing', () => {
    it('parses ring and ring colors/offset correctly', () => {
        const r2 = TailwindEngine.parseUtility('ring-2');
        expect(r2).toBeTruthy();
        expect(r2!['--tw-ring-shadow'] || r2!['boxShadow']).toBeTruthy();

        const ro = TailwindEngine.parseUtility('ring-offset-2');
        expect(ro).toBeTruthy();
        expect(ro!['--tw-ring-offset-width']).toBe('2px');

        const rc = TailwindEngine.parseUtility('ring-blue-500');
        expect(rc).toBeTruthy();
        expect(rc!['--tw-ring-color']).toBe('#3b82f6');
    });

    it('parses filters and drop-shadow', () => {
        const blur = TailwindEngine.parseUtility('blur-2');
        expect(blur).toBeTruthy();
        expect(blur!['--tw-blur']).toBe('blur(2px)');
        expect(blur!['filter']).toContain('--tw-blur');

        const ds = TailwindEngine.parseUtility('drop-shadow-md');
        expect(ds).toBeTruthy();
        expect(ds!['--tw-drop-shadow']).toContain('drop-shadow');
        expect(ds!['filter']).toContain('--tw-drop-shadow');
    });

    it('parses gradient utilities', () => {
        const g = TailwindEngine.parseUtility('bg-gradient-to-r');
        expect(g).toBeTruthy();
        expect(g!['backgroundImage']).toContain('linear-gradient');
    });
});
