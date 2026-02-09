
import { describe, it, expect } from 'vitest';
import { compile } from '../compiler';

describe('Velocity JSX Compiler', () => {
    it('should compile static JSX to template', () => {
        const input = `const App = () => <div>Hello World</div>;`;
        const output = compile(input);

        expect(output).toContain('const _tmpl$ = createTemplate("<div>Hello World</div>")');
        expect(output).toContain('const App = () => _tmpl$.cloneNode(true)');
    });

    it('should handle dynamic content', () => {
        const input = `const App = () => <div>Hello {name}</div>;`;
        const output = compile(input);

        expect(output).toContain('createTemplate("<div>Hello <!--#--></div>")');
        expect(output).toContain('insert(_el$, name)');
    });

    it('should handle attributes', () => {
        const input = `const App = () => <div id="main" class={active}>Content</div>;`;
        const output = compile(input);

        expect(output).toContain('createTemplate("<div id=\\"main\\">Content</div>")');
        expect(output).toContain('effect(() => _el$.className = active)');
    });

    it('should handle nested elements', () => {
        const input = `const App = () => <div><span>Static</span>{dynamic}</div>;`;
        const output = compile(input);

        // Should find the marker for dynamic
        expect(output).toContain('<!--#-->');
    });
});
