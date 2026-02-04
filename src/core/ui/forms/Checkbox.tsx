import type { BaseProps } from '../types';
import { cn } from '../utils';

export interface CheckboxProps extends BaseProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange?: (event: Event) => void;
}

export function Checkbox(props: CheckboxProps) {
    const checkboxElement = (
        <input
            type="checkbox"
            id={props.id}
            name={props.name}
            value={props.value}
            checked={() => props.checked}
            defaultChecked={props.defaultChecked}
            disabled={props.disabled}
            class={cn('ui-checkbox', props.className)}
            onChange={props.onChange}
        />
    );

    if (props.label) {
        return (
            <label class="inline-flex items-center gap-2 cursor-pointer">
                {checkboxElement}
                <span class="select-none">{props.label}</span>
            </label>
        );
    }

    return checkboxElement;
}

export interface RadioProps extends BaseProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    value: string;
    label?: string;
    onChange?: (event: Event) => void;
}

export function Radio(props: RadioProps) {
    const radioElement = (
        <input
            type="radio"
            id={props.id}
            name={props.name}
            value={props.value}
            checked={() => props.checked}
            defaultChecked={props.defaultChecked}
            disabled={props.disabled}
            class={cn('ui-radio', props.className)}
            onChange={props.onChange}
        />
    );

    if (props.label) {
        return (
            <label class="inline-flex items-center gap-2 cursor-pointer">
                {radioElement}
                <span class="select-none">{props.label}</span>
            </label>
        );
    }

    return radioElement;
}
