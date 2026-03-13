import DatePicker from "@rnwonder/solid-date-picker";
import "@rnwonder/solid-date-picker/dist/style.css";
import "@rnwonder/solid-date-picker/themes/shad-cn-ui";
import { MdFillCalendar_month } from 'solid-icons/md';
import Button from "../button/Button";

export default function DatePickerClient(props: any) {
  const handleChange = (data: any) => {
    if (!props.onChange) return;

    if (data.type === "single") {
      props.onChange(data.selectedDate ?? null);
    }

    if (data.type === "range") {
      props.onChange(
        data.startDate && data.endDate
          ? { start: data.startDate, end: data.endDate }
          : null
      );
    }

    if (data.type === "multiple") {
      props.onChange(data.multipleDates ?? []);
    }
  };
  return (
    <DatePicker
      type={props.type ?? "single"}
      shouldCloseOnSelect
      backgroundColor="var(--color-bg)"
      inputWrapperWidth={"100%"}
      onChange={handleChange}
      renderInput={({ value, showDate }) => {
        return (
          <div class="relative w-full">
            <input
              readOnly
              onClick={showDate}
              value={value().label}
              placeholder="Choose Date"
              class="w-full rounded-[10px] bg-[var(--color-bg-2)] px-4 py-3 pr-14 placeholder:text-gray-400 focus:outline-none cursor-pointer border border-[var(--color-accent-1)]"
            />

            <button
              type="button"
              onClick={showDate}
              class="absolute right-5 top-1/2 -translate-y-1/2 hover:cursor-pointer"
            >
              <MdFillCalendar_month size={20} color="var(--color-accent-1)" />
            </button>
          </div>
        )
      }}
    />
  );
}