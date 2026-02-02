import { enableDevtools, getDevSnapshot, getComponentDeps } from './reactivity';
import { getDOMSnapshot, getElementById, getComponentsTree, getElementsForComponent, getComponentInstances } from './jsx';

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

            // Component deps & detailed info
            try {
                const deps = getComponentDeps(node.id);
                const dev = getDevSnapshot();

                // Signals table
                const sigs = deps.signals.map(id => dev.signals.find((s: any) => s.id === id));
                let sigHtml = '<div style="margin-top:6px"><strong>Signals</strong></div>';
                if (sigs.length) {
                    sigHtml += '<div style="font-size:12px;padding-left:6px">' + sigs.map((s: any) => `${s?.name ?? 'sig#' + s.id}: ${JSON.stringify(s?.value)} (reads:${s?.reads}, writes:${s?.writes})`).join('<br/>') + '</div>';
                } else {
                    sigHtml += '<div style="font-size:12px;padding-left:6px">—</div>';
                }

                // Effects table
                const effs = deps.effects.map(id => dev.effects.find((e: any) => e.id === id));
                let effHtml = '<div style="margin-top:6px"><strong>Effects</strong></div>';
                if (effs.length) {
                    effHtml += '<div style="font-size:12px;padding-left:6px">' + effs.map((e: any) => `effect#${e.id}: lastRun:${e.lastRun ? new Date(e.lastRun).toLocaleTimeString() : '—'}`).join('<br/>') + '</div>';
                } else {
                    effHtml += '<div style="font-size:12px;padding-left:6px">—</div>';
                }

                details.innerHTML = sigHtml + effHtml;
            } catch (err) { console.warn(err); }

            // Elements
            const elList = getElementsForComponent(node.id);
            details.innerHTML += `<div style="margin-top:6px"><strong>Elements:</strong> ${elList.join(', ') || '—'}</div>`;


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

    // Custom Components panel (replaces raw DOM list)
    domNode.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.style.fontWeight = '700';
    headerRow.style.marginBottom = '6px';
    headerRow.textContent = 'Custom Components (Instances)';
    domNode.appendChild(headerRow);

    const instances = getComponentInstances();
    const grouped = new Map<string, any[]>();
    for (const inst of instances) {
        const name = inst.name || 'Anonymous';
        const arr = grouped.get(name) || [];
        arr.push(inst);
        grouped.set(name, arr);
    }

    const nameFilter = (domSearchInput && domSearchInput.value) ? domSearchInput.value.toLowerCase() : '';

    for (const [name, arr] of grouped) {
        if (nameFilter && name.toLowerCase().indexOf(nameFilter) === -1 && !arr.some(i => String(i.id).includes(nameFilter))) continue;

        const groupHeader = document.createElement('div');
        groupHeader.style.display = 'flex';
        groupHeader.style.justifyContent = 'space-between';
        groupHeader.style.padding = '6px';
        groupHeader.style.background = 'rgba(255,255,255,0.02)';
        groupHeader.style.marginBottom = '4px';

        const left = document.createElement('div');
        left.textContent = `${name} (${arr.length})`;
        left.style.fontWeight = '600';

        const right = document.createElement('div');
        right.textContent = `renders: ${arr.reduce((s, a) => s + a.renders, 0)}`;
        right.style.opacity = '0.85';

        groupHeader.appendChild(left);
        groupHeader.appendChild(right);

        domNode.appendChild(groupHeader);

        // Instances list
        for (const inst of arr) {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.paddingLeft = '12px';
            row.style.padding = '4px 6px';
            row.style.cursor = 'pointer';

            const label = document.createElement('div');
            label.textContent = `#${inst.id}`;

            const meta = document.createElement('div');
            meta.textContent = `renders:${inst.renders}`;
            meta.style.opacity = '0.85';

            row.appendChild(label);
            row.appendChild(meta);

            // hover highlights component elements
            row.addEventListener('mouseenter', () => highlightComponentById(inst.id));
            row.addEventListener('mouseleave', () => highlightElementById(undefined));

            // click expands details & jump
            row.addEventListener('click', () => {
                const elements = getElementsForComponent(inst.id);
                if (elements && elements.length) {
                    const el = getElementById(elements[0]);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // toggle pinned outline
                        const pinned = el.getAttribute('data-dev-pinned') === '1';
                        if (pinned) { el.removeAttribute('data-dev-pinned'); el.classList.remove('solid-dev-pinned'); }
                        else { el.setAttribute('data-dev-pinned', '1'); el.classList.add('solid-dev-pinned'); }
                    }
                }

                // Render details below row
                const details = document.createElement('div');
                details.style.fontSize = '12px';
                details.style.marginTop = '6px';
                details.style.paddingLeft = '6px';

                try {
                    const deps = getComponentDeps(inst.id);
                    const dev = getDevSnapshot();

                    const sigs = deps.signals.map(id => dev.signals.find((s: any) => s.id === id));
                    if (sigs.length) {
                        details.innerHTML = '<div style="font-weight:600">Signals</div>' + sigs.map((s: any) => `<div style="padding-left:6px">${s?.name ?? 'sig#' + s.id}: ${JSON.stringify(s?.value)} (r:${s?.reads}, w:${s?.writes})</div>`).join('');
                    } else {
                        details.innerHTML = '<div style="font-weight:600">Signals</div><div style="padding-left:6px">—</div>';
                    }

                    const effs = deps.effects.map(id => dev.effects.find((e: any) => e.id === id));
                    details.innerHTML += '<div style="margin-top:6px;font-weight:600">Effects</div>' + (effs.length ? '<div style="padding-left:6px">' + effs.map((e: any) => `effect#${e.id}: last:${e.lastRun ? new Date(e.lastRun).toLocaleTimeString() : '—'}`).join('<br/>') + '</div>' : '<div style="padding-left:6px">—</div>');
                } catch (err) { console.warn(err); }

                const elList = getElementsForComponent(inst.id);
                details.innerHTML += `<div style="margin-top:6px"><strong>Elements:</strong> ${elList.join(', ') || '—'}</div>`;

                // remove existing details if present
                const next = (row.nextElementSibling as HTMLElement | null);
                if (next && next.classList.contains('component-details')) next.remove();
                details.classList.add('component-details');
                row.after(details);
            });

            domNode.appendChild(row);
        }
    }

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

    const clearPinsBtn = document.createElement('button');
    clearPinsBtn.textContent = 'Clear Pins';
    clearPinsBtn.onclick = () => clearAllPins();
    Object.assign(clearPinsBtn.style, { marginRight: '6px', padding: '4px 8px' });

    const focusPinsBtn = document.createElement('button');
    focusPinsBtn.textContent = 'Focus Pins';
    focusPinsBtn.onclick = () => focusPinnedElement();
    Object.assign(focusPinsBtn.style, { marginRight: '6px', padding: '4px 8px' });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => destroyPanel();
    Object.assign(closeBtn.style, { padding: '4px 8px' });

    controls.appendChild(refreshBtn);
    controls.appendChild(logBtn);
    controls.appendChild(autoBtn);
    controls.appendChild(clearPinsBtn);
    controls.appendChild(focusPinsBtn);
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
.solid-dev-pinned{outline:3px solid rgba(236,72,153,0.95);box-shadow:0 10px 30px rgba(236,72,153,0.12);}
@keyframes solid-pulse{0%{box-shadow:0 6px 18px rgba(99,102,241,0.22)}100%{box-shadow:0 6px 18px rgba(99,102,241,0.02)}}
`;
    document.head.appendChild(s);
}

/**
 * Clear all pinned elements from the page (remove outline and attribute)
 */
function clearAllPins() {
    const pinned = document.querySelectorAll('[data-dev-pinned="1"]');
    pinned.forEach((el: Element) => {
        el.removeAttribute('data-dev-pinned');
        (el as HTMLElement).classList.remove('solid-dev-pinned');
    });
    renderSnapshot();
}

/**
 * Focus the first pinned element (scroll into view and flash highlight)
 */
function focusPinnedElement() {
    const el = document.querySelector('[data-dev-pinned="1"]') as HTMLElement | null;
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { }
    el.classList.add('solid-dev-updated');
    setTimeout(() => el.classList.remove('solid-dev-updated'), 900);
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
