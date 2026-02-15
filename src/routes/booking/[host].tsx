import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { formatSchedules, FormattedSchedule, getSchedules } from "~/lib/schedule";
import { createNewTransaction, getTransactionsForDay } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";

export default function Host() {
    const params = useParams();
    const imageUrls = [
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp',
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp'
    ]; //static
    const [selectedCourtId, setSelectedCourtId] = createSignal<number>(0);
    const [isChangingVenue, setIsChangingVenue] = createSignal(false);
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
        if (venueId() === id) return;
        setIsChangingVenue(true);
        setVenueId(id);
        setSelectedCourtId(id);
        setSelectedSlot(null);
    };

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
    }, { initialValue: [] });

    const slots = createMemo<{
        label: string;
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
    }[]>((prev) => {
        if (isChangingVenue()) {
            return [];
        }

        if (allSchedules.loading) {
            return prev || [];
        }

        if (!allSchedules()) return [];

        const results : FormattedSchedule[] = [];

        allSchedules()!.forEach(schedule => {
            results.push(formatSchedules(schedule));
        });

        return results;
    }, []);

    const [transactions] = createResource(
        () => venueId() && slots().length > 0,
        async () => {
            const currentSlots = slots();
            if (!currentSlots.length) return [];

            const productIds = Array.from(new Set(currentSlots.map(s => s.productId)));

            const txs = await Promise.all(productIds.map(async (productId) => {
                const dayStart = new Date(currentSlots[0].start);
                dayStart.setHours(0, 0, 0, 0);

                const dayEnd = new Date(currentSlots[0].start);
                dayEnd.setHours(23, 59, 59, 999);

                return await getTransactionsForDay(productId, dayStart, dayEnd);
            }));

            return txs.flat();
        },
        { initialValue: [] }
    );

    createEffect(() => {
        const currentSlots = slots();
        const txs = transactions() || [];
        const newAvailability: Record<string, boolean> = {};

        currentSlots.forEach(slot => {
            const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;

            const isBooked = txs.some(tx => {
                const txStart = new Date(tx.reservedTime.split(",")[0].replace(/[\[\(]/, ""));
                const txEnd = new Date(tx.reservedTime.split(",")[1].replace(/[\]\)]/, ""));
                return slot.start < txEnd && slot.end > txStart;
            });

            newAvailability[key] = isBooked;
        });

        setAvailability(newAvailability);
    });

    createEffect(() => {
        if (!allSchedules.loading && !transactions.loading && isChangingVenue()) {
            setIsChangingVenue(false);
        }
    });

    const handleBookNow = async (slot: { start: Date; end: Date; productId: number }) => {
        const quantity = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);

        try {
            const newTransaction = await createNewTransaction({
                productId: slot.productId,
                userId: 1,
                quantity,
                reservedTimeStart: slot.start,
                reservedTimeEnd: slot.end,
                status: 'PENDING'
            });

            alert(`Booked successfully! Transaction ID: ${newTransaction[0].id}`);
            window.location.reload();
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
        <main>
            <Title>Booking</Title>
            <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
                <Show
                    when={!host.loading && host()}
                    fallback={
                        <div class="flex justify-center items-center min-h-screen">
                            <div class="spinner"></div>
                        </div>
                    }>
                    <h1 class="text-[var(--color-text-1)] text-2xl sm:text-3xl lg:text-4xl text-justify">
                        {host()?.slug}
                    </h1>
                    <div class="mt-4 sm:mt-6 lg:mt-[20px]">
                        <Carousel images={imageUrls} />
                    </div>
                    <div class="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-20 items-start mt-4 sm:mt-6 lg:mt-[20px]">
                        {/* Main content */}
                        <div class="flex-1 w-full min-w-0 space-y-6 sm:space-y-8 lg:space-y-10">
                            <Show when={venues()}>
                                <div class="flex flex-col gap-3 sm:gap-4 lg:gap-[20px] w-full">
                                    <For each={venues()}>
                                        {(v) => (
                                            <CourtCard
                                                title={v.slug}
                                                thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp"
                                                isSelected={selectedCourtId() === v.id}
                                                onClick={[handleSelectVenue, v.id]}
                                                status="open"
                                            />
                                        )}
                                    </For>
                                </div>
                            </Show>

                            <div>
                                <Show
                                    when={!isChangingVenue() && !allSchedules.loading && !transactions.loading}
                                    fallback={
                                        <div class="flex justify-center py-12">
                                            <div class="spinner"></div>
                                        </div>
                                    }
                                >
                                    <Show when={slots().length}>
                                        <h2 class="text-[var(--color-text-1)] text-xl sm:text-2xl text-justify mb-3 sm:mb-4">
                                            Upcoming Schedules for{" "}
                                            {venues()?.find(v => v.id === venueId())?.slug || "Selected Venue"}
                                        </h2>
                                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
                                            <For each={slots()}>
                                                {(slot) => {
                                                    const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;

                                                    return (
                                                        <TimeSlot
                                                            time={slot.label}
                                                            price={slot.productPrice.toFixed(2)}
                                                            isSelected={selectedSlot()?.start.getTime() === slot.start.getTime()
                                                                && selectedSlot()?.productId === slot.productId}
                                                            isAvailable={!availability()[key]}
                                                            onClick={[setSelectedSlot, slot]}
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
                                                <div class="border-t border-neutral-300 pt-4 flex items-center justify-between my-4 sm:my-6" />
                                                <BookingSummary
                                                    rows={[
                                                        { label: 'Schedule', value: slot().label },
                                                        { label: 'Price per hour', value: `₱${slot().productPrice.toFixed(2)}` },
                                                    ]}
                                                    total={totalPrice.toFixed(2).toString()}
                                                    onBook={() => handleBookNow(slot())}
                                                />
                                            </>
                                        );
                                    }}
                                </Show>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside class="w-full lg:w-[490px] shrink-0 space-y-6 sm:space-y-8 lg:space-y-10 lg:sticky lg:top-8">
                            <div class="flex justify-between w-full items-center">
                                <h3 class="text-[var(--color-text-1)] text-lg sm:text-xl">Operating Hours</h3>
                            </div>
                            <div class="flex justify-between pl-4 sm:pl-6 lg:pl-[30px]">
                                <p class="body-2 text-sm sm:text-base">Mon - Fri</p>
                                <p class="body-2 text-sm sm:text-base">6:00 AM - 12:00 AM</p>
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
        </main>
    )
}
