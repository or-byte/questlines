import SlotContainer from "../slot/SlotContainer";
import { JSX } from "solid-js";

interface CourtCardProps {
    title: string;
    isSelected: boolean;
    thumbnail: string;
    onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
};

export default function CourtCard(props: CourtCardProps) {
    return (
        <SlotContainer isSelected={props.isSelected} onClick={props.onClick} isAvailable={true}>
            <img src={props.thumbnail} alt="court thumbail" class="w-16 h-10 sm:w-20 sm:h-14 object-cover rounded-md"></img>
            <div class="flex flex-col items-baseline">
                <p class="body-1">{props.title}</p>
            </div>
        </SlotContainer >
    );
}