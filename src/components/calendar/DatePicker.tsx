import { createSignal, createEffect } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import SlotContainer from "../slot/SlotContainer";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function getDateDisplay(value: string) {
  const date = new Date(value);

  return {
    primary: date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    secondary: date.toLocaleDateString("en-US", {
      weekday: "short",
    }),
  };
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function DatePicker(props: DatePickerProps) {
  const isControlled = () => props.value !== undefined;

  const [internalValue, setInternalValue] = createSignal(todayISO());

  const value = () => (isControlled() ? props.value! : internalValue());

  let inputRef!: HTMLInputElement;

  createEffect(() => {
    props.onChange?.(value());
  });

  const handleChange = (next: string) => {
    if (!isControlled()) {
      setInternalValue(next);
    }
    props.onChange?.(next);
  };

  const display = () => getDateDisplay(value());

  return (
    <TextField class="w-full">
      <SlotContainer
        isSelected={true}
        onClick={() => inputRef.showPicker()}
      >
        <div class="flex w-full items-center justify-between">
          <span class="text-base font-medium">
            {display().primary}
          </span>
          <span class="text-sm text-[var(--color-text-muted)]">
            {display().secondary}
          </span>
        </div>
      </SlotContainer>

      <TextField.Input
        ref={inputRef}
        type="date"
        value={value()}
        onInput={(e) => handleChange(e.currentTarget.value)}
        class="absolute opacity-0 pointer-events-none"
      />
    </TextField>
  );
}
