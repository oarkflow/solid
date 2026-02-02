// Global JSX runtime types - allows using JSX without importing createElement
import type { createElement as _createElement, Fragment as _Fragment } from './jsx';

declare global {
    const createElement: typeof _createElement;
    const Fragment: typeof _Fragment;

}

export { };
