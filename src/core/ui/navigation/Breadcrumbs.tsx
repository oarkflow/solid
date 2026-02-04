import { type BaseProps, type BreadcrumbItem, type MaybeReactive } from '../types';
import { cn } from '../utils';

export interface BreadcrumbsProps extends BaseProps {
    items: MaybeReactive<BreadcrumbItem[]>;
    separator?: string | any;
}

export function Breadcrumbs(props: BreadcrumbsProps) {
    const separator = props.separator || '/';

    return (
        <nav
            class={() => cn('flex items-center gap-2 text-sm', props.class, props.className)}
            aria-label="Breadcrumb"
        >
            {() => {
                const items = typeof props.items === 'function' ? (props.items as any)() : (props.items || []);
                return items.map((item: BreadcrumbItem, index: number) => {
                    const isLast = index === items.length - 1;

                    return (
                        <div key={index} class="flex items-center gap-2">
                            {item.icon && <span class="inline-flex">{item.icon}</span>}
                            {item.href && !isLast ? (
                                <a
                                    href={item.href}
                                    class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ui-transition"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <span
                                    class={isLast ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            )}
                            {!isLast && (
                                <span class="text-[hsl(var(--muted-foreground))]">
                                    {separator}
                                </span>
                            )}
                        </div>
                    );
                });
            }}
        </nav>
    );
}
