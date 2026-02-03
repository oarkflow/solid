/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@/core/velocity';
import { LoginPage } from '@/app/pages/Login';
import { installTailwind } from '../index';

describe('Login page render', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        // Ensure style tag removed
        const old = document.getElementById('tailwind-runtime');
        if (old) old.remove();
    });

    it('renders and injects style rules for classes', async () => {
        installTailwind();        // Register a mock router API to avoid routing errors in LoginPage
        const { registerRouterApi } = await import('@/app/router/navigation');
        registerRouterApi({ navigate: () => { } } as any);        // render accepts component function too
        render(() => LoginPage({}), document.getElementById('root')!);

        // Check that style tag exists
        const style = document.getElementById('tailwind-runtime');
        expect(style).toBeTruthy();
        const sheet = (style as HTMLStyleElement).sheet!;
        const cssTexts = Array.from(sheet.cssRules).map(r => r.cssText);
        // Expect at least one rule for a known class e.g., '.bg-blue-600' or '.bg-blue-600:hover'
        const found = cssTexts.find(t => t.includes('.bg-blue-600')) || cssTexts.find(t => t.includes('.bg-blue-600:hover'));
        expect(found).toBeTruthy();

        // Expect ring rule too (var declarations or box-shadow)
        const ringRule = cssTexts.find(t => t.includes('--tw-ring-shadow') || t.includes('box-shadow') && t.includes('ring-2'));
        expect(ringRule).toBeTruthy();

        // Expect filter rule for blur
        const blurRule = cssTexts.find(t => t.includes('--tw-blur') || t.includes('.blur-2'));
        expect(blurRule).toBeTruthy();
    });
});
