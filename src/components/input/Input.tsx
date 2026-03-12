import { TextField } from "@kobalte/core/text-field";
import type { TextFieldInputProps } from "@kobalte/core/text-field";

type InputProps = {
    label: string;
    important?: boolean;
    type?: string;
    placeholder?: string;
} & TextFieldInputProps;

export default function Input(props: InputProps) {
    return (
        <TextField class="flex flex-col gap-2 items-baseline w-full">
            <TextField.Label class="body-2 text-gray-600">
                {props.label}
                {props.important && (
                    <span class="ml-1">*</span>
                )}
            </TextField.Label>
            <TextField.Input
                {...props}
                type={props.type ?? "text"}
                placeholder={props.placeholder}
                required={props.important}
                aria-required={props.important}
                class="
                h-[50px] w-full rounded-lg border border-[var(--color-border-1)] px-3
                hover:border-[var(--color-accent-1)]
                data-[focused-visible]:outline-none data-[focused-visible]:ring-1 data-[focused-visible]:ring-[var(--color-accent-1)]
                invalid:border invalid:border-[var(--color-error-1)] invalid:ring-1 invalid:ring-[var(--color-error-1)]
                "
            />
        </TextField>
    );
}