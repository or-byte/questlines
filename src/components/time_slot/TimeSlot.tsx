import SlotContainer from "../slot/SlotContainer";
import { JSX } from "solid-js"

interface TimeSlotProps {
    time: string;
    price: string;
    isSelected: boolean;
    isAvailable: boolean;
    onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
}

export default function TimeSlot(props: TimeSlotProps) {
    const statusColorBg = props.isAvailable ? 'bg-[var(--color-success-3)]/55' : "bg-[var(--color-footer)]/20";
    const availability = props.isAvailable ? "Available" : "Booked";
    const statusColorText = props.isAvailable ? 'text-[var(--color-success-1)]' : "text-[var(--color-footer)]";

    return (
        <SlotContainer isSelected={props.isSelected} onClick={props.onClick} isAvailable={props.isAvailable}>
            <div class="flex flex-col items-start gap-3 sm:gap-4 lg:gap-[20px] w-full min-w-0">
                <div class="flex flex-col w-full min-w-0">
                    <p class="subheader-1 break-words overflow-wrap-anywhere text-justify">{props.time}</p>
                </div>
                <div class="flex flex-wrap items-center gap-1 sm:gap-2">
                    <p class="text-[var(--color-footer)] text-sm sm:text-base">{`₱${props.price}`}</p>
                    <p class="body-3 text-[var(--color-footer)] text-xs sm:text-sm whitespace-nowrap text-justify">per hour</p>
                </div>
                <div class={`${statusColorBg} rounded-[5px] px-2 py-1 inline-block`}>
                    <p class={`${statusColorText} text-xs sm:text-sm whitespace-nowrap`}>{availability}</p>
                </div>
            </div>
        </SlotContainer>
    );
}