import { onCleanup, onMount } from "solid-js";
import DatePicker from "@rnwonder/solid-date-picker";
import "@rnwonder/solid-date-picker/dist/style.css";
import "@rnwonder/solid-date-picker/themes/shad-cn-ui";

type PickerType = "single" | "range" | "multiple";


type DatePickerClientProps = {
  type?: PickerType;
  onChange?: (value: Date | Date[] | { start: Date; end: Date } | null) => void;
};

export default function DatePickerClient(props: DatePickerClientProps) {
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        const input = containerRef.querySelector("input");
        const popover =
          containerRef.querySelector("[data-open='true']") ??
          document.querySelector(".date-picker-container[data-open='true']");

        if (popover) input?.click();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() =>
      document.removeEventListener("mousedown", handleClickOutside)
    );
  });

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
    <div ref={containerRef}>
      <DatePicker
        type={props.type ?? "single"}
        shouldCloseOnSelect
        portalContainer={containerRef}
        backgroundColor="var(--color-bg)"
        onChange={handleChange}
      />
    </div>
  );
}