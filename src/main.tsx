import { installTailwind } from '@/core/tailwindcss';
// Install Tailwind CSS runtime
installTailwind();
import './index.css';

import { render } from "@/core/velocity";
import { App } from "./App";


// Auto-install devtools in dev mode
const __isDev = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV !== 'production') ||
    (typeof globalThis !== 'undefined' && 'process' in globalThis && (globalThis as any).process?.env?.NODE_ENV !== 'production')
);
if (__isDev) {
    import('@/core/velocity/devtools').then(({ installDevtools }) => {
        installDevtools({ autoOpen: true, autoEnableInDev: true, highlightUpdates: true, autoBindSelector: '.button' });
    }).catch(error => console.warn('[Devtools] Failed to load', error));
}

render(<App />, document.getElementById('root')!);
