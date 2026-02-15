import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { getSchedules } from "~/lib/schedule";
import { createNewTransaction, getTransactionsForDay } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";
import StatusPill from "~/components/pill/StatusPill";
import { Skeleton } from "@kobalte/core/skeleton";

export default function Host() {
    const params = useParams();
    const imageUrls = [
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp',
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp'
    ]; //static
    const [selectedCourtId, setSelectedCourtId] = createSignal<number>(1); //static. CHANGE THIS BEFORE COMMIT
    const [selectedSlot, setSelectedSlot] = createSignal<{
        label: string;
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
    } | null>(null);

    const [host] = createResource(params.host, getHostBySlug);

    const [venues] = createResource(() => host()?.id, getVenuesByHost);

    const [venueId, setVenueId] = createSignal<number>(0);

    const [availability, setAvailability] = createSignal<Record<string, boolean>>({})

    const handleSelectVenue = (id: number) => {
        if (venueId() === id) return;   // prevents refetch flicker
        setSelectedSlot(null);
        setVenueId(id);
        setSelectedCourtId(id);
    };

    // const [allSchedules] = createResource(venueId, async (venueId) => {
    //     if (!venueId) return [];

    //     const products = await getProductsByVenueId(venueId);
    //     if (!products.length) return [];

    //     const schedules = await Promise.all(
    //         products.map(p => getSchedules(p.id))
    //     );

    //     return schedules.flat().map(s => ({
    //         ...s,
    //         product: products.find(p => p.id === s.productId),
    //     }));
    // }, { initialValue: [] });

    // const buildSlotsFromSchedules = () => {
    //     const result: {
    //         label: string;
    //         start: Date;
    //         end: Date;
    //         productId: number;
    //         productName: string;
    //         productPrice: number;
    //     }[] = [];

    //     const today = new Date();

    //     if (!allSchedules()) return result;

    //     allSchedules()!.forEach(schedule => {
    //         const currentDay = today.getDay();
    //         const diff = (schedule.dayOfWeek - currentDay + 7) % 7;

    //         const targetDate = new Date(today);
    //         targetDate.setDate(today.getDate() + diff);

    //         const start = new Date(targetDate);
    //         const end = new Date(targetDate);

    //         start.setHours(schedule.startTime.getHours(), schedule.startTime.getMinutes(), 0, 0);
    //         end.setHours(schedule.endTime.getHours(), schedule.endTime.getMinutes(), 0, 0);

    //         const label = start.toLocaleString(undefined, {
    //             weekday: "short",
    //             month: "short",
    //             day: "numeric",
    //             hour: "numeric",
    //             minute: "2-digit",
    //         }) + " - " +
    //             end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

    //         result.push({
    //             label,
    //             start,
    //             end,
    //             productId: schedule.productId,
    //             productName: schedule.product?.name || "Unknown",
    //             productPrice: schedule.product?.price ? Number(schedule.product.price) : 0,
    //         });
    //     });

    //     return result;
    // };

    const [slotsWithAvailability] = createResource(
        venueId,
        async (venueId) => {
            if (!venueId) {
                return { slots: [], availability: {} };
            }

            // Fetch products
            const products = await getProductsByVenueId(venueId);
            if (!products.length) {
                return { slots: [], availability: {} };
            }

            // Fetch all schedules
            const schedules = await Promise.all(
                products.map(p => getSchedules(p.id))
            );

            const allSchedules = schedules.flat().map(s => ({
                ...s,
                product: products.find(p => p.id === s.productId),
            }));

            // Build slots
            const today = new Date();
            const slots: {
                label: string;
                start: Date;
                end: Date;
                productId: number;
                productName: string;
                productPrice: number;
            }[] = [];

            allSchedules.forEach(schedule => {
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

                slots.push({
                    label,
                    start,
                    end,
                    productId: schedule.productId,
                    productName: schedule.product?.name || "Unknown",
                    productPrice: schedule.product?.price ? Number(schedule.product.price) : 0,
                });
            });

            // Check availability for all slots
            const availabilityResults = await Promise.all(
                slots.map(async slot => {
                    const isBooked = await hasTransactionInRange(
                        slot.productId,
                        slot.start,
                        slot.end
                    );
                    return {
                        key: `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`,
                        isBooked
                    };
                })
            );

            const availability: Record<string, boolean> = {};
            availabilityResults.forEach(r => availability[r.key] = r.isBooked);

            return { slots, availability };
        },
        { initialValue: { slots: [], availability: {} } }
    );

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

    const formatTime = (isoString: Date) =>
        new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeSlot = (start: string, end: string) => { return `${start} - ${end}` }

    return (
        <main>
            <Title>Booking</Title>
            <div class="mx-30">
                <Show when={host()}>
                    <h1 class="text-[var(--color-text-1)] text-justify">{host()?.slug}</h1>
                    <div class="mt-[20px]"><Carousel images={imageUrls} /></div>
                    <div class="flex flex-col lg:flex-row gap-20 items-start mt-[20px]">
                        <div class="flex-1 min-w-0 space-y-10">
                            <Show when={venues()}>
                                <div class="flex flex-col gap-[20px] w-full mt-[20px]">
                                    <For each={venues()}>
                                        {(v) => (
                                            <CourtCard
                                                title={v.slug}
                                                thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp"
                                                isSelected={selectedCourtId() === v.id}
                                                onClick={[handleSelectVenue, v.id]}
                                            />
                                        )}
                                    </For>
                                </div>
                            </Show>
                            <div>
                                <Show when={!slotsWithAvailability.loading} fallback={
                                    <div class="py-8">
                                        <Skeleton height={100} />
                                    </div>
                                }>
                                    <Show when={slotsWithAvailability()?.slots.length}>
                                        <h2 class="text-[var(--color-text-1)] text-justify mb-4">
                                            Upcoming Schedules for{" "}
                                            {venues()?.find(v => v.id === venueId())?.slug || "Selected Venue"}
                                        </h2>
                                        <ul class="grid grid-cols-2 gap-6 w-full">
                                            <For each={slotsWithAvailability()!.slots}>
                                                {(slot) => {
                                                    const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;
                                                    const hours = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
                                                    const totalPrice = slot.productPrice * hours;

                                                    return (
                                                        <TimeSlot
                                                            time={slot.label}
                                                            price={totalPrice.toFixed(2)}
                                                            isSelected={selectedSlot()?.start.getTime() === slot.start.getTime()
                                                                && selectedSlot()?.productId === slot.productId}
                                                            isAvailable={slotsWithAvailability()!.availability[key]}
                                                            onClick={() => setSelectedSlot(slot)}
                                                        />
                                                    );
                                                }}
                                            </For>
                                        </ul>
                                    </Show>
                                </Show>
                                <Show when={selectedSlot()}>
                                    {(slot) => {
                                        const hours =
                                            (slot().end.getTime() - slot().start.getTime()) / (1000 * 60 * 60);
                                        const totalPrice = slot().productPrice * hours;

                                        return (
                                            <>
                                                <div class="border-t border-neutral-300 pt-4 flex items-center justify-between my-6" />
                                                <BookingSummary
                                                    rows={[
                                                        { label: 'Schedule', value: slot().label },
                                                        { label: 'Price per hour', value: `₱${slot().productPrice.toFixed(2)}` },
                                                    ]}
                                                    total={totalPrice.toFixed(2).toString()}
                                                    onBook={() => handleBookNow(slot())}
                                                /></>
                                        );
                                    }}
                                </Show>
                            </div>
                        </div>
                        <aside class="w-full lg:w-[490px] shrink-0 space-y-10 lg:sticky lg:top-8">
                            <div class="flex justify-between w-full items-center">
                                <h3 class="text-[var(--color-text-1)]">Operating Hours</h3>
                                <StatusPill status="closed" />
                            </div>
                            <div class="flex justify-between pl-[30px]">
                                <p class="body-2">Mon - Fri</p>
                                <p class="body-2">6:00 AM - 12:00 AM</p>
                            </div>
                            <InfoPanel
                                email="sampleemail@gmail.com"
                                address="Address, address, address"
                                contact="+63 991 123 4561"
                                facilities={["Facility1", "Facility2"]}
                                rules={["rule1", "rule1"]}
                            />
                        </aside>
                    </div>
                </Show>
            </div>
        </main >
    )
}
