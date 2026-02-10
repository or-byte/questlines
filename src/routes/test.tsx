import { createResource, createSignal, For, Show } from "solid-js"
import { getHosts } from "~/lib/host"
import { getTimeSlots } from "~/lib/timeslot";
import { getVenuesByHost } from "~/lib/venue";

export default function Test() {
    const [hosts] = createResource(getHosts);
    const [hostId, setHost] = createSignal(0);

    const [venues] = createResource(hostId, getVenuesByHost)
    const [venueId, setVenue] = createSignal(0);

    const handleSelectHost = (id: number) => {
        setHost(id);
    }

    const handleSelectVenue = (id: number) => {
        setVenue(id);
    }

    const [timeSlots] = createResource(venueId, getTimeSlots);

    return <div>
        <section>
            <h2> Hosts </h2>
            <Show when={hosts()}>
                <ul>
                    <For each={hosts()}>
                        {(h) => <button onClick={[handleSelectHost, h.id]}>{h.slug}</button>}
                    </For>
                </ul>
            </Show>

            <Show when={hostId() !== 0 && venues()}>
                <h2> Venues </h2>
                <ul>
                    <For each={venues()}>
                        {(v) => <button onclick={[handleSelectVenue, v.id]}>{v.slug}</button>
                        }
                    </For>
                </ul>
            </Show>

            <Show when={venueId() !== 0 && timeSlots()}>
                <h2> Time Slots</h2>
                <ul>
                    <For each={timeSlots()}>
                        {(slot) => {
                            const formatTime = (iso: string) =>
                                new Intl.DateTimeFormat("en-US", {
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                }).format(new Date(iso));

                            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                            const daysFormatted = slot.days.map(d => dayNames[d]).join(", ");

                            return (
                                <li>
                                    <div>
                                        {formatTime(slot.timeIn)} – {formatTime(slot.timeOut)}
                                    </div>
                                    <div>
                                        {daysFormatted}
                                    </div>
                                    <div>
                                        PHP {Number(slot.basePrice)}
                                    </div>
                                </li>
                            );
                        }}
                    </For>
                </ul>
            </Show>
        </section>
    </div >
}