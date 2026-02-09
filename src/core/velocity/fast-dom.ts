/**
 * Velocity Fast-DOM: High-Performance Template System
 *
 * Provides O(1) template instantiation via cloneNode vs O(N) createElement.
 * Key optimizations:
 * - Template caching: Parse HTML once, clone many times
 * - Slot markers: Comment nodes as binding anchors
 * - Direct hydration: Walk cloned DOM and attach reactive bindings
 */

import { createEffect, onCleanup } from './reactivity';

// ============================================================================
// Types
// ============================================================================

export interface SlotDescriptor {
    type: 'text' | 'attr' | 'prop' | 'event' | 'children';
    path: number[];        // TreeWalker path from root
    name?: string;         // Attribute/prop name for attr/prop types
    index?: number;        // Slot index for binding array
}

export interface TemplateDescriptor {
    template: HTMLTemplateElement;
    slots: SlotDescriptor[];
    html: string;          // Original HTML for debugging
}

export interface Binding {
    slot: SlotDescriptor;
    value: any | (() => any);  // Static value or reactive getter
}

// ============================================================================
// Template Cache
// ============================================================================

const templateCache = new Map<string, TemplateDescriptor>();
const SLOT_MARKER = '<!--$-->';
const SLOT_ATTR_PREFIX = '__slot_';

// ============================================================================
// Template Factory
// ============================================================================

/**
 * Create a template factory from an HTML string with slot markers.
 * Slot markers are replaced with comment nodes for text bindings.
 *
 * @example
 * const factory = createTemplate('<div class="card"><!--$--></div>');
 * const [fragment, slots] = factory();
 * hydrate(fragment, slots, [() => name()]);
 */
export function createTemplate(html: string): () => [DocumentFragment, SlotDescriptor[]] {
    let descriptor = templateCache.get(html);

    if (!descriptor) {
        descriptor = parseTemplate(html);
        templateCache.set(html, descriptor);
    }

    const { template, slots } = descriptor;

    return () => {
        // O(1) clone operation - this is the key performance win
        const fragment = template.content.cloneNode(true) as DocumentFragment;
        return [fragment, slots];
    };
}

/**
 * Parse HTML string into a template descriptor with slot information.
 */
function parseTemplate(html: string): TemplateDescriptor {
    const template = document.createElement('template');
    template.innerHTML = html;

    const slots: SlotDescriptor[] = [];
    const walker = document.createTreeWalker(
        template.content,
        NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
        null
    );

    let slotIndex = 0;
    const pathStack: number[] = [];
    let currentParent: Node | null = null;
    let childIndex = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;

        // Track path for slot location
        if (node.parentNode !== currentParent) {
            if (currentParent) {
                // Pop back to common ancestor
                while (currentParent && currentParent !== node.parentNode) {
                    pathStack.pop();
                    currentParent = currentParent.parentNode;
                }
            }
            currentParent = node.parentNode;
            childIndex = 0;
            for (let i = 0; currentParent && i < currentParent.childNodes.length; i++) {
                if (currentParent.childNodes[i] === node) {
                    childIndex = i;
                    break;
                }
            }
        }

        if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === '$') {
            // Text slot marker
            slots.push({
                type: 'text',
                path: [...pathStack, childIndex],
                index: slotIndex++
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;

            // Check for slot attributes
            const attrs = Array.from(el.attributes);
            for (const attr of attrs) {
                if (attr.name.startsWith(SLOT_ATTR_PREFIX)) {
                    const realName = attr.name.slice(SLOT_ATTR_PREFIX.length);
                    const slotType = realName.startsWith('on') ? 'event' : 'attr';

                    slots.push({
                        type: slotType,
                        path: [...pathStack, childIndex],
                        name: realName,
                        index: slotIndex++
                    });

                    el.removeAttribute(attr.name);
                } else if (attr.value === SLOT_MARKER) {
                    slots.push({
                        type: 'attr',
                        path: [...pathStack, childIndex],
                        name: attr.name,
                        index: slotIndex++
                    });
                }
            }
        }

        childIndex++;
    }

    return { template, slots, html };
}

// ============================================================================
// Hydration
// ============================================================================

/**
 * Hydrate a cloned template fragment with reactive bindings.
 * This walks the DOM once and attaches all bindings.
 */
export function hydrate(
    fragment: DocumentFragment,
    slots: SlotDescriptor[],
    bindings: (any | (() => any))[]
): void {
    // Group slots by path for efficient traversal
    const slotsByPath = new Map<string, SlotDescriptor[]>();
    for (const slot of slots) {
        const pathKey = slot.path.join(',');
        const group = slotsByPath.get(pathKey) || [];
        group.push(slot);
        slotsByPath.set(pathKey, group);
    }

    // Walk the DOM and apply bindings
    for (const [pathKey, pathSlots] of slotsByPath) {
        const path = pathKey.split(',').map(Number);
        const node = walkPath(fragment, path);

        if (!node) continue;

        for (const slot of pathSlots) {
            const binding = bindings[slot.index!];
            if (binding === undefined) continue;

            applyBinding(node, slot, binding);
        }
    }
}

/**
 * Walk a path to find a node in the DOM tree.
 */
function walkPath(root: Node, path: number[]): Node | null {
    let node: Node | null = root;

    for (const index of path) {
        if (!node) return null;

        // For fragments, start from childNodes
        if (node instanceof DocumentFragment) {
            node = node.childNodes[index] || null;
        } else {
            node = node.childNodes[index] || null;
        }
    }

    return node;
}

