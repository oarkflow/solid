import type { BaseProps, OverlayProps } from '../types';
import { Portal } from '../jsx-runtime';
import { cn } from '../utils';
import { X } from '@/core/icons';

export interface ModalProps extends OverlayProps {
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
}

export function Modal(props: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4',
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

    return (
        <Portal>
            {() => isOpen() && (
                <div
                    class="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleOverlayClick}
                    onKeyDown={handleKeyDown}
                    role="dialog"
                    aria-modal="true"
                >
                    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        class={() => {
                            const s = (typeof props.size === 'function' ? (props.size as any)() : props.size) || 'md';
                            return cn(
                                'relative w-full bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] rounded-lg shadow-xl',
                                (sizeClasses as any)[s],
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
                                        class="ui-base ui-secondary ui-mode-ghost ui-size-sm-padding"
                                        onClick={props.onClose}
                                        aria-label="Close modal"
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
