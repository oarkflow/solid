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

    return createElement('div', { style: { display: 'contents' } }, () =>
        isVisible() && (
            <div
                class={cn(
                    'ui-alert ui-transition p-4 rounded-lg flex items-start gap-3',
                    `ui-${props.variant || 'info'}`,
                    'ui-mode-subtle',
                    props.class,
                    props.className
                )}
                role="alert"
            >
                <div class="flex-1">{props.children}</div>
                {props.dismissible && (
                    <button
                        class="ui-base ui-mode-ghost opacity-70 hover:opacity-100 text-sm px-2"
                        onClick={handleDismiss}
                        aria-label="Dismiss alert"
                    >
                        ×
                    </button>
                )}
            </div>
        )
    );
}
