import { createSignal, createMemo } from "solid-js";
import { Select } from "@kobalte/core/select";

interface TimePickerProps {
  value?: string; // "HH:MM" 24h format
  onChange?: (time: string) => void;
  label: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i === 0 ? 12 : i).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

export default function TimePicker(props: TimePickerProps) {
  // Parse incoming 24h value into parts
  const parseValue = () => {
    if (!props.value || typeof props.value !== "string" || !props.value.includes(":")) {
      return { hour: "12", minute: "00", period: "AM" };
    }
    const [h, m] = props.value.split(":");
    const hour24 = parseInt(h);
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return { hour: String(hour12).padStart(2, "0"), minute: m, period };
  };

  const [hour, setHour] = createSignal(parseValue().hour);
  const [minute, setMinute] = createSignal(parseValue().minute);
  const [period, setPeriod] = createSignal(parseValue().period);

  const emitChange = (h = hour(), m = minute(), p = period()) => {
    let hour24 = parseInt(h);
    if (p === "AM" && hour24 === 12) hour24 = 0;
    if (p === "PM" && hour24 !== 12) hour24 += 12;
    props.onChange?.(`${String(hour24).padStart(2, "0")}:${m}`);
  };

  const handleHour = (v: string | null) => {
    if (!v) return;
    setHour(v);
    emitChange(v);
  };

  const handleMinute = (v: string | null) => {
    if (!v) return;
    setMinute(v);
    emitChange(undefined, v);
  };

  const handlePeriod = (v: string | null) => {
    if (!v) return;
    setPeriod(v);
    emitChange(undefined, undefined, v);
  };

  return (
    <div class="w-full flex flex-col gap-2 sm:gap-3">
      {props.label && (
        <span class="body-2 text-gray-600 sm:min-w-[80px] text-left">
          {props.label}
        </span>
      )}

      <div class="flex w-full items-center gap-2">
        {/* Hour */}
        <div class="flex-1">
          <Select
            options={HOURS}
            value={hour()}
            onChange={handleHour}
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
            <Select.Trigger class="flex-1 min-w-[70px] flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              <Select.Value<string>>{(state) => state.selectedOption()}</Select.Value>
              <Select.Icon>▾</Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content class="z-50 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                <Select.Listbox class="max-h-48 overflow-y-auto p-1" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
        <span class="text-gray-400 font-medium">:</span>

        {/* Minute */}
        <div class="flex-1">
          <Select
            options={MINUTES}
            value={minute()}
            onChange={handleMinute}
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
            <Select.Trigger class="flex-1 min-w-[70px] flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              <Select.Value<string>>{(state) => state.selectedOption()}</Select.Value>
              <Select.Icon>▾</Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content class="z-50 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                <Select.Listbox class="max-h-48 overflow-y-auto p-1" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>

        {/* AM / PM */}
        <div class="flex-1">
          <Select
            options={PERIODS}
            value={period()}
            onChange={handlePeriod}
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
            <Select.Trigger class="flex-1 min-w-[80px] flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              <Select.Value<string>>{(state) => state.selectedOption()}</Select.Value>
              <Select.Icon>▾</Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content class="z-50 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                <Select.Listbox class="p-1" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
      </div>
    </div>
  );
}