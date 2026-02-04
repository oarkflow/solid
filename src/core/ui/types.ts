// Shared types and interfaces for UI components

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type Position = 'top' | 'bottom' | 'left' | 'right';
export type Placement = 'top-start' | 'top' | 'top-end' | 'right-start' | 'right' | 'right-end' | 'bottom-end' | 'bottom' | 'bottom-start' | 'left-end' | 'left' | 'left-start';

/**
 * Type utility for values that can be either a static value or a reactive getter function.
 * This is the cornerstone of Velocity's fine-grained reactivity.
 */
export type MaybeReactive<T> = T | (() => T);

// Base component props
export interface BaseProps {
    className?: string; // Standard alias
    class?: string;     // Support class in JSX
    style?: Record<string, any>;
    id?: string;
    key?: any;          // Support key in JSX spreads
    children?: any;
}

// Common interactive props
export interface InteractiveProps {
    disabled?: boolean;
    onClick?: (event: MouseEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
}

// Loading state
export interface LoadingProps {
    loading?: boolean;
    loadingText?: string;
}

// Icon props
export interface IconProps {
    icon?: any;
    iconPosition?: 'left' | 'right';
}

// Validation props
export interface ValidationProps {
    error?: string;
    success?: boolean;
    warning?: string;
    helperText?: string;
    isValid?: boolean;
    isInvalid?: boolean;
}

// Form field props
export interface FormFieldProps extends BaseProps, ValidationProps {
    label?: string;
    name?: string;
    required?: boolean;
    disabled?: boolean;
}

// Modal/Overlay props
export interface OverlayProps extends BaseProps {
    open?: MaybeReactive<boolean>;
    onClose?: () => void;
    closeOnEscape?: boolean;
    closeOnOverlayClick?: boolean;
}

// Navigation item
export interface NavItem {
    label: string;
    href?: string;
    icon?: any;
    badge?: string | number;
    active?: boolean;
    onClick?: () => void;
    children?: NavItem[];
}

// Breadcrumb item
export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: any;
}

// Tab item
export interface TabItem {
    id: string;
    label: string;
    icon?: any;
    disabled?: boolean;
    content?: any;
}

// Table column
export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, row: any) => any;
}

// Select option
export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
    icon?: any;
}

// Dropdown item
export interface DropdownItem {
    id: string;
    label: string;
    icon?: any;
    disabled?: boolean;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}
