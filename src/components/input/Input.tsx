import { TextField } from "@kobalte/core/text-field";
import type { TextFieldInputProps } from "@kobalte/core/text-field";
import { splitProps } from "solid-js";

type InputProps = {
    label: string;
    important?: boolean;
    type?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
} & TextFieldInputProps;

export default function Input(props: InputProps) {
    const [local, rest] = splitProps(props, ["label", "important", "type", "placeholder", "onChange"]);

    return (
        <TextField class="flex flex-col gap-2 items-baseline w-full" onChange={local.onChange}>
            <TextField.Label class="body-2 text-gray-600">
                {local.label}
                {local.important && (
                    <span class="ml-1">*</span>
                )}
            </TextField.Label>
            <TextField.Input
                {...rest}
                type={local.type ?? "text"}
                placeholder={local.placeholder}
                required={local.important}
                aria-required={local.important}
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