import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface SkeletonProps extends BaseProps {
    width?: string;
    height?: string;
    rounded?: boolean;
    circle?: boolean;
}

export function Skeleton(props: SkeletonProps) {
    const {
        width,
        height = '1rem',
        rounded = true,
        circle = false,
        className = '',
        ...rest
    } = props;

    const style: Record<string, string> = {
        width: width || '100%',
        height,
    };

    const classes = cn(
        'ui-skeleton',
        circle && 'rounded-full',
        !circle && !rounded && 'rounded-none',
        className
    );

    return (
        <div
            class={classes}
            style={style}
            aria-busy="true"
            {...rest}
        />
    );
}
