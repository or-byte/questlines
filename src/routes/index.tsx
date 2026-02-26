import { Title } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import { MdFillCalendar_month } from 'solid-icons/md'
import { useSession } from "~/lib/auth";

// const DateTimePickerClient = clientOnly(
//   () => import("../components/datetimepicker/DateTimePickerClient"),
//   { fallback: <div>Loading date picker...</div> }
// );

export default function Home() {
  const session = useSession();

  return (
    <main>
      <Title></Title>
      <h1>Hello, {session().data?.user.name || "Player!"} </h1>

      {/* <div class="bg-[var(--color-bg-2)] p-4 rounded-xl shadow-lg">
        <DateTimePickerClient
          openPickerIcon={<MdFillCalendar_month class="text-red-500" />}
          onChange={(data: any) => {
            if (data.type === "range") {
              console.log(data.startDate, data.endDate);
            }
            if (data.type === "single") {
              console.log(data.selectedDate);
            }
            if (data.type === "multiple") {
              console.log(data.multipleDates);
            }
          }}
        />
      </div> */}
    </main>
  );
}
