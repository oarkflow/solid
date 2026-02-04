import type { BaseProps } from '../types';
import { cn, getInitials } from '../utils';

export interface AvatarProps extends BaseProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    shape?: 'circle' | 'rounded';
    fallback?: any;
}

export function Avatar(props: AvatarProps) {
    const {
        src,
        alt = '',
        name = '',
        size = 'md',
        shape = 'circle',
        fallback,
        className = '',
        ...rest
    } = props;

    const classes = cn(
        'ui-avatar',
        `ui-avatar-${size}`,
        `ui-avatar-${shape}`,
        className
    );

    return (
        <div class={classes} {...rest}>
            {src ? (
                <img src={src} alt={alt} class="w-full h-full object-cover" />
            ) : (
                fallback || (name && getInitials(name)) || '?'
            )}
        </div>
    );
}

export interface AvatarGroupProps extends BaseProps {
    max?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup(props: AvatarGroupProps) {
    const {
        max = 3,
        size = 'md',
        children,
        className = '',
        ...rest
    } = props;

    return (
        <div class={cn('flex -space-x-2', className)} {...rest}>
            {children}
        </div>
    );
}
