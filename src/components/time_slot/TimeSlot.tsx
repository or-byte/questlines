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
            <div class="flex flex-col items-start gap-[20px] w-full">
                <div class="flex flex-col">
                    <p class="subheader-1 whitespace-nowrap">{props.time}</p>
                </div>
                <div class="flex items-center gap-2">
                    <p class="text-[var(--color-footer)]">{`₱${props.price}`}</p>
                    <p class="body-3 text-[var(--color-footer)]">per hour</p>
                </div>
                <div class={`${statusColorBg} rounded-[5px] px-2 py-1`}>
                    <p class={statusColorText}>{availability}</p>
                </div>
            </div>
        </SlotContainer>
    )
}