import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { getSchedules } from "~/lib/schedule";
import { createNewTransaction, getTransactionsForDay } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";

export default function Host() {
    const params = useParams();

    const [host] = createResource(params.host, getHostBySlug);
    const [venues] = createResource(() => host()?.id, getVenuesByHost);

    const [venueId, setVenueId] = createSignal<number>(0);

    const [availability, setAvailability] = createSignal<Record<string, boolean>>({})

    const handleSelectVenue = (id: number) => setVenueId(id);

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

    const [transactions] = createResource(()=> venueId() && allSchedules(), async (venueId) => {
        if (!venueId || !allSchedules()) return [];

        const slots = buildSlotsFromSchedules();

        const productIds = Array.from(new Set(slots.map(s => s.productId)));

        const txs = await Promise.all(productIds.map(async (productId) => {
            const dayStart = new Date(slots[0].start);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(slots[0].start);
            dayEnd.setHours(23, 59, 59, 999);

            const result = await getTransactionsForDay(productId, dayStart, dayEnd);
            console.log(`Transactions for product ${productId}:`, result);
            return result;
        }));

        return txs.flat();
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

            alert(`Booked successfully! Transaction ID: ${newTransaction[0].id}`);

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

    createEffect(() => {
        const slots = buildSlotsFromSchedules();
        const txs = transactions() || [];
        const newAvailability: Record<string, boolean> = {};

        slots.forEach(slot => {
            const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;

            const isBooked = txs.some(tx => {
                const txStart = new Date(tx.reservedTime.split(",")[0].replace(/[\[\(]/, ""));
                const txEnd = new Date(tx.reservedTime.split(",")[1].replace(/[\]\)]/, ""));
                return slot.start < txEnd && slot.end > txStart;
            });

            console.log(`Slot ${slot.label} for product ${slot.productId} isBooked:`, isBooked);

            newAvailability[key] = isBooked;
        });

        setAvailability(newAvailability);
    });

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

                                let endTime = new Date(slot.end);
                                if (endTime <= slot.start) {
                                    endTime.setDate(endTime.getDate() + 1);
                                }

                                const hours = (endTime.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
                                const totalPrice = slot.productPrice * hours;

                                return (
                                    <li>
                                        {slot.label} ({slot.productName}) - ₱{totalPrice.toFixed(2)}{" "}
                                        {!availability()[key] ? (
                                            <button onClick={() => handleBookNow(slot)}>Book now</button>
                                        ) : (
                                            <span>Booked!</span>
                                        )}
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
