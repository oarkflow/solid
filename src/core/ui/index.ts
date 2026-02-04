// UI Component Library - Central Exports
// All components are headless and use CSS variables for theming

// ========== JSX Runtime ==========
export * from './jsx-runtime';

// ========== Types & Utils ==========
export * from './types';
export * from './utils';

// ========== Buttons & Actions ==========
export { Button } from './buttons/Button';
export type { ButtonProps } from './buttons/Button';

// ========== Forms ==========
export { Input } from './forms/Input';
export type { InputProps } from './forms/Input';
export { Textarea } from './forms/Textarea';
export type { TextareaProps } from './forms/Textarea';
export { Select } from './forms/Select';
export type { SelectProps } from './forms/Select';
export { Checkbox, Radio } from './forms/Checkbox';
export type { CheckboxProps, RadioProps } from './forms/Checkbox';
export { Switch } from './forms/Switch';
export type { SwitchProps } from './forms/Switch';
export { FormGroup, Fieldset } from './forms/FormGroup';
export type { FormGroupProps, FieldsetProps } from './forms/FormGroup';

// ========== Data Display ==========
export { Card, CardHeader, CardBody, CardFooter } from './data-display/Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './data-display/Card';
export { Badge } from './data-display/Badge';
export type { BadgeProps } from './data-display/Badge';
export { Avatar, AvatarGroup } from './data-display/Avatar';
export type { AvatarProps, AvatarGroupProps } from './data-display/Avatar';
export { Table } from './data-display/Table';
export type { TableProps } from './data-display/Table';
export { Progress } from './data-display/Progress';
export type { ProgressProps } from './data-display/Progress';
export { Skeleton } from './data-display/Skeleton';
export type { SkeletonProps } from './data-display/Skeleton';
export { Divider } from './data-display/Divider';
export type { DividerProps } from './data-display/Divider';

// ========== Navigation ==========
export { Breadcrumbs } from './navigation/Breadcrumbs';
export type { BreadcrumbsProps } from './navigation/Breadcrumbs';
export { Pagination } from './navigation/Pagination';
export type { PaginationProps } from './navigation/Pagination';
export { Tabs } from './navigation/Tabs';
export type { TabsProps } from './navigation/Tabs';
export { Accordion } from './navigation/Accordion';
export type { AccordionProps, AccordionItemType } from './navigation/Accordion';

// ========== Alerts & Status ==========
export { Alert } from './alerts/Alert';
export type { AlertProps } from './alerts/Alert';

// ========== Layout ==========
export { Container, Section } from './layout/Container';
export type { ContainerProps, SectionProps } from './layout/Container';
export { Grid } from './layout/Grid';
export type { GridProps } from './layout/Grid';
export { Flex } from './layout/Flex';
export type { FlexProps } from './layout/Flex';
export { Stack } from './layout/Stack';
export type { StackProps } from './layout/Stack';

// ========== Overlays ==========
export { Modal } from './overlays/Modal';
export type { ModalProps } from './overlays/Modal';
export { Dropdown } from './overlays/Dropdown';
export type { DropdownProps } from './overlays/Dropdown';
export { Tooltip } from './overlays/Tooltip';
export type { TooltipProps } from './overlays/Tooltip';
export { Drawer } from './overlays/Drawer';
export type { DrawerProps } from './overlays/Drawer';

// ========== Feedback ==========
export { Toast, ToastContainer, showToast } from './feedback/Toast';
export type { ToastProps, ToastContainerProps } from './feedback/Toast';

// ========== Utility ==========
export { Spinner } from './utility/Spinner';
export type { SpinnerProps } from './utility/Spinner';
