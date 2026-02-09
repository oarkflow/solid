import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    createElement,
    Fragment,
    render,
    Show,
    For,
    Switch,
    Match,
    Portal,
} from '../jsx';
import { createSignal, createRoot, onCleanup } from '../reactivity';

describe('JSX Runtime', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe('createElement', () => {
        it('should create basic HTML elements', () => {
            const el = createElement('div', null) as HTMLElement;
            expect(el.tagName).toBe('DIV');
        });

        it('should set static attributes', () => {
            const el = createElement('div', {
                id: 'test',
                class: 'myclass',
            }) as HTMLElement;

            expect(el.id).toBe('test');
            expect(el.className).toBe('myclass');
        });

        it('should set style as object', () => {
            const el = createElement('div', {
                style: { color: 'red', fontSize: '14px' },
            }) as HTMLElement;

            expect(el.style.color).toBe('red');
            expect(el.style.fontSize).toBe('14px');
        });

        it('should set style as string', () => {
            const el = createElement('div', {
                style: 'color: blue; font-size: 16px',
            }) as HTMLElement;

            expect(el.style.cssText).toContain('color');
        });

        it('should add event listeners', () => {
            let clicked = false;
            const el = createElement('button', {
                onClick: () => { clicked = true; },
            }) as HTMLButtonElement;

            el.click();
            expect(clicked).toBe(true);
        });

        it('should handle text children', () => {
            const el = createElement('div', null, 'Hello World') as HTMLElement;
            expect(el.textContent).toBe('Hello World');
        });

        it('should handle multiple children', () => {
            const el = createElement(
                'div',
                null,
                createElement('span', null, 'First'),
                createElement('span', null, 'Second')
            ) as HTMLElement;

            expect(el.children.length).toBe(2);
            expect(el.children[0].textContent).toBe('First');
            expect(el.children[1].textContent).toBe('Second');
        });

        it('should handle reactive attributes', () => {
            const [value, setValue] = createSignal('initial');

            createRoot(() => {
                const el = createElement('div', {
                    'data-value': value,
                }) as HTMLElement;

                container.appendChild(el);

                expect(el.getAttribute('data-value')).toBe('initial');
                setValue('updated');
                expect(el.getAttribute('data-value')).toBe('updated');
            });
        });

        it('should handle reactive children', () => {
            const [text, setText] = createSignal('Hello');

            createRoot(() => {
                const el = createElement('div', null, text) as HTMLElement;
                container.appendChild(el);

                expect(el.textContent).toBe('Hello');
                setText('Goodbye');
                expect(el.textContent).toBe('Goodbye');
            });
        });

        it('should sanitize dangerous URLs', () => {
            const el = createElement('a', {
                href: 'javascript:alert(1)',
            }) as HTMLAnchorElement;

            expect(el.href).not.toContain('javascript:');
        });

        it('should handle SVG elements', () => {
            const el = createElement('svg', {
                viewBox: '0 0 100 100',
            }) as SVGElement;

            expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
        });

        it('should call ref callback', () => {
            let refElement: HTMLElement | null = null;

            const el = createElement('div', {
                ref: (el: HTMLElement) => { refElement = el; },
            }) as HTMLElement;

            expect(refElement).toBe(el);
        });
    });

    describe('Fragment', () => {
        it('should create a document fragment', () => {
            const frag = Fragment({
                children: [
                    createElement('span', null, 'A'),
                    createElement('span', null, 'B'),
                ]
            }) as DocumentFragment;

            expect(frag.childNodes.length).toBe(2);
        });
    });

    describe('Show', () => {
        it('should show content when condition is true', () => {
            createRoot(() => {
                const el = createElement('div', null,
                    Show({
                        when: true,
                        children: createElement('span', null, 'Visible'),
                    })
                ) as HTMLElement;

                container.appendChild(el);
                expect(container.textContent).toContain('Visible');
            });
        });

        it('should show fallback when condition is false', () => {
            createRoot(() => {
                const el = createElement('div', null,
                    Show({
                        when: false,
                        fallback: createElement('span', null, 'Fallback'),
                        children: createElement('span', null, 'Visible'),
                    })
                ) as HTMLElement;

                container.appendChild(el);
                expect(container.textContent).toContain('Fallback');
            });
        });

        it('should react to condition changes', () => {
            const [visible, setVisible] = createSignal(true);

            createRoot(() => {
                const el = createElement('div', null,
                    Show({
                        when: visible,
                        fallback: createElement('span', null, 'Hidden'),
                        children: createElement('span', null, 'Shown'),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(container.textContent).toContain('Shown');
                setVisible(false);
                expect(container.textContent).toContain('Hidden');
            });
        });

        it('should pass value to render function', () => {
            const [user, setUser] = createSignal<{ name: string } | null>({ name: 'Alice' });

            createRoot(() => {
                const el = createElement('div', null,
                    Show({
                        when: user,
                        children: (u: { name: string }) => createElement('span', null, u.name),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(container.textContent).toContain('Alice');
            });
        });
    });

    describe('For', () => {
        it('should render list items', () => {
            const items = ['A', 'B', 'C'];

            createRoot(() => {
                const el = createElement('div', null,
                    For({
                        each: items,
                        children: (item: string) => createElement('span', null, item),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(container.querySelectorAll('span').length).toBe(3);
            });
        });

        it('should update when list changes', () => {
            const [items, setItems] = createSignal(['A', 'B']);

            createRoot(() => {
                const el = createElement('div', null,
                    For({
                        each: items,
                        children: (item: string) => createElement('span', null, item),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(container.querySelectorAll('span').length).toBe(2);
                setItems(['A', 'B', 'C', 'D']);
                expect(container.querySelectorAll('span').length).toBe(4);
            });
        });

        it('should show fallback for empty list', () => {
            createRoot(() => {
                const el = createElement('div', null,
                    For({
                        each: [],
                        fallback: createElement('span', null, 'Empty'),
                        children: (item: string) => createElement('span', null, item),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(container.textContent).toContain('Empty');
            });
        });

        it('should provide reactive index', () => {
            const [items, setItems] = createSignal(['A', 'B', 'C']);

            createRoot(() => {
                const indices: number[] = [];

                const el = createElement('div', null,
                    For({
                        each: items,
                        children: (item: string, index: () => number) => {
                            indices.push(index());
                            return createElement('span', null, item);
                        },
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(indices).toEqual([0, 1, 2]);
            });
        });

        it('should reuse existing nodes when items move', () => {
            const [items, setItems] = createSignal([
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ]);

            let nodes: HTMLElement[] = [];

            createRoot(() => {
                const el = createElement('div', null,
                    For({
                        each: items,
                        children: (item: { id: number; name: string }) => {
                            const span = createElement('span', null, item.name) as HTMLElement;
                            nodes.push(span);
                            return span;
                        },
                    })
                ) as HTMLElement;

                container.appendChild(el);

                const initialNodes = [...nodes];

                // Reverse order
                setItems([
                    { id: 2, name: 'B' },
                    { id: 1, name: 'A' },
                ]);

                // Nodes should be reused (same references)
                expect(nodes).toContain(initialNodes[0]);
                expect(nodes).toContain(initialNodes[1]);
            });
        });
    });

    describe('Portal', () => {
        it('should render content to target element', () => {
            const target = document.createElement('div');
            target.id = 'portal-target';
            document.body.appendChild(target);

            createRoot(() => {
                Portal({
                    mount: '#portal-target',
                    children: createElement('span', null, 'Portaled'),
                });

                expect(target.textContent).toContain('Portaled');
            });

            target.remove();
        });

        it('should cleanup when disposed', () => {
            const target = document.createElement('div');
            document.body.appendChild(target);

            const dispose = createRoot(dispose => {
                Portal({
                    mount: target,
                    children: createElement('span', null, 'Portaled'),
                });
                return dispose;
            });

            expect(target.children.length).toBe(1);
            dispose();
            expect(target.children.length).toBe(0);
        });
    });

    describe('render', () => {
        it('should render component to container', () => {
            createRoot(() => {
                render(createElement('div', null, 'Hello'), container);
                expect(container.textContent).toBe('Hello');
            });
        });
    });

    describe('Component disposal', () => {
        it('should cleanup component when removed from DOM', () => {
            let cleanedUp = false;

            const TestComponent = () => {
                onCleanup(() => {
                    cleanedUp = true;
                });
                return createElement('span', null, 'Test');
            };

            const [show, setShow] = createSignal(true);

            createRoot(() => {
                const el = createElement('div', null,
                    Show({
                        when: show,
                        children: createElement(TestComponent, null),
                    })
                ) as HTMLElement;

                container.appendChild(el);

                expect(cleanedUp).toBe(false);
                setShow(false);
                expect(cleanedUp).toBe(true);
            });
        });
    });
});
