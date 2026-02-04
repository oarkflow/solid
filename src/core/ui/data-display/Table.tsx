import type { BaseProps, TableColumn } from '../types';
import { cn } from '../utils';

export interface TableProps extends BaseProps {
    columns: TableColumn[];
    data: any[];
    striped?: boolean;
    hoverable?: boolean;
    bordered?: boolean;
    compact?: boolean;
}

export function Table(props: TableProps) {
    const {
        columns,
        data,
        striped = false,
        hoverable = true,
        bordered = false,
        compact = false,
        className = '',
        ...rest
    } = props;

    return (
        <div class={cn('overflow-x-auto', className)}>
            <table
                class={cn(
                    'w-full',
                    bordered && 'border border-[hsl(var(--border))]'
                )}
                {...rest}
            >
                <thead class="bg-[hsl(var(--muted))]">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                class={cn(
                                    'text-left font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider',
                                    compact ? 'px-3 py-2' : 'px-4 py-3',
                                    col.align === 'center' && 'text-center',
                                    col.align === 'right' && 'text-right'
                                )}
                                style={col.width ? { width: col.width } : {}}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr
                            key={rowIdx}
                            class={cn(
                                striped && rowIdx % 2 === 0 && 'bg-[hsl(var(--muted)/0.3)]',
                                hoverable && 'hover:bg-[hsl(var(--muted)/0.5)] transition-colors'
                            )}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={colIdx}
                                    class={cn(
                                        'border-t border-[hsl(var(--border))]',
                                        compact ? 'px-3 py-2' : 'px-4 py-3',
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right'
                                    )}
                                >
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
