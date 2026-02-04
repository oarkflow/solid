import type { BaseProps, OverlayProps } from '../types';
import { Portal } from '../jsx-runtime';
import { cn } from '../utils';
import { X } from '@/core/icons';

export interface DrawerProps extends OverlayProps {
    title?: string;
    position?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
}

export function Drawer(props: DrawerProps) {
    const sizeClasses = {
        left: { sm: 'w-64', md: 'w-80', lg: 'w-96', xl: 'w-[32rem]', full: 'w-full' },
        right: { sm: 'w-64', md: 'w-80', lg: 'w-96', xl: 'w-[32rem]', full: 'w-full' },
        top: { sm: 'h-64', md: 'h-80', lg: 'h-96', xl: 'h-[32rem]', full: 'h-full' },
        bottom: { sm: 'h-64', md: 'h-80', lg: 'h-96', xl: 'h-[32rem]', full: 'h-full' },
    };

    const positionClasses = {
        left: 'inset-y-0 left-0',
        right: 'inset-y-0 right-0',
        top: 'inset-x-0 top-0',
        bottom: 'inset-x-0 bottom-0',
    };

    const handleOverlayClick = (e: MouseEvent) => {
        if (props.closeOnOverlayClick !== false && e.target === e.currentTarget) {
            props.onClose?.();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (props.closeOnEscape !== false && e.key === 'Escape') {
            props.onClose?.();
        }
    };

    const isOpen = () => typeof props.open === 'function' ? (props.open as any)() : props.open;
    const pos = () => (typeof props.position === 'function' ? (props.position as any)() : props.position) || 'right';

    return (
        <Portal>
            {() => isOpen() && (
                <div
                    class="fixed inset-0 z-50"
                    onClick={handleOverlayClick}
                    onKeyDown={handleKeyDown}
                    role="dialog"
                    aria-modal="true"
                >
                    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />

                    <div
                        class={() => {
                            const p = pos();
                            const s = (typeof props.size === 'function' ? (props.size as any)() : (props.size || 'md'));
                            return cn(
                                'fixed bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-xl overflow-y-auto',
                                (positionClasses as any)[p],
                                (sizeClasses as any)[p][s],
                                props.class,
                                props.className
                            );
                        }}
                    >
                        {(props.title || props.showCloseButton !== false) && (
                            <div class="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                                {props.title && (
                                    <h2 class="text-lg font-semibold">
                                        {props.title}
                                    </h2>
                                )}
                                {props.showCloseButton !== false && (
                                    <button
                                        class="ui-base ui-secondary ui-mode-ghost ui-size-sm-padding ml-auto"
                                        onClick={props.onClose}
                                        aria-label="Close drawer"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div class="px-6 py-4">
                            {props.children}
                        </div>
                    </div>
                </div>
            )}
        </Portal>
    );
}
