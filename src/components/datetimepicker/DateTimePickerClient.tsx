import { DateTimePicker } from 'date-time-picker-solid';
import "./datetime_styles.css"

export default function DateTimePickerClient(props: any) {
  return <DateTimePicker
    currentDate={props.value ?? new Date()}
    calendarResponse={props.calendarResponse}
    customizeTogglerCalendarIcon="calendarColor"
    closeOnSelect={true} />;
}
