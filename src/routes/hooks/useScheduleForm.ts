import { createSignal } from "solid-js";

export function useScheduleForm() {
  const [date, setDate] = createSignal(null);
  const [timeStart, setTimeStart] = createSignal("");
  const [timeEnd, setTimeEnd] = createSignal("");
  const [maxParticipants, setMaxParticipants] = createSignal("");
  const [category, setCategory] = createSignal(null);

  const handleCreate = () => {
    console.log({
      date: date(),
      timeStart: timeStart(),
      timeEnd: timeEnd(),
      maxParticipants: maxParticipants(),
      category: category(),
    });
  };

  return {
    date, setDate,
    timeStart, setTimeStart,
    timeEnd, setTimeEnd,
    maxParticipants, setMaxParticipants,
    category, setCategory,
    handleCreate,
  };
}