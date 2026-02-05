import { ChevronDown, ChevronLeft, ChevronRight } from '@/core/icons';
import { type BaseProps, type MaybeReactive } from '../types';
import { cn } from '../utils';

export interface PaginationProps extends BaseProps {
    currentPage: MaybeReactive<number>;
    totalPages: MaybeReactive<number>;
    onPageChange: (page: number) => void;
    showPrevNext?: boolean;
    maxVisible?: number;
}

export function Pagination(props: PaginationProps) {
    const currentPage = () => typeof props.currentPage === 'function' ? (props.currentPage as any)() : props.currentPage;
    const totalPages = () => typeof props.totalPages === 'function' ? (props.totalPages as any)() : props.totalPages;
    const maxVisible = () => props.maxVisible || 7;
    const showPrevNext = () => props.showPrevNext !== undefined ? props.showPrevNext : true;

    const getPages = () => {
        const pages: number[] = [];
        let startPage = Math.max(1, currentPage() - Math.floor(maxVisible() / 2));
        let endPage = Math.min(totalPages(), startPage + maxVisible() - 1);

        if (endPage - startPage + 1 < maxVisible()) {
            startPage = Math.max(1, endPage - maxVisible() + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return { pages, startPage, endPage };
    };

    const renderPageButton = (page: number, isCurrent: boolean) => {
        return (
            <button
                key={page}
                class={() => cn(
                    'ui-base',
                    isCurrent ? 'ui-primary ui-mode-solid' : 'ui-secondary ui-mode-ghost',
                    'ui-size-sm-padding',
                    'ui-size-sm-text'
                )}
                onClick={() => !isCurrent && props.onPageChange(page)}
                disabled={isCurrent}
                aria-label={`Page ${page}`}
                aria-current={isCurrent ? 'page' : undefined}
            >
                {page}
            </button>
        );
    };

    return createElement('div', { style: { display: 'contents' } }, () => {
        const { pages, startPage, endPage } = getPages();
        const curr = currentPage();
        const total = totalPages();

        return (
            <nav
                class={cn('flex items-center gap-1', props.class, props.className)}
                aria-label="Pagination"
            >
                {showPrevNext() && (
                    <button
                        class="ui-base ui-secondary ui-mode-ghost ui-size-sm-padding ui-size-sm-text"
                        onClick={() => props.onPageChange(curr - 1)}
                        disabled={curr === 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}

                {startPage > 1 && (
                    <>
                        {renderPageButton(1, false)}
                        {startPage > 2 && <span class="px-2">...</span>}
                    </>
                )}

                {pages.map(page => renderPageButton(page, page === curr))}

                {endPage < total && (
                    <>
                        {endPage < total - 1 && <span class="px-2">...</span>}
                        {renderPageButton(total, false)}
                    </>
                )}

                {showPrevNext() && (
                    <button
                        class="ui-base ui-secondary ui-mode-ghost ui-size-sm-padding ui-size-sm-text"
                        onClick={() => props.onPageChange(curr + 1)}
                        disabled={curr === total}
                        aria-label="Next page"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
            </nav>
        );
    });
}
