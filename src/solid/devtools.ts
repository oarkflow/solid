import { enableDevtools, getDevSnapshot, getComponentDeps } from './reactivity';
import { getDOMSnapshot, getElementById, getComponentsTree, getElementsForComponent } from './jsx';

// Search inputs (accessible from renderSnapshot)
let compSearchInput: HTMLInputElement | null = null;
let domSearchInput: HTMLInputElement | null = null;

let panel: HTMLDivElement | null = null;
let autoRefresh = false;
let refreshIntervalId: number | null = null;

function renderSnapshot() {
    if (!panel) return;
    const reactivityNode = panel.querySelector('#solid-devtools-reactivity') as HTMLElement | null;
    const domNode = panel.querySelector('#solid-devtools-dom') as HTMLElement | null;
    const componentsNode = panel.querySelector('#solid-devtools-components') as HTMLElement | null;
    if (!reactivityNode || !domNode || !componentsNode) return;

    const snapshot = createSnapshot();

    // Render reactivity
    reactivityNode.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.margin = '0';
    pre.style.whiteSpace = 'pre-wrap';
    pre.textContent = JSON.stringify(snapshot.reactivity, null, 2);
    reactivityNode.appendChild(pre);

    // Setup search listeners (once)
    if (domSearchInput && !(domSearchInput as any)._listenerAdded) {
        domSearchInput.addEventListener('input', () => renderSnapshot());
        (domSearchInput as any)._listenerAdded = true;
    }
    if (compSearchInput && !(compSearchInput as any)._listenerAdded) {
        compSearchInput.addEventListener('input', () => renderSnapshot());
        (compSearchInput as any)._listenerAdded = true;
    }

    // Render components tree with filter
    componentsNode.innerHTML = '';
    const comps = getComponentsTree();
    const compFilter = (compSearchInput && compSearchInput.value) ? compSearchInput.value.toLowerCase() : '';

    function renderCompNode(node: any, indent = 0) {
        // If filter present and node/name doesn't match, still traverse children
        const matches = !compFilter || node.name.toLowerCase().includes(compFilter);
        if (!matches) {
            if (node.children) {
                for (const child of node.children) renderCompNode(child, indent + 1);
            }
            return;
        }

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.paddingLeft = `${indent * 12}px`;
        row.style.cursor = 'pointer';
        row.style.padding = '4px 6px';

        const label = document.createElement('div');
        label.textContent = `${node.name} (#${node.id})`;
        label.style.fontWeight = '600';

        const meta = document.createElement('div');
        meta.textContent = `${node.renders}`;
        meta.style.opacity = '0.85';

        row.appendChild(label);
        row.appendChild(meta);

        // Hover highlight for component
        row.addEventListener('mouseenter', () => highlightComponentById(node.id));
        row.addEventListener('mouseleave', () => highlightElementById(undefined));

        // Click -> expand details & scroll to first element
        row.addEventListener('click', () => {
            const elIds = getElementsForComponent(node.id);
            if (elIds && elIds.length) {
                const el = getElementById(elIds[0]);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            const details = document.createElement('div');
            details.style.fontSize = '12px';
            details.style.marginTop = '6px';
            details.style.paddingLeft = '6px';

            // Component deps
            try {
                const deps = getComponentDeps(node.id);
                details.innerHTML = `<div>Signals: ${deps.signals.join(', ') || '—'}</div><div>Effects: ${deps.effects.join(', ') || '—'}</div>`;
            } catch { /* ignore */ }

            // Elements
            const elList = getElementsForComponent(node.id);
            details.innerHTML += `<div>Elements: ${elList.join(', ') || '—'}</div>`;

            // Remove previous details (if any) and add
            const prev = row.nextElementSibling as HTMLElement | null;
            if (prev && prev.classList.contains('component-details')) prev.remove();

            details.classList.add('component-details');
            row.after(details);
        });

        componentsNode!.appendChild(row);

        if (node.children) {
            for (const child of node.children) renderCompNode(child, indent + 1);
        }
    }

    for (const root of comps) renderCompNode(root, 0);

    // DOM
    domNode.innerHTML = '';
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gridTemplateColumns = '1fr 80px 60px';
    list.style.gap = '4px 8px';
    list.style.alignItems = 'center';

    const headerRow = document.createElement('div');
    headerRow.style.fontWeight = '700';
    headerRow.style.gridColumn = '1 / -1';
    headerRow.textContent = 'DOM Nodes';
    domNode.appendChild(headerRow);

    const domFilter = (domSearchInput && domSearchInput.value) ? domSearchInput.value.toLowerCase() : '';
    for (const item of snapshot.dom) {
        // apply filter
        if (domFilter) {
            const matchesTag = item.tag.toLowerCase().includes(domFilter);
            const matchesId = String(item.id).includes(domFilter);
            const matchesEvents = item.events.join(', ').toLowerCase().includes(domFilter);
            if (!(matchesTag || matchesId || matchesEvents)) continue;
        }

        const rowTag = document.createElement('div');
        rowTag.textContent = `${item.tag} #${item.id}`;
        rowTag.style.cursor = 'pointer';

        const rowEvents = document.createElement('div');
        rowEvents.textContent = item.events.join(', ');
        rowEvents.style.opacity = '0.8';

        const rowUpdates = document.createElement('div');
        rowUpdates.textContent = String(item.updates);
        rowUpdates.style.textAlign = 'right';

        const container = document.createElement('div');
        container.style.display = 'contents';
        container.appendChild(rowTag);
        container.appendChild(rowEvents);
        container.appendChild(rowUpdates);

        rowTag.addEventListener('mouseenter', () => highlightElementById(item.id));
        rowTag.addEventListener('mouseleave', () => highlightElementById(undefined));
        rowEvents.addEventListener('mouseenter', () => highlightElementById(item.id));
        rowEvents.addEventListener('mouseleave', () => highlightElementById(undefined));
        rowUpdates.addEventListener('mouseenter', () => highlightElementById(item.id));
        rowUpdates.addEventListener('mouseleave', () => highlightElementById(undefined));

        // click -> scroll into view and permanent highlight
        rowTag.addEventListener('click', () => {
            const el = getElementById(item.id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('solid-dev-updated');
                setTimeout(() => el.classList.remove('solid-dev-updated'), 1200);
            }
        });

        list.appendChild(container);
    }

    domNode.appendChild(list);
}

function createPanel() {
    panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.left = '12px';
    panel.style.right = '12px';
    panel.style.bottom = '12px';
    panel.style.maxWidth = 'calc(100% - 24px)';
    panel.style.width = 'auto';
    panel.style.maxHeight = '60vh';
    panel.style.boxSizing = 'border-box';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(17,24,39,0.95)';
    panel.style.color = '#fff';
    panel.style.fontFamily = 'Menlo, monospace';
    panel.style.fontSize = '12px';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
    panel.style.padding = '10px';
    panel.style.zIndex = '999999';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    const title = document.createElement('div');
    title.textContent = 'Solid Devtools';
    title.style.fontWeight = '700';
    title.style.fontSize = '12px';

    const controls = document.createElement('div');

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.onclick = () => renderSnapshot();
    Object.assign(refreshBtn.style, { marginRight: '6px', padding: '4px 8px' });

    const logBtn = document.createElement('button');
    logBtn.textContent = 'Log';
    logBtn.onclick = () => console.log('Dev Snapshot', createSnapshot());
    Object.assign(logBtn.style, { marginRight: '6px', padding: '4px 8px' });

    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto';
    autoBtn.onclick = () => {
        autoRefresh = !autoRefresh;
        autoBtn.style.opacity = autoRefresh ? '1' : '0.6';
        if (autoRefresh) {
            refreshIntervalId = window.setInterval(renderSnapshot, 800);
        } else if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
        }
    };
    Object.assign(autoBtn.style, { marginRight: '6px', padding: '4px 8px', opacity: '0.6' });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => destroyPanel();
    Object.assign(closeBtn.style, { padding: '4px 8px' });

    controls.appendChild(refreshBtn);
    controls.appendChild(logBtn);
    controls.appendChild(autoBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '8px';

    const reactivitySection = document.createElement('div');
    reactivitySection.id = 'solid-devtools-reactivity';
    reactivitySection.style.maxHeight = '20vh';
    reactivitySection.style.overflow = 'auto';

    const componentsSection = document.createElement('div');
    componentsSection.id = 'solid-devtools-components';
    componentsSection.style.maxHeight = '20vh';
    componentsSection.style.overflow = 'auto';

    const compSearch = document.createElement('input');
    compSearch.placeholder = 'Search components...';
    compSearch.style.width = '100%';
    compSearch.style.padding = '6px';
    compSearch.style.marginBottom = '6px';
    componentsSection.appendChild(compSearch);
    compSearchInput = compSearch;

    const domSection = document.createElement('div');
    domSection.id = 'solid-devtools-dom';
    domSection.style.maxHeight = '20vh';

    const domSearch = document.createElement('input');
    domSearch.placeholder = 'Search DOM (tag / id / event)...';
    domSearch.style.width = '100%';
    domSearch.style.padding = '6px';
    domSearch.style.marginBottom = '6px';
    domSection.appendChild(domSearch);
    domSearchInput = domSearch;
    // Append content sections
    content.appendChild(reactivitySection);
    content.appendChild(componentsSection);
    content.appendChild(domSection);

    panel.appendChild(header);
    panel.appendChild(content);

    document.body.appendChild(panel);

    // Create overlay for highlighting nodes
    if (!document.getElementById('solid-devtools-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'solid-devtools-overlay';
        Object.assign(overlay.style, {
            position: 'absolute',
            pointerEvents: 'none',
            border: '2px solid rgba(99,102,241,0.95)',
            boxShadow: '0 6px 18px rgba(99,102,241,0.12)',
            zIndex: '999999',
            transition: 'all 120ms ease',
            display: 'none',
        });
        document.body.appendChild(overlay);
    }
}

function destroyPanel() {
    if (panel) {
        panel.remove();
        panel = null;
    }
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

function createSnapshot() {
    return {
        reactivity: getDevSnapshot(),
        dom: getDOMSnapshot(),
    };
}

function highlightElementById(id: number | undefined) {
    const overlay = document.getElementById('solid-devtools-overlay');
    if (!overlay) return;
    if (!id) { overlay.style.display = 'none'; return; }
    const el = getElementById(id);
    if (!el || !(el as Element).getBoundingClientRect) { overlay.style.display = 'none'; return; }
    const rect = (el as Element).getBoundingClientRect();
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = 'block';
}

function highlightComponentById(componentId: number | undefined) {
    const overlay = document.getElementById('solid-devtools-overlay');
    if (!overlay) return;
    if (!componentId) { overlay.style.display = 'none'; return; }

    const ids = getElementsForComponent(componentId);
    if (!ids || ids.length === 0) { overlay.style.display = 'none'; return; }

    // Compute union rect
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const id of ids) {
        const el = getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
    }

    if (!isFinite(left)) { overlay.style.display = 'none'; return; }

    overlay.style.left = `${left + window.scrollX}px`;
    overlay.style.top = `${top + window.scrollY}px`;
    overlay.style.width = `${Math.max(0, right - left)}px`;
    overlay.style.height = `${Math.max(0, bottom - top)}px`;
    overlay.style.display = 'block';
}

function injectHighlightStyle() {
    if (document.getElementById('solid-devtools-style')) return;
    const s = document.createElement('style');
    s.id = 'solid-devtools-style';
    s.textContent = `
.solid-dev-updated{outline: 2px solid rgba(99,102,241,0.95);box-shadow:0 6px 18px rgba(99,102,241,0.12);transition:box-shadow .35s ease,outline .35s ease;animation:solid-pulse .9s ease}
@keyframes solid-pulse{0%{box-shadow:0 6px 18px rgba(99,102,241,0.22)}100%{box-shadow:0 6px 18px rgba(99,102,241,0.02)}}
`;
    document.head.appendChild(s);
}

/**
 * Attach a one-off snapshot logger to elements matching a selector
 */
export function attachSnapshotLogger(selector: string) {
    const handler = (e: MouseEvent) => {
        const target = (e.target as Element)?.closest?.(selector);
        if (!target) return;
        console.log('Solid Dev Snapshot (click)', createSnapshot());
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
}

export function installDevtools({ autoOpen = true, autoEnableInDev = true, highlightUpdates = true, autoBindSelector }: { autoOpen?: boolean; autoEnableInDev?: boolean; highlightUpdates?: boolean; autoBindSelector?: string } = {}) {
    // Determine dev mode
    const isDev = ((typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env && (globalThis as any).process.env.NODE_ENV !== 'production') || ((typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) as boolean));

    if (autoEnableInDev && isDev) {
        enableDevtools();
    }

    if (highlightUpdates) {
        injectHighlightStyle();
    }

    if (autoOpen && devtoolsExists() && !panel) {
        createPanel();
        renderSnapshot();
    } else if (autoOpen && !panel) {
        createPanel();
        renderSnapshot();
    }

    if (autoBindSelector) {
        attachSnapshotLogger(autoBindSelector);
    }
}

function devtoolsExists() {
    // Lightweight check — always true in browser
    return typeof document !== 'undefined' && !!document.body;
}

export function uninstallDevtools() {
    destroyPanel();
}
