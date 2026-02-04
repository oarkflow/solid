import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface CardProps extends BaseProps {
    hover?: boolean;
    shadowSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Card(props: CardProps) {
    const {
        className = '',
        hover = false,
        shadowSize,
        children,
        ...rest
    } = props;

    const classes = cn(
        'ui-card',
        shadowSize && `ui-shadow-${shadowSize}`,
        hover && 'ui-transition hover:shadow-lg',
        className
    );

    return (
        <div class={classes} {...rest}>
            {children}
        </div>
    );
}

export interface CardHeaderProps extends BaseProps { }

export function CardHeader(props: CardHeaderProps) {
    const { className = '', children, ...rest } = props;
    return (
        <div class={cn('ui-card-header', className)} {...rest}>
            {children}
        </div>
    );
}

export interface CardBodyProps extends BaseProps { }

export function CardBody(props: CardBodyProps) {
    const { className = '', children, ...rest } = props;
    return (
        <div class={cn('ui-card-body', className)} {...rest}>
            {children}
        </div>
    );
}

export interface CardFooterProps extends BaseProps { }

export function CardFooter(props: CardFooterProps) {
    const { className = '', children, ...rest } = props;
    return (
        <div class={cn('ui-card-footer', className)} {...rest}>
            {children}
        </div>
    );
}
