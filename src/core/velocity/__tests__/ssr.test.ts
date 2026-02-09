
import { describe, it, expect, vi } from 'vitest';
import { renderToString, renderToStream, ssrElement } from '../ssr';
import { createSignal, createComponent } from '../reactivity';

// Mock isServer for testing?
// Since we are running in JSDOM (client), isServer is false.
// But renderToString should work regardless (it mocks DOM or string generation).

describe('SSR: renderToString', () => {
    it('should render static string', () => {
        const App = () => '<div>Hello World</div>';
        const html = renderToString(App);
        expect(html).toBe('<div>Hello World</div>');
    });

    it('should render nested array of strings', () => {
        const App = () => ['<div>', 'Hello', '</div>'];
        const html = renderToString(App);
        expect(html).toBe('<div>Hello</div>');
    });

    it('should handle errors gracefully', () => {
        const App = () => { throw new Error('Test Error'); };
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const html = renderToString(App);
        expect(html).toBe('');
        consoleSpy.mockRestore();
    });
});

describe('SSR: ssrElement', () => {
    it('should generate HTML string with attributes', () => {
        const html = ssrElement('div', { id: 'main', class: 'container' }, ['Content']);
        expect(html).toBe('<div id="main" class="container">Content</div>');
    });

    it('should escape attributes', () => {
        const html = ssrElement('input', { value: '"><script>' }, []);
        expect(html).toContain('value="&quot;&gt;&lt;script&gt;"');
    });

    it('should handle nested children', () => {
        const child = ssrElement('span', {}, ['Child']);
        const parent = ssrElement('div', {}, [child]);
        expect(parent).toBe('<div><span>Child</span></div>');
    });
});
