import type { BaseProps } from '../types';
import { cn } from '../utils';
import { signal } from '../jsx-runtime';

export interface AccordionItemType {
    id: string;
    title: string;
    content: any;
    disabled?: boolean;
}

export interface AccordionProps extends BaseProps {
    items: AccordionItemType[];
    allowMultiple?: boolean;
    defaultOpenIds?: string[];
}

export function Accordion(props: AccordionProps) {
    const [openIds, setOpenIds] = signal<string[]>(props.defaultOpenIds || []);

    const toggleItem = (id: string) => {
        const currentOpenIds = openIds();
        if (props.allowMultiple) {
            setOpenIds(
                currentOpenIds.includes(id)
                    ? currentOpenIds.filter(openId => openId !== id)
                    : [...currentOpenIds, id]
            );
        } else {
            setOpenIds(currentOpenIds.includes(id) ? [] : [id]);
        }
    };

    return (
        <div
            class={cn('divide-y divide-[hsl(var(--border))] border border-[hsl(var(--border))] rounded-lg', props.className)}
        >
            {() => {
                console.log('[Accordion] rendering items:', props.items.length);
                return props.items.map((item) => {
                    const isOpen = () => openIds().includes(item.id);
                    return (
                        <div key={item.id} class="overflow-hidden">
                            <button
                                class={() => cn(
                                    'w-full flex items-center justify-between px-4 py-3 text-left font-medium',
                                    'hover:bg-[hsl(var(--muted)/0.5)] transition-colors',
                                    item.disabled && 'opacity-50 cursor-not-allowed'
                                )}
                                onClick={() => !item.disabled && toggleItem(item.id)}
                                disabled={item.disabled}
                                aria-expanded={isOpen as any}
                                aria-controls={`panel-${item.id}`}
                                id={`accordion-${item.id}`}
                            >
                                <span>{item.title}</span>
                                <span class={() => cn('transition-transform', isOpen() && 'rotate-180')}>
                                    ▼
                                </span>
                            </button>
                            {() => isOpen() && (
                                <div
                                    id={`panel-${item.id}`}
                                    role="region"
                                    aria-labelledby={`accordion-${item.id}`}
                                    class="px-4 py-3 bg-[hsl(var(--muted)/0.3)]"
                                >
                                    {item.content}
                                </div>
                            )}
                        </div>
                    );
                });
            }}
        </div>
    );
}
