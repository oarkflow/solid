import type { BaseProps, TabItem } from '../types';
import { cn } from '../utils';
import { signal } from '../jsx-runtime';

export interface TabsProps extends BaseProps {
    items: TabItem[];
    defaultActiveId?: string;
    activeId?: string;
    onTabChange?: (id: string) => void;
    variant?: 'line' | 'pills' | 'enclosed' | 'bordered';
    orientation?: 'horizontal' | 'vertical';
}

export function Tabs(props: TabsProps) {
    const [internalActiveId, setInternalActiveId] = signal(props.defaultActiveId || props.items[0]?.id || '');
    const currentActiveId = () => props.activeId !== undefined ? props.activeId : internalActiveId();

    const handleTabClick = (id: string) => {
        if (props.activeId === undefined) {
            setInternalActiveId(id);
        }
        props.onTabChange?.(id);
    };

    const variant = props.variant || 'bordered';
    const orientation = props.orientation || 'horizontal';

    const renderTabButton = (item: TabItem) => {
        const isActive = () => item.id === currentActiveId();

        const variantClasses = {
            line: (active: boolean) => cn(
                'px-4 py-2 border-b-2 transition-colors',
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            ),
            pills: (active: boolean) => cn(
                'ui-base',
                active ? 'ui-primary ui-mode-subtle' : 'ui-secondary ui-mode-ghost',
                'ui-size-sm-padding ui-size-sm-text'
            ),
            enclosed: (active: boolean) => cn(
                'px-4 py-2 border border-b-0 rounded-t-md transition-colors',
                active
                    ? 'bg-background text-foreground border-border'
                    : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground'
            ),
            bordered: (active: boolean) => cn(
                'rounded-none px-4 py-2 border-b-2 font-medium text-sm transition-all focus:outline-none',
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            ),
        };

        return (
            <button
                key={item.id}
                class={cn(variantClasses[variant as keyof typeof variantClasses](isActive()), "border-solid")}
                onClick={() => !item.disabled && handleTabClick(item.id)}
                disabled={item.disabled}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
            >
                <span class="flex items-center gap-2">
                    {item.icon && <span class="inline-flex">{item.icon}</span>}
                    <span>{item.label}</span>
                </span>
            </button>
        );
    };

    return (
        <div
            class={cn(
                orientation === 'vertical' && 'flex gap-4',
                props.className
            )}
        >
            <div
                class={cn(
                    orientation === 'horizontal' ? 'flex gap-1 border-b border-border' : 'flex flex-col gap-1',
                    variant === 'pills' && 'border-0'
                )}
                role="tablist"
                aria-orientation={orientation}
            >
                {() => props.items.map(item => renderTabButton(item))}
            </div>

            <div
                class="mt-4"
                role="tabpanel"
                id={() => `panel-${currentActiveId()}`}
                aria-labelledby={() => `tab-${currentActiveId()}`}
            >
                {() => props.items.find(item => item.id === currentActiveId())?.content}
            </div>
        </div>
    );
}
