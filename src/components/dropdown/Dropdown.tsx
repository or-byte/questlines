import { createSignal, For, onCleanup } from "solid-js";

export type DropdownItem = {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type DropdownProps = {
  items: DropdownItem[];
  placeholder?: string;
  class?: string;
  onSelect?: (item: DropdownItem) => void;
};

export default function Dropdown(props: DropdownProps) {
  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal<string | null>(null);

  let ref: HTMLDivElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    if (ref && !ref.contains(e.target as Node)) setOpen(false);
  };

  document.addEventListener("mousedown", handleClickOutside);
  onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));

  return (
    <div ref={ref} class={`relative w-full ${props.class ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        class="border border-[var(--color-border-1)] rounded-[10px] h-[50px] w-full hover:cursor-pointer hover:border-[var(--color-accent-1)]"
      >
        <p class={`body-2 text-left pl-[15px] ${selected() ? "" : "text-gray-400"}`}>
          {selected() ?? props.placeholder ?? "Select an option"}
        </p>
      </button>

      {open() && (
        <div class="absolute left-0 right-0 mt-1 z-[51] bg-[var(--color-bg)] rounded-[5px] p-3 shadow-lg">
          <For each={props.items}>
            {(item) => (
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setSelected(item.label);
                  item.onSelect?.();
                  props.onSelect?.(item);
                  setOpen(false);
                }}
                class="w-full text-left hover:cursor-pointer p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      )}
    </div>
  );
}