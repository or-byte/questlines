import { ParentProps, JSX } from "solid-js";

type SlotContainerProps = ParentProps<{
    isSelected: boolean;
    onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
}>;

export default function SlotContainer(props: SlotContainerProps) {
    return (
        <div
            onClick={props.onClick}
            class={`
                flex items-center gap-[30px] py-5 px-6 rounded-[10px] w-full
                shadow-[0_4px_12px_rgba(0,0,0,0.05)]
                transition-all duration-200 cursor-pointer
                bg-[var(--color-bg-2)]
                border
                hover:border-[var(--color-accent-1)]
                ${props.isSelected ? "border-[var(--color-accent-1)]" : "border-transparent"}
            `}
        >
            {props.children}
        </div>
    );
}