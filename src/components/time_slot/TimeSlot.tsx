import SlotContainer from "../slot/SlotContainer";
import { MdRoundDelete } from 'solid-icons/md'
import { JSX, Show } from "solid-js";
import Button from "../button/Button";

interface TimeSlotProps {
    time: string;
    price: string;
    isSelected: boolean;
    isAvailable: boolean;
    isAdmin: boolean;
    onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
    onDelete?: JSX.EventHandler<HTMLDivElement, MouseEvent>;
}

export default function TimeSlot(props: TimeSlotProps) {
    return (
        <SlotContainer isSelected={props.isSelected} onClick={props.onClick} isAvailable={props.isAvailable} isAdmin={props.isAdmin}>
            <div class="flex flex-col items-start gap-3 sm:gap-4 lg:gap-[20px] w-full min-w-0">
                <div class="flex flex-col w-full min-w-0">
                    <p class="subheader-1 break-words overflow-wrap-anywhere text-justify">{props.time}</p>
                </div>
                <div class="flex flex-wrap items-center gap-1 sm:gap-2">
                    <p class="text-[var(--color-footer)] text-sm sm:text-base">{`₱${props.price}`}</p>
                </div>
                <div class={`${props.isAvailable ? 'bg-[var(--color-success-3)]/55' : "bg-[var(--color-footer)]/20"} rounded-[5px] px-2 py-1 inline-block`}>
                    <p class={`${props.isAvailable ? 'text-[var(--color-success-1)]' : "text-[var(--color-footer)]"} text-xs sm:text-sm whitespace-nowrap`}>
                        {props.isAvailable ? "Available" : "Booked"}</p>
                </div>
            </div>
            {/* Floating Delete Button */}
            <Show when={props.isAdmin && !props.isAvailable}>
                <Button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onDelete?.(e);
                    }}
                    class="
                        absolute top-2 right-2
                        w-8 h-8
                        flex items-center justify-center
                        rounded-full
                        bg-[var(--color-error-1)] text-white
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity duration-200
                        hover:scale-110
                        shadow-md
                        cursor-pointer
                        z-2
                    "
                >
                    ✕
                </Button>
            </Show>
        </SlotContainer>
    );
}