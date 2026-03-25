import { createSignal } from "solid-js";
import { Select } from "@kobalte/core/select";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

function TimeSelect(props: {
  options: string[];
  value: string;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      options={props.options}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      itemComponent={(itemProps) => (
        <Select.Item
          item={itemProps.item}
          class="flex items-center justify-center px-2 py-1 text-sm cursor-pointer rounded hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[selected]:font-semibold"
        >
          <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
        </Select.Item>
      )}
    >
      <Select.Trigger class="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
        <Select.Value<string>>{(state) => state.selectedOption()}</Select.Value>
        <Select.Icon>▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="z-50 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <Select.Listbox class="max-h-48 overflow-y-auto p-1" />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

function parseValue(value?: string) {
  if (!value?.includes(":")) return { hour: "12", minute: "00", period: "AM" };
  const [h, m] = value.split(":");
  const hour24 = parseInt(h);
  return {
    hour: String(hour24 % 12 === 0 ? 12 : hour24 % 12).padStart(2, "0"),
    minute: m,
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function toHour24(hour: string, period: string) {
  let h = parseInt(hour);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return String(h).padStart(2, "0");
}

export default function TimePicker(props: TimePickerProps) {
  const parsed = parseValue(props.value);
  const [hour, setHour] = createSignal(parsed.hour);
  const [minute, setMinute] = createSignal(parsed.minute);
  const [period, setPeriod] = createSignal(parsed.period);

  const emit = (h = hour(), m = minute(), p = period()) => {
    props.onChange?.(`${toHour24(h, p)}:${m}`);
  };

  return (
    <div class="w-full flex flex-col gap-2">
      {props.label && (
        <span class="body-2 text-gray-600 text-justify">{props.label}</span>
      )}
      <div class="flex items-center gap-2 w-full">
        <div class="flex-1">
          <TimeSelect options={HOURS} value={hour()} onChange={(v) => { setHour(v!); emit(v!); }} disabled={props.disabled} />
        </div>
        <span class="text-gray-400 font-medium">:</span>
        <div class="flex-1">
          <TimeSelect options={MINUTES} value={minute()} onChange={(v) => { setMinute(v!); emit(undefined, v!); }} disabled={props.disabled} />
        </div>
        <div class="flex-1">
          <TimeSelect options={PERIODS} value={period()} onChange={(v) => { setPeriod(v!); emit(undefined, undefined, v!); }} disabled={props.disabled} />
        </div>
      </div>
    </div>
  );
}