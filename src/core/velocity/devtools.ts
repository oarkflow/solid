import { enableDevtools, getDevSnapshot, getComponentDeps } from './reactivity';
import { getDOMSnapshot, getElementById, getComponentsTree, getElementsForComponent, getComponentInstances } from './jsx';

// Search inputs (accessible from renderSnapshot)
let compSearchInput: HTMLInputElement | null = null;
let domSearchInput: HTMLInputElement | null = null;

let panel: HTMLDivElement | null = null;
let launcher: HTMLButtonElement | null = null;
let autoRefresh = false;
let refreshIntervalId: number | null = null;
let panelCollapsed = false;

function formatValue(value: any, max = 160) {
    let text = '';
    try {
        text = typeof value === 'string' ? value : JSON.stringify(value);
    } catch {
        try { text = String(value); } catch { text = '—'; }
    }
    if (!text) text = '—';
    if (text.length > max) return `${text.slice(0, max)}…`;
    return text;
}

function renderSnapshot() {
    if (!panel) return;
    const reactivityNode = panel.querySelector('#solid-devtools-reactivity') as HTMLElement | null;
    const instancesNode = panel.querySelector('#solid-devtools-instances') as HTMLElement | null;
    const componentsNode = panel.querySelector('#solid-devtools-components') as HTMLElement | null;
    if (!reactivityNode || !instancesNode || !componentsNode) return;

    const snapshot = createSnapshot();
    const componentNames = new Map<number, string>();
    getComponentInstances().forEach(instance => {
        componentNames.set(instance.id, instance.name || 'Anonymous');
    });

    // Render reactivity
    reactivityNode.innerHTML = '';
    const reactivity = snapshot.reactivity;

    const summary = document.createElement('div');
    summary.className = 'devtools-summary';

    const summaryItems = [
        { label: 'Enabled', value: reactivity.enabled ? 'Yes' : 'No' },
        { label: 'Signals', value: String(reactivity.signals.length) },
        { label: 'Effects', value: String(reactivity.effects.length) },
        { label: 'Pending', value: String(reactivity.pendingEffects) },
        { label: 'Batch', value: String(reactivity.batchDepth) },
    ];

    for (const item of summaryItems) {
        const card = document.createElement('div');
        card.className = 'devtools-summary-card';

        const label = document.createElement('div');
        label.className = 'devtools-summary-label';
        label.textContent = item.label;

        const value = document.createElement('div');
        value.className = 'devtools-summary-value';
        value.textContent = item.value;

        card.appendChild(label);
        card.appendChild(value);
        summary.appendChild(card);
    }

    const signalsSection = document.createElement('div');
    signalsSection.className = 'devtools-block';
    const signalsTitle = document.createElement('div');
    signalsTitle.className = 'devtools-section-title';
    signalsTitle.textContent = 'Signals';
    signalsSection.appendChild(signalsTitle);

    const signalsList = document.createElement('div');
    signalsList.className = 'devtools-list';
    const signalOwnerMap = new Map<number, string[]>();
    for (const entry of reactivity.components) {
        const name = componentNames.get(entry.id) ?? `Component #${entry.id}`;
        for (const sigId of entry.signals) {
            const list = signalOwnerMap.get(sigId) ?? [];
            list.push(name);
            signalOwnerMap.set(sigId, list);
        }
    }

    for (const signal of reactivity.signals) {
        const item = document.createElement('details');
        item.className = 'devtools-list-item';

        const header = document.createElement('summary');
        header.className = 'devtools-list-row';

        const name = document.createElement('span');
        name.className = 'devtools-tree-label';
        const owners = signalOwnerMap.get(signal.id) ?? [];
        const inferredName = owners.length ? `Signal in ${owners[0]}` : undefined;
        name.textContent = signal.name
            ? `${signal.name} (#${signal.id})`
            : inferredName
                ? `${inferredName} (#${signal.id})`
                : `signal #${signal.id}`;

        const meta = document.createElement('span');
        meta.className = 'devtools-tree-meta';
        meta.textContent = `r ${signal.reads} · w ${signal.writes}`;

        header.appendChild(name);
        header.appendChild(meta);
        item.appendChild(header);

        const body = document.createElement('div');
        body.className = 'devtools-details';
        body.textContent = `value: ${formatValue(signal.value)}\nused by: ${owners.join(', ') || '—'}`;
        item.appendChild(body);

        signalsList.appendChild(item);
    }
    signalsSection.appendChild(signalsList);

    const effectsSection = document.createElement('div');
    effectsSection.className = 'devtools-block';
    const effectsTitle = document.createElement('div');
    effectsTitle.className = 'devtools-section-title';
    effectsTitle.textContent = 'Effects';
    effectsSection.appendChild(effectsTitle);

    const effectsList = document.createElement('div');
    effectsList.className = 'devtools-list';
    for (const effect of reactivity.effects) {
        const item = document.createElement('details');
        item.className = 'devtools-list-item';

        const header = document.createElement('summary');
        header.className = 'devtools-list-row';

        const name = document.createElement('span');
        name.className = 'devtools-tree-label';
        const ownerName = effect.owner != null
            ? (componentNames.get(effect.owner) ?? `Component #${effect.owner}`)
            : '—';
        const effectLabel = effect.name || (ownerName !== '—' ? `Effect in ${ownerName}` : undefined);
        name.textContent = effectLabel ? `${effectLabel} (#${effect.id})` : `effect #${effect.id}`;

        const meta = document.createElement('span');
        meta.className = 'devtools-tree-meta';
        meta.textContent = `runs ${effect.runs}`;

        header.appendChild(name);
        header.appendChild(meta);
        item.appendChild(header);

        const body = document.createElement('div');
        body.className = 'devtools-details';
        const lastRun = effect.lastRun ? new Date(effect.lastRun).toLocaleTimeString() : '—';
        body.textContent = `owner: ${ownerName}\nlast run: ${lastRun}\nsignals: ${(effect.signals || []).join(', ') || '—'}`;
        item.appendChild(body);

        effectsList.appendChild(item);
    }
    effectsSection.appendChild(effectsList);

    reactivityNode.appendChild(summary);
    reactivityNode.appendChild(signalsSection);
    reactivityNode.appendChild(effectsSection);

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
    const comps = (() => {
        const instances = getComponentInstances();
        const byId = new Map<number, { id: number; name: string; renders: number; lastRender?: number; parentId?: number | null; children: Set<number> }>();
        const elementOwners = new Map<Element, number>();

        for (const inst of instances) {
            byId.set(inst.id, { ...inst, parentId: inst.parentId ?? null, children: new Set(inst.children ?? []) });
            const elIds = getElementsForComponent(inst.id);
            for (const elId of elIds) {
                const el = getElementById(elId);
                if (el) {
                    elementOwners.set(el, inst.id);
                }
            }
        }

        for (const inst of instances) {
            const meta = byId.get(inst.id);
            if (!meta || meta.parentId) continue;
            const elIds = getElementsForComponent(inst.id);
            if (!elIds.length) continue;
            const el = getElementById(elIds[0]);
            if (!el) continue;

            let parent: Element | null = el.parentElement;
            while (parent) {
                const parentId = elementOwners.get(parent);
                if (parentId && parentId !== inst.id) {
                    meta.parentId = parentId;
                    const parentMeta = byId.get(parentId);
                    if (parentMeta) parentMeta.children.add(inst.id);
                    break;
                }
                parent = parent.parentElement;
            }
        }

        const roots: any[] = [];
        for (const meta of byId.values()) {
            if (!meta.parentId) {
                roots.push(meta);
            }
        }

        const buildNode = (meta: { id: number; name: string; renders: number; updates?: number; lastRender?: number; children: Set<number> }): any => ({
            id: meta.id,
            name: meta.name,
            renders: meta.renders,
            updates: meta.updates ?? 0,
            lastRender: meta.lastRender,
            children: [...meta.children]
                .map(childId => byId.get(childId))
                .filter(Boolean)
                .map(child => buildNode(child!)),
        });

        return roots.map(root => buildNode(root));
    })();
    const compFilter = (compSearchInput && compSearchInput.value) ? compSearchInput.value.toLowerCase() : '';

    const matchesNode = (node: any) => !compFilter || node.name.toLowerCase().includes(compFilter);
    const nodeHasMatch = (node: any): boolean => {
        if (matchesNode(node)) return true;
        if (node.children) return node.children.some((child: any) => nodeHasMatch(child));
        return false;
    };

    function createCompDetails(node: any) {
        const details = document.createElement('div');
        details.className = 'devtools-details';

        try {
            const deps = getComponentDeps(node.id);
            const dev = getDevSnapshot();

            const sigs = deps.signals.map(id => dev.signals.find((s: any) => s.id === id));
            let sigHtml = '<div class="devtools-details-title">Signals</div>';
            if (sigs.length) {
                sigHtml += '<div class="devtools-details-list">' + sigs.map((s: any) => `${s?.name ?? 'sig#' + s.id}: ${JSON.stringify(s?.value)} (r:${s?.reads}, w:${s?.writes})`).join('<br/>') + '</div>';
            } else {
                sigHtml += '<div class="devtools-details-list">—</div>';
            }

            const effs = deps.effects.map(id => dev.effects.find((e: any) => e.id === id));
            let effHtml = '<div class="devtools-details-title">Effects</div>';
            if (effs.length) {
                effHtml += '<div class="devtools-details-list">' + effs.map((e: any) => `effect#${e.id}: last:${e.lastRun ? new Date(e.lastRun).toLocaleTimeString() : '—'}`).join('<br/>') + '</div>';
            } else {
                effHtml += '<div class="devtools-details-list">—</div>';
            }

            details.innerHTML = sigHtml + effHtml;
        } catch (err) { console.warn(err); }

        const elList = getElementsForComponent(node.id);
        const elements = document.createElement('div');
        elements.className = 'devtools-details-title';
        elements.textContent = 'Elements';
        const list = document.createElement('div');
        list.className = 'devtools-details-list';
        list.textContent = elList.join(', ') || '—';
        details.appendChild(elements);
        details.appendChild(list);

        return details;
    }

    function renderCompNode(node: any, container: HTMLElement, depth = 0) {
        if (!nodeHasMatch(node)) return;

        const hasChildren = Boolean(node.children && node.children.length);
        const wrapper = hasChildren ? document.createElement('details') : document.createElement('div');
        if (hasChildren) {
            (wrapper as HTMLDetailsElement).open = depth < 1;
        }
        wrapper.className = 'devtools-tree-node';

        const row = document.createElement(hasChildren ? 'summary' : 'div');
        row.className = 'devtools-tree-row';
        row.style.paddingLeft = `${depth * 12}px`;

        const label = document.createElement('span');
        label.textContent = `${node.name} (#${node.id})`;
        label.className = 'devtools-tree-label';

        const meta = document.createElement('span');
        const updateCount = node.updates ?? 0;
        meta.textContent = `renders ${node.renders} · updates ${updateCount}`;
        meta.className = 'devtools-tree-meta';

        row.appendChild(label);
        row.appendChild(meta);

        row.addEventListener('mouseenter', () => highlightComponentById(node.id));
        row.addEventListener('mouseleave', () => highlightElementById(undefined));

        const info = document.createElement('button');
        info.type = 'button';
        info.className = 'devtools-info';
        info.textContent = 'i';
        info.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const elIds = getElementsForComponent(node.id);
            if (elIds && elIds.length) {
                const el = getElementById(elIds[0]);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            const existing = wrapper.querySelector('.devtools-details');
            if (existing) {
                existing.remove();
            } else {
                wrapper.appendChild(createCompDetails(node));
            }
        };

        row.appendChild(info);

        wrapper.appendChild(row);

        if (hasChildren) {
            const childContainer = document.createElement('div');
            childContainer.className = 'devtools-tree-children';
            for (const child of node.children) renderCompNode(child, childContainer, depth + 1);
            wrapper.appendChild(childContainer);
        }

        container.appendChild(wrapper);
    }

    const treeRoot = document.createElement('div');
    treeRoot.className = 'devtools-tree';
    for (const root of comps) renderCompNode(root, treeRoot, 0);
    componentsNode.appendChild(treeRoot);

    // Instances panel (grouped by component name)
    instancesNode.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.style.fontWeight = '700';
    headerRow.style.marginBottom = '6px';
    headerRow.textContent = 'Custom Components (Instances)';
    instancesNode.appendChild(headerRow);

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

        const group = document.createElement('details');
        group.className = 'devtools-tree-node';
        group.open = true;

        const groupHeader = document.createElement('summary');
        groupHeader.className = 'devtools-tree-row';

        const left = document.createElement('span');
        left.textContent = `${name} (${arr.length})`;
        left.className = 'devtools-tree-label';

        const right = document.createElement('span');
        const totalRenders = arr.reduce((s, a) => s + a.renders, 0);
        const totalUpdates = arr.reduce((s, a) => s + (a.updates ?? 0), 0);
        right.textContent = `renders ${totalRenders} · updates ${totalUpdates}`;
        right.className = 'devtools-tree-meta';

        groupHeader.appendChild(left);
        groupHeader.appendChild(right);
        group.appendChild(groupHeader);

        const list = document.createElement('div');
        list.className = 'devtools-tree-children';

        for (const inst of arr) {
            const row = document.createElement('div');
            row.className = 'devtools-tree-row';
            row.style.paddingLeft = '12px';

            const label = document.createElement('span');
            label.textContent = `#${inst.id}`;
            label.className = 'devtools-tree-label';

            const meta = document.createElement('span');
            meta.textContent = `renders ${inst.renders} · updates ${inst.updates ?? 0}`;
            meta.className = 'devtools-tree-meta';

            row.appendChild(label);
            row.appendChild(meta);

            row.addEventListener('mouseenter', () => highlightComponentById(inst.id));
            row.addEventListener('mouseleave', () => highlightElementById(undefined));

            row.addEventListener('click', () => {
                const elements = getElementsForComponent(inst.id);
                if (elements && elements.length) {
                    const el = getElementById(elements[0]);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const pinned = el.getAttribute('data-dev-pinned') === '1';
                        if (pinned) { el.removeAttribute('data-dev-pinned'); el.classList.remove('solid-dev-pinned'); }
                        else { el.setAttribute('data-dev-pinned', '1'); el.classList.add('solid-dev-pinned'); }
                    }
                }
            });

            list.appendChild(row);
        }

        group.appendChild(list);
        instancesNode.appendChild(group);
    }

}

