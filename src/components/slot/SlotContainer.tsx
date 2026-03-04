import { ParentProps, JSX, Show } from "solid-js";

type SlotContainerProps = ParentProps<{
  isSelected: boolean;
  isAvailable: boolean;
  isAdmin: boolean;
  onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
  onDelete?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}>;

export default function SlotContainer(props: SlotContainerProps) {
  return (
    <div
      onClick={props.onClick}
      class={`
                relative group
                flex items-center gap-3 sm:gap-5 lg:gap-[30px] 
                py-3 sm:py-4 lg:py-5 
                px-4 sm:px-5 lg:px-6 
                rounded-[10px] w-full
                shadow-[0_4px_12px_rgba(0,0,0,0.05)]
                transition-all duration-200 cursor-pointer
                bg-[var(--color-bg-2)]
                border
                ${props.isAvailable || props.isAdmin
          ? "hover:border-[var(--color-accent-1)] active:scale-[0.98]"
          : "opacity-50 cursor-not-allowed pointer-events-none"}
                ${props.isSelected
          ? "border-[var(--color-accent-1)]"
          : "border-transparent"}
            `}
    >
      {props.children}
    </div>
  );
}
