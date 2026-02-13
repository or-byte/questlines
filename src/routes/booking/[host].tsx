import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { getSchedules } from "~/lib/schedule";
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

    const [allSchedules] = createResource(venueId, async (venueId) => {
        if (!venueId) return [];

        const products = await getProductsByVenueId(venueId);
        if (!products.length) return [];

        const schedules = await Promise.all(
            products.map(p => getSchedules(p.id))
        );

        return schedules.flat().map(s => ({
            ...s,
            product: products.find(p => p.id === s.productId),
        }));
    });

    const buildSlotsFromSchedules = () => {
        const result: {
            label: string;
            start: Date;
            end: Date;
            productId: number;
            productName: string;
            productPrice: number;
        }[] = [];

        const today = new Date();

        if (!allSchedules()) return result;

        allSchedules()!.forEach(schedule => {
            const currentDay = today.getDay();
            const diff = (schedule.dayOfWeek - currentDay + 7) % 7;

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);

            const start = new Date(targetDate);
            const end = new Date(targetDate);

            start.setHours(schedule.startTime.getHours(), schedule.startTime.getMinutes(), 0, 0);
            end.setHours(schedule.endTime.getHours(), schedule.endTime.getMinutes(), 0, 0);

            const label = start.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }) + " - " +
                end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

            result.push({
                label,
                start,
                end,
                productId: schedule.productId,
                productName: schedule.product?.name || "Unknown",
                productPrice: schedule.product?.price ? Number(schedule.product.price) : 0,
            });
        });

        return result;
    };

    createEffect(() => {
        const slots = buildSlotsFromSchedules();
        if (!slots.length) return;

        Promise.all(
            slots.map(async slot => {
                const isBooked = await hasTransactionInRange(
                    slot.productId,
                    slot.start,
                    slot.end
                );
                return { key: `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`, isBooked };
            })
        ).then(results => {
            const newAvailability: Record<string, boolean> = {};
            results.forEach(r => newAvailability[r.key] = r.isBooked);
            setAvailability(newAvailability);
        });
    });

    const handleBookNow = async (slot: { start: Date; end: Date; productId: number }) => {
        const quantity = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60); // hours

        try {
            const newTransaction = await createNewTransaction({
                productId: slot.productId,
                userId: 1, // hardcoded user
                quantity,
                reservedTimeStart: slot.start,
                reservedTimeEnd: slot.end,
            });

            alert(`Booked successfully! Transaction ID: ${newTransaction[0].Id}`);

            const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;
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
                <Show when={buildSlotsFromSchedules()}>
                    <h3> Upcoming Schedules for{" "}
                        {venues()?.find(v => v.id === venueId())?.slug || "Selected Venue"}</h3>
                    <ul>
                        <For each={buildSlotsFromSchedules()}>
                            {(slot) => {
                                const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;

                                const hours = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
                                const totalPrice = slot.productPrice * hours;

                                return (
                                    <li>
                                        {slot.label} ({slot.productName}) - ₱{totalPrice.toFixed(2)}{" "}
                                        <Show when={availability()[key] !== undefined}>
                                            <Show
                                                when={!availability()[key]}
                                                fallback={<span>Booked!</span>}
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
        </div >
    )
}
