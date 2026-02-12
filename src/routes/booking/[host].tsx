import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { createNewTransaction, hasTransactionInRange } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";

export default function Host() {
    const params = useParams();

    const [host] = createResource(params.host, getHostBySlug);
    const [venues] = createResource(() => host()?.id, getVenuesByHost);

    const [venueId, setVenueId] = createSignal<number>(0);
    const [products] = createResource(() => venueId(), getProductsByVenueId);
    const [productId, setProductId] = createSignal<number>(0);

    const [availability, setAvailability] = createSignal<Record<string, boolean>>({})

    const handleSelectVenue = (id: number) => setVenueId(id);
    const handleSelectProduct = (id: number) => setProductId(id);

    const generateTimeSlots = () => {
        const days = [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)]; // today & tomorrow
        const slots = [
            { label: "6:00 PM - 8:00 PM", startHour: 18, endHour: 20 },
            { label: "8:00 PM - 10:00 PM", startHour: 20, endHour: 22 },
            { label: "10:00 PM - 12:00 AM", startHour: 22, endHour: 24 },
        ];

        const result: { label: string; start: Date; end: Date }[] = [];

        days.forEach(day => {
            slots.forEach(slot => {
                const start = new Date(day);
                start.setHours(slot.startHour, 0, 0, 0);

                const end = new Date(day);
                end.setHours(slot.endHour, 0, 0, 0);

                const dayLabel = day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                result.push({
                    label: `${dayLabel} ${slot.label}`,
                    start,
                    end,
                });
            });
        });

        return result;
    };

    const timeSlots = generateTimeSlots();
    createEffect(() => {
        const p = productId();
        if (!p) return;

        Promise.all(
            timeSlots.map(async (slot) => {
                const isBooked = await hasTransactionInRange(
                    p,
                    slot.start,
                    slot.end
                );

                return {
                    key: `${slot.start.getTime()}-${slot.end.getTime()}`,
                    isBooked
                };
            })
        ).then(results => {
            const newAvailability: Record<string, boolean> = {};
            results.forEach(r => newAvailability[r.key] = r.isBooked);
            setAvailability(newAvailability);
        });
    });
    const handleBookNow = async (slot: { start: Date; end: Date }) => {
        const quantity = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60); // hours

        try {
            const newTransaction = await createNewTransaction({
                productId: productId(),
                userId: 1, //hardcoded user
                quantity,
                reservedTimeStart: slot.start,
                reservedTimeEnd: slot.end,
            });

            alert(`Booked successfully! Transaction ID: ${newTransaction[0].Id}`);

            const key = `${slot.start.getTime()}-${slot.end.getTime()}`;
            setAvailability(prev => ({ ...prev, [key]: true }));
        } catch (err: any) {
            if (err.code === "23P01") {
                alert("Sorry, this slot is already booked.");
            } else {
                console.error(err);
                alert("Something went wrong.");
            }
        }
    };

    return (
        <div>
            <section>
                <Show when={host()}>
                    <h1>{host()?.slug}</h1>
                    <h2>Venues</h2>
                    <Show when={venues()}>
                        <ol>
                            <For each={venues()}>
                                {(v) => (
                                    <li>
                                        <button onClick={[handleSelectVenue, v.id]}>
                                            {v.slug} @ {v.address}
                                        </button>
                                    </li>
                                )}
                            </For>
                        </ol>
                    </Show>
                </Show>
            </section>

            <section>
                <For each={products()}>
                    {(p) => (
                        <li>
                            <button onClick={() => handleSelectProduct(p.id)}>
                                {p.name} - {p.price}
                            </button>
                        </li>
                    )}
                </For>
            </section>

            <section>
                <Show when={productId()}>
                    <h3>Available Time Slots</h3>
                    <ul>
                        <For each={timeSlots}>
                            {(slot) => {
                                const key = `${slot.start.getTime()}-${slot.end.getTime()}`;
                                return (
                                    <li>
                                        {slot.label}{" "}
                                        <Show when={availability()[key] !== undefined}>
                                            <Show
                                                when={!availability()[key]}
                                                fallback={<span> Booked!</span>}
                                            >
                                                <button onClick={() => handleBookNow(slot)}>Book now</button>
                                            </Show>
                                        </Show>
                                    </li>
                                )
                            }}
                        </For>
                    </ul>
                </Show>
            </section>
        </div>
    )
}
