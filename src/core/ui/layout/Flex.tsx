import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface FlexProps extends BaseProps {
    direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    wrap?: boolean | 'wrap' | 'wrap-reverse' | 'nowrap';
}

export function Flex(props: FlexProps) {
    const {
        direction = 'row',
        align,
        justify,
        gap = 'none',
        wrap = false,
        className = '',
        children,
        ...rest
    } = props;

    const directionClass = `flex-${direction}`;
    const alignClass = align ? `items-${align}` : '';
    const justifyClass = justify ? `justify-${justify}` : '';
    const gapClasses = {
        none: '',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
    };

    const wrapClass = typeof wrap === 'string' ? `flex-${wrap}` : wrap ? 'flex-wrap' : 'flex-nowrap';

    return (
        <div
            class={cn(
                'flex',
                directionClass,
                alignClass,
                justifyClass,
                gapClasses[gap],
                wrapClass,
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}
