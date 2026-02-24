import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { formatSchedules, getSchedules } from "~/lib/schedule";
import { createNewTransaction, getTransactionsForDay } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";
import { createPaymongoCheckout } from "~/lib/paymongo";
import { clientOnly } from "@solidjs/start";
import { TransactionStatus } from "@prisma/client";

const DateTimePickerClient = clientOnly(
    () => import("~/components/datetimepicker/DateTimePickerClient"),
    { fallback: <div>Loading date picker...</div> }
);

export default function Host() {
    const params = useParams();
    const imageUrls = [
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp',
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp'
    ]; //static
    const [selectedCourtId, setSelectedCourtId] = createSignal<number>(0);
    const [isChangingVenue, setIsChangingVenue] = createSignal(false);
    const [selectedDate, setSelectedDate] = createSignal<Date>(new Date());
    const [slotsForDay, setSlotsForDay] = createSignal<{
        label: string;
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
    }[]>([]);
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
    const [products] = createResource(() => venueId(), getProductsByVenueId);
    const [availability, setAvailability] = createSignal<Record<string, boolean>>({})

    const handleSelectVenue = (id: number) => {
        if (venueId() === id) return;
        setIsChangingVenue(true);
        setVenueId(id);
        setSelectedCourtId(id);
        setSelectedSlot(null);
    };

    const [allSchedules] = createResource(
        () => ({ venueId: venueId(), date: selectedDate() }),
        async ({ venueId, date }) => {
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
        },
        { initialValue: [] }
    );

    const slots = createMemo<{
        label: string;
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
    }[]>((prev) => {
        if (isChangingVenue()) return [];
        if (allSchedules.loading) {
            return prev || [];
        }

        const schedules = allSchedules();

        if (!schedules?.length) return [];

        return schedules.map(schedule => formatSchedules(schedule));
    });

    const [transactions, { refetch }] = createResource(
        () => venueId() && slots().length > 0,
        async () => {
            const currentSlots = slots();
            if (!currentSlots.length) return [];

            const productIds = Array.from(new Set(currentSlots.map(s => s.productId)));

            const txs = await Promise.all(productIds.map(async (productId) => {
                const dayStart = new Date();
                dayStart.setHours(0, 0, 0, 0);

                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayStart.getDate() + 7);
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
        const date = selectedDate();
        const timeSlots = [];

        allSchedules().map((schedule) => {
            const formatted = formatSchedules(schedule);
            if (formatted.start.toDateString() === date.toDateString()) {
                timeSlots.push(formatted)
            }
        });

        setSlotsForDay(timeSlots);

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

    const handleBookNow = async (
        quantity: number,
        slot: {
            start: Date;
            end: Date;
            productId: number;
            productName: string;
            productPrice: number;
        }) => {
        try {
            const transaction = await createNewTransaction({
                productId: slot.productId,
                userId: 1, // TODO: replace with actual user ID from auth
                quantity,
                reservedTimeStart: slot.start,
                reservedTimeEnd: slot.end,
                status: TransactionStatus.PENDING
            });

            if (!transaction?.id) throw new Error("Failed to create transaction: ");
            alert("transaction created with ID: " + transaction.id);

            const checkoutUrl = await createPaymongoCheckout(
                quantity,
                transaction.id,
                {
                    productId: slot.productId,
                    start: slot.start,
                    end: slot.end,
                    productName: slot.productName,
                    productPrice: slot.productPrice,

                }
            );

            window.location.href = checkoutUrl;

        } catch (err) {
            console.error(err);
            alert("Failed to start checkout");
        }
    };

    const onChangeDay = (date: any) => {
        if (date) {
            setSelectedDate(date.currentDate);
            setSelectedSlot(null);
            refetch();
        }
    }

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
                        {host()?.name}
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
                                                title={v.name}
                                                thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp"
                                                isSelected={selectedCourtId() === v.id}
                                                onClick={[handleSelectVenue, v.id]}
                                                status="open"
                                            />
                                        )}
                                    </For>
                                </div>
                            </Show>
                            <Show when={selectedCourtId() !== 0}>
                                <div class="flex justify-center w-full">
                                    <DateTimePickerClient
                                        key={venueId()}
                                        value={selectedDate()}
                                        calendarResponse={onChangeDay}
                                    />
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
                                            <For each={slotsForDay()}>
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
                                                            isAdmin={false}
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
                                                    onBook={() => handleBookNow(hours, slot())}
                                                />
                                            </>
                                        );
                                    }}
                                </Show>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside class="w-full lg:w-[490px] shrink-0 space-y-6 sm:space-y-8 lg:space-y-10 lg:sticky lg:top-8">
                            <Show when={products()?.length}>
                                <div class="flex flex-col w-full gap-3">
                                    <h3 class="text-[var(--color-text-1)] text-lg sm:text-xl">
                                        Operating Hours
                                    </h3>
                                    <For each={products()}>
                                        {(product) => (
                                            <div class="flex justify-between items-center w-full pb-2">
                                                <span class="font-bold">
                                                    {product.name}
                                                </span>

                                                <span class="text-right">
                                                    {product.description}
                                                </span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>

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