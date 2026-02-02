import { App } from "./App";
import { installDevtools, render } from "./velocity";


// Auto-install devtools in dev mode
const __isDev = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV !== 'production') ||
    (typeof globalThis !== 'undefined' && 'process' in globalThis && (globalThis as any).process?.env?.NODE_ENV !== 'production')
);
if (__isDev) {
    installDevtools({ autoOpen: true, autoEnableInDev: true, highlightUpdates: true, autoBindSelector: '.button' });
}

render(<App />, document.getElementById('root')!);
