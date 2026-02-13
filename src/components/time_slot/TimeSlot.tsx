import SlotContainer from "../slot/SlotContainer";
import { JSX } from "solid-js"

interface TimeSlotProps {
    time: string;
    price: string;
    isSelected: boolean;
    onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
}

export default function TimeSlot(props: TimeSlotProps) {
    return (
        <SlotContainer isSelected={props.isSelected} onClick={props.onClick}>
            <div class="flex flex-col items-start gap-[20px]">
                <p class="subheader-1">{props.time}</p>
                <p>{props.price}</p>
            </div>
        </SlotContainer>
    )
}