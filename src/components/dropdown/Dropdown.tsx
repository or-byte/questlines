import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { createSignal, For } from "solid-js";

export type DropdownItem = {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type DropdownProps = {
  items: DropdownItem[];
  placeholder?: string;
  class?: string;
};

export default function Dropdown(props: DropdownProps) {
  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal<string | null>(null);

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenu.Trigger class={`border border-[var(--color-border-1)] rounded-[10px] h-[50px] w-full hover:cursor-pointer hover:border-[var(--color-accent-1)] ${props.class ?? ""}`}>
        <p class={`body-2 text-left pl-[15px] ${selected() ? "" : "text-gray-400"}`}>
          {selected() ?? props.placeholder ?? "Select an option"}
        </p>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="z-[51] bg-[var(--color-bg)] rounded-[5px] p-3 shadow-lg">
          <For each={props.items}>
            {(item) => (
              <DropdownMenu.Item
                disabled={item.disabled}
                onSelect={() => {
                  setSelected(item.label);
                  item.onSelect?.();
                }}
                class="hover:cursor-pointer p-2"
              >
                {item.label}
              </DropdownMenu.Item>
            )}
          </For>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  );
}