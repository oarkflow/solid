import { createElement as h, type JSX } from '@/core/velocity';

export interface IconProps {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
    fill?: string;
    className?: string; // Standard alias
    class?: string;     // Support class in JSX
    style?: string | Record<string, string | number>;
    absoluteStrokeWidth?: boolean;
    children?: any;
    // Allow any other svg props
    [key: string]: any;
}

export interface IconNode {
    tag: string;
    attr: Record<string, string | number>;
    child?: IconNode[];
}

export type IconDefinition = IconNode[];

export type IconComponent = (props: IconProps) => JSX.Element;

/**
 * Default icon configuration
 */
export const defaultIconProps = {
    size: 24,
    strokeWidth: 2,
    color: 'currentColor',
    fill: 'none',
};

/**
 * Creates an SVG element from icon definition
 */
export function createIcon(
    iconName: string,
    iconDefinition: IconDefinition
): IconComponent {
    return (props: IconProps) => {
        const {
            size = defaultIconProps.size,
            strokeWidth = defaultIconProps.strokeWidth,
            color = defaultIconProps.color,
            fill = defaultIconProps.fill,
            className,
            class: clazz, // Extract class specifically
            style,
            absoluteStrokeWidth,
            children,
            ...rest
        } = props;

        // Calculate stroke width if absoluteStrokeWidth is enabled
        const computedStrokeWidth = absoluteStrokeWidth
            ? Number(strokeWidth) * 24 / Number(size)
            : strokeWidth;

        // Combine class names
        const combinedClass = [className, clazz].filter(Boolean).join(' ');

        // Recursively render icon nodes
        const renderNode = (node: IconNode): JSX.Element => {
            const nodeChildren = node.child?.map(renderNode);
            return h(node.tag as any, node.attr, nodeChildren);
        };

        const iconContent = iconDefinition.map(renderNode);

        return h(
            'svg',
            {
                xmlns: "http://www.w3.org/2000/svg",
                width: size,
                height: size,
                viewBox: "0 0 24 24",
                fill: fill,
                stroke: color,
                "stroke-width": computedStrokeWidth,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                class: combinedClass,
                style: style,
                "data-icon": iconName,
                ...rest
            },
            iconContent,
            children
        );
    };
}

/**
 * Helper function to create multiple icons at once
 */
export function createIcons(
    definitions: Record<string, IconDefinition>
): Record<string, IconComponent> {
    const icons: Record<string, IconComponent> = {};

    for (const [name, definition] of Object.entries(definitions)) {
        icons[name] = createIcon(name, definition);
    }

    return icons;
}

/**
 * Utility to parse SVG path data into icon definition
 */
export function pathToIconNode(d: string, attrs: Record<string, string | number> = {}): IconNode {
    return {
        tag: 'path',
        attr: { d, ...attrs },
    };
}

/**
 * Utility to create circle icon node
 */
export function circleToIconNode(
    cx: number,
    cy: number,
    r: number,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'circle',
        attr: { cx, cy, r, ...attrs },
    };
}

/**
 * Utility to create line icon node
 */
export function lineToIconNode(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'line',
        attr: { x1, y1, x2, y2, ...attrs },
    };
}

/**
 * Utility to create rect icon node
 */
export function rectToIconNode(
    x: number,
    y: number,
    width: number,
    height: number,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'rect',
        attr: { x, y, width, height, ...attrs },
    };
}

/**
 * Utility to create polyline icon node
 */
export function polylineToIconNode(
    points: string,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'polyline',
        attr: { points, ...attrs },
    };
}

/**
 * Utility to create polygon icon node
 */
export function polygonToIconNode(
    points: string,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'polygon',
        attr: { points, ...attrs },
    };
}

/**
 * Utility to create ellipse icon node
 */
export function ellipseToIconNode(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    attrs: Record<string, string | number> = {}
): IconNode {
    return {
        tag: 'ellipse',
        attr: { cx, cy, rx, ry, ...attrs },
    };
}