/**
 * Apply a single binding to a node.
 */
function applyBinding(node: Node, slot: SlotDescriptor, value: any | (() => any)): void {
    const isReactive = typeof value === 'function';

    switch (slot.type) {
        case 'text':
            if (node.nodeType === Node.COMMENT_NODE) {
                // Replace comment with text node
                const textNode = document.createTextNode('');
                node.parentNode?.replaceChild(textNode, node);

                if (isReactive) {
                    createEffect(() => {
                        textNode.nodeValue = String(value());
                    });
                } else {
                    textNode.nodeValue = String(value);
                }
            }
            break;

        case 'attr':
            if (node instanceof Element && slot.name) {
                if (isReactive) {
                    createEffect(() => {
                        const v = value();
                        if (v == null || v === false) {
                            node.removeAttribute(slot.name!);
                        } else {
                            node.setAttribute(slot.name!, v === true ? '' : String(v));
                        }
                    });
                } else {
                    if (value == null || value === false) {
                        node.removeAttribute(slot.name);
                    } else {
                        node.setAttribute(slot.name, value === true ? '' : String(value));
                    }
                }
            }
            break;

        case 'prop':
            if (node instanceof Element && slot.name) {
                if (isReactive) {
                    createEffect(() => {
                        (node as any)[slot.name!] = value();
                    });
                } else {
                    (node as any)[slot.name] = value;
                }
            }
            break;

        case 'event':
            if (node instanceof Element && slot.name) {
                const eventName = slot.name.slice(2).toLowerCase();
                node.addEventListener(eventName, value);
                onCleanup(() => node.removeEventListener(eventName, value));
            }
            break;

        case 'children':
            // Children are handled separately by the reconciler
            break;
    }
}

// ============================================================================
// Compiled JSX Support
// ============================================================================

/**
 * Create an element using template cloning when possible.
 * Falls back to regular createElement for dynamic tags.
 */
export function createElementFast(
    tag: string,
    staticHtml: string | null,
    bindings: Binding[]
): Element | DocumentFragment {
    if (staticHtml) {
        // Use template cloning
        const factory = createTemplate(staticHtml);
        const [fragment, slots] = factory();
        hydrate(fragment, slots, bindings.map(b => b.value));

        // Return single element or fragment
        if (fragment.childNodes.length === 1) {
            return fragment.firstChild as Element;
        }
        return fragment;
    }

    // Fallback to regular element creation
    const el = document.createElement(tag);
    for (const binding of bindings) {
        applyBinding(el, binding.slot, binding.value);
    }
    return el;
}

// ============================================================================
// Template Literals Support
// ============================================================================

/**
 * Tagged template literal for creating fast templates.
 *
 * @example
 * const Card = html`<div class="card">${0}</div>`;
 * const element = Card('Hello World');
 */
export function html(strings: TemplateStringsArray, ...keys: number[]): (...values: any[]) => DocumentFragment {
    // Build HTML with slot markers
    let htmlStr = strings[0];
    for (let i = 0; i < keys.length; i++) {
        htmlStr += SLOT_MARKER + strings[i + 1];
    }

    const factory = createTemplate(htmlStr);

    return (...values: any[]) => {
        const [fragment, slots] = factory();
        hydrate(fragment, slots, values);
        return fragment;
    };
}

// ============================================================================
// Precompiled Template Registry
// ============================================================================

const compiledTemplates = new Map<string, () => [DocumentFragment, SlotDescriptor[]]>();

/**
 * Register a precompiled template for fastest instantiation.
 * Used by build-time compilation.
 */
export function registerTemplate(id: string, html: string): void {
    compiledTemplates.set(id, createTemplate(html));
}

/**
 * Instantiate a precompiled template by ID.
 */
export function instantiateTemplate(id: string): [DocumentFragment, SlotDescriptor[]] | null {
    const factory = compiledTemplates.get(id);
    return factory ? factory() : null;
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Clear the template cache. Useful for hot module replacement.
 */
export function clearTemplateCache(): void {
    templateCache.clear();
    compiledTemplates.clear();
}

/**
 * Get template cache statistics for debugging.
 */
export function getTemplateCacheStats(): { size: number; entries: string[] } {
    return {
        size: templateCache.size + compiledTemplates.size,
        entries: [...templateCache.keys(), ...compiledTemplates.keys()]
    };
}

// ============================================================================
// Direct DOM Helpers (No Template)
// ============================================================================

/**
 * Ultra-fast element creation for simple cases.
 * Avoids template overhead for single-element creation.
 */
export function el(tag: string, props?: Record<string, any>, ...children: any[]): Element {
    const element = document.createElement(tag);

    if (props) {
        for (const key in props) {
            const value = props[key];

            if (key.startsWith('on') && key[2] >= 'A' && key[2] <= 'Z') {
                // Event handler
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'class' || key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (typeof value === 'function') {
                // Reactive prop
                createEffect(() => {
                    const v = value();
                    if (key in element) {
                        (element as any)[key] = v;
                    } else {
                        element.setAttribute(key, v);
                    }
                });
            } else {
                // Static prop
                if (key in element) {
                    (element as any)[key] = value;
                } else {
                    element.setAttribute(key, value);
                }
            }
        }
    }

    for (const child of children) {
        if (child == null || child === false || child === true) continue;
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else if (typeof child === 'function') {
            const text = document.createTextNode('');
            element.appendChild(text);
            createEffect(() => {
                text.nodeValue = String(child());
            });
        }
    }

    return element;
}
