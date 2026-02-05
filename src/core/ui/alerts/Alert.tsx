import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from '@/core/icons';
import { signal } from '../jsx-runtime';
import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface AlertProps extends BaseProps {
    variant?: 'info' | 'success' | 'warning' | 'destructive';
    dismissible?: boolean;
    onDismiss?: () => void;
}

export function Alert(props: AlertProps) {
    const [isVisible, setIsVisible] = signal(true);

    const handleDismiss = () => {
        setIsVisible(false);
        props.onDismiss?.();
    };

    const variant = props.variant || 'info';

    const Icon = {
        info: Info,
        success: CheckCircle,
        warning: AlertTriangle,
        destructive: AlertCircle,
    }[variant];

    return createElement('div', { style: { display: 'contents' } }, () =>
        isVisible() && (
            <div
                class={cn(
                    'ui-alert ui-transition p-4 rounded-lg flex items-start gap-3',
                    `ui-${variant}`,
                    'ui-mode-subtle',
                    props.class,
                    props.className
                )}
                role="alert"
            >
                <div class="mt-0.5 flex-shrink-0">
                    <Icon size={20} />
                </div>
                <div class="flex-1">{props.children}</div>
                {props.dismissible && (
                    <button
                        class="ui-base ui-mode-ghost opacity-70 hover:opacity-100 text-sm px-1 py-1 rounded-md"
                        onClick={handleDismiss}
                        aria-label="Dismiss alert"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        )
    );
}
