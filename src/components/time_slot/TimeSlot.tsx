import SlotContainer from "../slot/SlotContainer";

interface TimeSlotProps {
    time: string;
    price: string;
    isSelected: boolean;
}

export default function TimeSlot(props: TimeSlotProps) {
    return (
        <SlotContainer isSelected={props.isSelected}>
            <div class="flex flex-col items-start gap-[20px]">
                <p class="subheader-1">{props.time}</p>
                <p>{props.price}</p>
            </div>
        </SlotContainer>
    )
}