function createPanel() {
    panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.top = '72px';
    panel.style.bottom = '12px';
    panel.style.width = '360px';
    panel.style.maxWidth = 'calc(100% - 24px)';
    panel.style.maxHeight = 'calc(100% - 84px)';
    panel.style.boxSizing = 'border-box';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'hidden';
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
    logBtn.onclick = () => logSnapshot();
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

    const collapseBtn = document.createElement('button');
    collapseBtn.textContent = 'Collapse';
    Object.assign(collapseBtn.style, { marginRight: '6px', padding: '4px 8px' });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => destroyPanel();
    Object.assign(closeBtn.style, { padding: '4px 8px' });

    controls.appendChild(refreshBtn);
    controls.appendChild(logBtn);
    controls.appendChild(autoBtn);
    controls.appendChild(clearPinsBtn);
    controls.appendChild(focusPinsBtn);
    controls.appendChild(collapseBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '8px';
    content.style.overflow = 'auto';
    content.style.paddingRight = '4px';

    const tabs = document.createElement('div');
    tabs.className = 'devtools-tabs';

    const tabButtons = [
        { id: 'reactivity', label: 'Reactivity' },
        { id: 'components', label: 'Components' },
        { id: 'instances', label: 'Instances' },
    ].map(tab => {
        const btn = document.createElement('button');
        btn.textContent = tab.label;
        btn.className = 'devtools-tab';
        btn.setAttribute('data-tab', tab.id);
        tabs.appendChild(btn);
        return btn;
    });

    const reactivitySection = document.createElement('div');
    reactivitySection.id = 'solid-devtools-reactivity';
    reactivitySection.className = 'devtools-section';

    const componentsSection = document.createElement('div');
    componentsSection.id = 'solid-devtools-components';
    componentsSection.className = 'devtools-section';

    const compSearch = document.createElement('input');
    compSearch.placeholder = 'Search components...';
    compSearch.style.width = '100%';
    compSearch.style.padding = '6px';
    compSearch.style.marginBottom = '6px';
    componentsSection.appendChild(compSearch);
    compSearchInput = compSearch;

    const instancesSection = document.createElement('div');
    instancesSection.id = 'solid-devtools-instances';
    instancesSection.className = 'devtools-section';

    const domSearch = document.createElement('input');
    domSearch.placeholder = 'Search instances (name / id)...';
    domSearch.style.width = '100%';
    domSearch.style.padding = '6px';
    domSearch.style.marginBottom = '6px';
    instancesSection.appendChild(domSearch);
    domSearchInput = domSearch;
    // Append content sections
    content.appendChild(tabs);
    content.appendChild(reactivitySection);
    content.appendChild(componentsSection);
    content.appendChild(instancesSection);

    panel.appendChild(header);
    panel.appendChild(content);

    document.body.appendChild(panel);

    if (launcher) {
        launcher.style.display = 'none';
    }

    const setCollapsed = (next: boolean) => {
        panelCollapsed = next;
        if (!panel) return;
        if (panelCollapsed) {
            content.style.display = 'none';
            panel.style.height = 'auto';
            panel.style.maxHeight = 'none';
            panel.style.width = '220px';
            collapseBtn.textContent = 'Expand';
        } else {
            content.style.display = 'flex';
            panel.style.maxHeight = 'calc(100% - 84px)';
            panel.style.width = '360px';
            collapseBtn.textContent = 'Collapse';
        }
    };

    collapseBtn.onclick = () => setCollapsed(!panelCollapsed);
    setCollapsed(false);

    const setActiveTab = (tabId: string) => {
        const sections = panel!.querySelectorAll('.devtools-section');
        sections.forEach(section => {
            const show = section.id === `solid-devtools-${tabId}`;
            (section as HTMLElement).style.display = show ? 'block' : 'none';
        });
        tabButtons.forEach(btn => {
            const active = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('devtools-tab-active', active);
        });
    };

    tabButtons.forEach(btn => {
        btn.onclick = () => setActiveTab(btn.getAttribute('data-tab') || 'reactivity');
    });
    setActiveTab('components');

    injectDevtoolsUiStyle();

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
    if (launcher) {
        launcher.style.display = 'block';
    }
}

function createSnapshot() {
    return {
        reactivity: getDevSnapshot(),
        dom: getDOMSnapshot(),
    };
}

function logSnapshot() {
    const snapshot = createSnapshot();
    const componentNames = new Map<number, string>();
    getComponentInstances().forEach(instance => {
        componentNames.set(instance.id, instance.name || 'Anonymous');
    });
    const signalOwners = new Map<number, string[]>();
    for (const entry of snapshot.reactivity.components) {
        const name = componentNames.get(entry.id) ?? `Component #${entry.id}`;
        for (const sigId of entry.signals) {
            const list = signalOwners.get(sigId) ?? [];
            list.push(name);
            signalOwners.set(sigId, list);
        }
    }

    console.group('Velocity Devtools Snapshot');
    console.log('Summary', {
        enabled: snapshot.reactivity.enabled,
        signals: snapshot.reactivity.signals.length,
        effects: snapshot.reactivity.effects.length,
        pendingEffects: snapshot.reactivity.pendingEffects,
        batchDepth: snapshot.reactivity.batchDepth,
    });
    console.group('Signals');
    snapshot.reactivity.signals.forEach(signal => {
        const owners = signalOwners.get(signal.id) ?? [];
        const inferred = owners.length ? `Signal in ${owners[0]}` : undefined;
        const name = signal.name
            ? `${signal.name} (#${signal.id})`
            : inferred
                ? `${inferred} (#${signal.id})`
                : `signal #${signal.id}`;
        console.log(name, {
            reads: signal.reads,
            writes: signal.writes,
            value: signal.value,
            usedBy: signalOwners.get(signal.id) ?? [],
        });
    });
    console.groupEnd();
    console.group('Effects');
    snapshot.reactivity.effects.forEach(effect => {
        const ownerName = effect.owner != null
            ? (componentNames.get(effect.owner) ?? `Component #${effect.owner}`)
            : undefined;
        const effectLabel = effect.name || (ownerName ? `Effect in ${ownerName}` : undefined);
        const label = effectLabel ? `${effectLabel} (#${effect.id})` : `effect #${effect.id}`;
        console.log(label, {
            owner: ownerName,
            runs: effect.runs,
            lastRun: effect.lastRun ? new Date(effect.lastRun).toLocaleTimeString() : undefined,
            signals: effect.signals ?? [],
        });
    });
    console.groupEnd();
    console.groupEnd();
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

function injectDevtoolsUiStyle() {
    if (document.getElementById('solid-devtools-ui-style')) return;
    const s = document.createElement('style');
    s.id = 'solid-devtools-ui-style';
    s.textContent = `
.devtools-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
.devtools-tab{background:rgba(148,163,184,0.15);color:#e2e8f0;border:1px solid rgba(148,163,184,0.2);padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;}
.devtools-tab-active{background:rgba(99,102,241,0.35);border-color:rgba(99,102,241,0.6);color:#fff;}
.devtools-section{display:none;}
.devtools-section-title{font-weight:700;margin:6px 0 4px;font-size:11px;letter-spacing:.04em;text-transform:uppercase;opacity:.8;}
.devtools-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:8px;}
.devtools-summary-card{background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.2);border-radius:8px;padding:6px;}
.devtools-summary-label{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.04em;}
.devtools-summary-value{font-size:12px;font-weight:700;margin-top:2px;}
.devtools-block{margin-bottom:8px;}
.devtools-list{display:flex;flex-direction:column;gap:4px;}
.devtools-list-item{border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:rgba(15,23,42,0.35);}
.devtools-list-row{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;cursor:pointer;}
.devtools-tree{display:flex;flex-direction:column;gap:2px;}
.devtools-tree-node{margin:2px 0;border-radius:6px;}
.devtools-tree-row{display:flex;justify-content:space-between;align-items:center;padding:4px 6px;border-radius:6px;cursor:pointer;background:rgba(148,163,184,0.08);}
.devtools-tree-row:hover{background:rgba(148,163,184,0.16);}
.devtools-tree-label{font-weight:600;}
.devtools-tree-meta{opacity:.7;font-size:11px;}
.devtools-info{margin-left:8px;background:rgba(148,163,184,0.2);border:1px solid rgba(148,163,184,0.3);color:#e2e8f0;border-radius:6px;padding:0 6px;font-size:10px;cursor:pointer;}
.devtools-info:hover{background:rgba(148,163,184,0.35);}
.devtools-tree-children{display:flex;flex-direction:column;gap:2px;margin-top:2px;}
.devtools-details{margin:6px 0 6px 12px;padding:6px;border:1px solid rgba(148,163,184,0.2);border-radius:6px;background:rgba(15,23,42,0.35);}
.devtools-details-title{font-weight:600;margin-top:4px;}
.devtools-details-list{opacity:0.9;padding-left:6px;font-size:11px;}
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

    ensureLauncher();

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

function ensureLauncher() {
    if (launcher || !devtoolsExists()) return;
    launcher = document.createElement('button');
    launcher.textContent = 'Devtools';
    Object.assign(launcher.style, {
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        zIndex: '999998',
        padding: '8px 12px',
        borderRadius: '999px',
        border: '1px solid rgba(148,163,184,0.3)',
        background: 'rgba(15,23,42,0.9)',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px',
        boxShadow: '0 6px 14px rgba(15,23,42,0.35)',
    });
    launcher.onclick = () => {
        if (!panel) {
            createPanel();
            renderSnapshot();
        }
    };
    document.body.appendChild(launcher);
    if (panel) {
        launcher.style.display = 'none';
    }
}

// ============================================================================
// Performance Profiling - Phase 4 Enhancement
// ============================================================================

export interface ProfileEntry {
    type: 'signal-read' | 'signal-write' | 'effect-run' | 'computation' | 'reconcile' | 'render';
    name: string;
    startTime: number;
    duration: number;
    depth: number;
    metadata?: Record<string, any>;
}

export interface ProfileSession {
    startTime: number;
    endTime?: number;
    entries: ProfileEntry[];
    metrics: ProfileMetrics;
}

export interface ProfileMetrics {
    signalReads: number;
    signalWrites: number;
    effectRuns: number;
    computations: number;
    reconciliations: number;
    renders: number;
    totalDuration: number;
    avgUpdateTime: number;
    peakUpdateTime: number;
}

let currentSession: ProfileSession | null = null;
let profilerStack: { type: string; startTime: number; name: string }[] = [];
let updateTimes: number[] = [];

/**
 * Start a new profiling session
 */
export function startProfiler(): void {
    currentSession = {
        startTime: performance.now(),
        entries: [],
        metrics: {
            signalReads: 0,
            signalWrites: 0,
            effectRuns: 0,
            computations: 0,
            reconciliations: 0,
            renders: 0,
            totalDuration: 0,
            avgUpdateTime: 0,
            peakUpdateTime: 0
        }
    };
    profilerStack = [];
    updateTimes = [];
    console.log('[Velocity Profiler] Session started');
}

/**
 * Stop profiling and return session data
 */
export function stopProfiler(): ProfileSession | null {
    if (!currentSession) return null;

    currentSession.endTime = performance.now();
    currentSession.metrics.totalDuration = currentSession.endTime - currentSession.startTime;

    if (updateTimes.length > 0) {
        currentSession.metrics.avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        currentSession.metrics.peakUpdateTime = Math.max(...updateTimes);
    }

    const session = currentSession;
    currentSession = null;

    console.log('[Velocity Profiler] Session ended', {
        duration: `${session.metrics.totalDuration.toFixed(2)}ms`,
        entries: session.entries.length,
        metrics: session.metrics
    });

    return session;
}

/**
 * Record a profiling entry
 */
export function profileMark(type: ProfileEntry['type'], name: string, startTime?: number): () => void {
    if (!currentSession) return () => { };

    const start = startTime ?? performance.now();
    const depth = profilerStack.length;
    profilerStack.push({ type, startTime: start, name });

    return () => {
        const end = performance.now();
        const duration = end - start;
        profilerStack.pop();

        const entry: ProfileEntry = {
            type,
            name,
            startTime: start - currentSession!.startTime,
            duration,
            depth
        };

        currentSession!.entries.push(entry);

        // Update metrics
        switch (type) {
            case 'signal-read':
                currentSession!.metrics.signalReads++;
                break;
            case 'signal-write':
                currentSession!.metrics.signalWrites++;
                updateTimes.push(duration);
                break;
            case 'effect-run':
                currentSession!.metrics.effectRuns++;
                break;
            case 'computation':
                currentSession!.metrics.computations++;
                break;
            case 'reconcile':
                currentSession!.metrics.reconciliations++;
                updateTimes.push(duration);
                break;
            case 'render':
                currentSession!.metrics.renders++;
                break;
        }
    };
}

/**
 * Get current profiling session (for live monitoring)
 */
export function getProfilerSession(): ProfileSession | null {
    return currentSession;
}

/**
 * Generate flame graph data from profile entries
 */
export function generateFlameGraph(session: ProfileSession): FlameGraphNode {
    const root: FlameGraphNode = {
        name: 'root',
        value: session.metrics.totalDuration,
        children: []
    };

    // Group entries by depth and time
    const depthMap = new Map<number, ProfileEntry[]>();
    for (const entry of session.entries) {
        const arr = depthMap.get(entry.depth) || [];
        arr.push(entry);
        depthMap.set(entry.depth, arr);
    }

    // Build tree from entries
    for (const entry of session.entries.filter(e => e.depth === 0)) {
        const node = buildFlameNode(entry, session.entries);
        root.children.push(node);
    }

    return root;
}

export interface FlameGraphNode {
    name: string;
    value: number;
    children: FlameGraphNode[];
}

function buildFlameNode(entry: ProfileEntry, allEntries: ProfileEntry[]): FlameGraphNode {
    const endTime = entry.startTime + entry.duration;
    const children: FlameGraphNode[] = [];

    // Find direct children (entries at depth+1 that started during this entry)
    for (const other of allEntries) {
        if (other.depth === entry.depth + 1 &&
            other.startTime >= entry.startTime &&
            other.startTime + other.duration <= endTime) {
            children.push(buildFlameNode(other, allEntries));
        }
    }

    return {
        name: `${entry.type}: ${entry.name}`,
        value: entry.duration,
        children
    };
}

// ============================================================================
// Performance Timeline Export
// ============================================================================

/**
 * Export profile session as JSON for external analysis
 */
export function exportProfile(session: ProfileSession): string {
    return JSON.stringify({
        ...session,
        exported: new Date().toISOString(),
        version: '1.0.0'
    }, null, 2);
}

/**
 * Export profile as Chrome DevTools Performance format
 */
export function exportAsChromeTrace(session: ProfileSession): string {
    const events: any[] = [];
    const pid = 1;
    const tid = 1;

    for (const entry of session.entries) {
        // Duration event (X)
        events.push({
            name: entry.name,
            cat: entry.type,
            ph: 'X',
            ts: (session.startTime + entry.startTime) * 1000, // Chrome uses microseconds
            dur: entry.duration * 1000,
            pid,
            tid,
            args: entry.metadata || {}
        });
    }

    return JSON.stringify({
        traceEvents: events,
        displayTimeUnit: 'ms',
        systemTraceEvents: 'SystemTraceData',
        otherData: {
            version: 'Velocity Profiler v1.0'
        }
    });
}

// ============================================================================
// Reactive Update Tracking
// ============================================================================

let updateHistory: { timestamp: number; count: number; duration: number }[] = [];
const MAX_HISTORY = 100;

/**
 * Track a reactive update for timeline visualization
 */
export function trackUpdate(duration: number): void {
    const now = Date.now();
    updateHistory.push({ timestamp: now, count: 1, duration });

    if (updateHistory.length > MAX_HISTORY) {
        updateHistory.shift();
    }
}

/**
 * Get recent update history for timeline display
 */
export function getUpdateHistory(since?: number): typeof updateHistory {
    if (since) {
        return updateHistory.filter(u => u.timestamp >= since);
    }
    return [...updateHistory];
}

/**
 * Calculate updates per second over the history window
 */
export function getUpdatesPerSecond(): number {
    if (updateHistory.length < 2) return 0;

    const first = updateHistory[0].timestamp;
    const last = updateHistory[updateHistory.length - 1].timestamp;
    const windowMs = last - first;

    if (windowMs === 0) return 0;

    return (updateHistory.length / windowMs) * 1000;
}

/**
 * Get performance summary for DevTools display
 */
export function getPerformanceSummary(): {
    updatesPerSecond: number;
    avgUpdateTime: number;
    peakUpdateTime: number;
    totalUpdates: number;
} {
    const times = updateHistory.map(u => u.duration);
    return {
        updatesPerSecond: getUpdatesPerSecond(),
        avgUpdateTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        peakUpdateTime: times.length > 0 ? Math.max(...times) : 0,
        totalUpdates: updateHistory.length
    };
}
