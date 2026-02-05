import { X } from '@/core/icons';
import { signal, createEffect, onCleanup } from '../jsx-runtime';
import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface ToastProps extends BaseProps {
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'destructive';
    duration?: number;
    onClose?: () => void;
}

export function Toast(props: ToastProps) {
    const [isVisible, setIsVisible] = signal(true);

    createEffect(() => {
        const duration = props.duration !== undefined ? props.duration : 3000;
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => props.onClose?.(), 300); // Wait for animation
            }, duration);

            onCleanup(() => clearTimeout(timer));
        }
    });

    const variantClasses = {
        info: 'ui-info ui-mode-solid',
        success: 'ui-success ui-mode-solid',
        warning: 'ui-warning ui-mode-solid',
        destructive: 'ui-destructive ui-mode-solid',
    };

    return createElement('div', { style: { display: 'contents' } }, () =>
        isVisible() && (
            <div
                class={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ui-transition',
                    'animate-slide-in-right',
                    variantClasses[props.variant || 'info'],
                    props.class,
                    props.className
                )}
                role="alert"
            >
                <span class="flex-1">{props.message}</span>
                <button
                    class="ui-base ui-mode-ghost ui-size-xs-padding opacity-70 hover:opacity-100"
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => props.onClose?.(), 300);
                    }}
                    aria-label="Close notification"
                >
                    <X size={16} />
                </button>
            </div>
        )
    );
}

// Toast Container for managing multiple toasts
export interface ToastContainerProps extends BaseProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const [toasts, setToasts] = signal<Array<ToastProps & { id: string }>>([]);

export function showToast(toast: Omit<ToastProps, 'onClose'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, onClose: () => removeToast(id) } as any;
    setToasts([...toasts(), newToast]);
}

export function removeToast(id: string) {
    setToasts(toasts().filter(t => t.id !== id));
}

export function ToastContainer(props: ToastContainerProps) {
    const { position = 'top-right', className = '', ...rest } = props;

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    return (
        <div
            class={cn(
                'fixed z-50 flex flex-col gap-2 max-w-md',
                positionClasses[position],
                className
            )}
            {...rest}
        >
            {() => toasts().map(toast => {
                const { id, ...toastProps } = toast;
                return <Toast key={id} {...toastProps} />;
            })}
        </div>
    );
}
