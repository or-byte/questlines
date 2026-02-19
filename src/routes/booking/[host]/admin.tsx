import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { formatSchedules, FormattedSchedule, getSchedules } from "~/lib/schedule";
import { createNewTransaction, getTransactionsForDay, updateTransactionStatus, TransactionFormData } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";
import ConfirmationModal from "~/components/confirmation_modal/ConfirmationModal";
import { clientOnly } from "@solidjs/start";

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
    const [transactionToDelete, setTransactionToDelete] = createSignal<number | null>(null);
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
    const [products] = createResource(() => venueId(), getProductsByVenueId);
    const [availability, setAvailability] = createSignal<Record<string, boolean>>({})
    const [isOpen, setIsOpen] = createSignal(false);
    const [selectedDate, setSelectedDate] = createSignal<Date>(new Date());
    const [slotsForDay, setSlotsForDay] = createSignal<{
        label: string;
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
        transactionId?: number;
    }[]>([]);
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
        transactionId?: number;
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
        const txs = transactions() || [];
        const date = selectedDate();
        const newAvailability: Record<string, boolean> = {};

        const timeSlots = allSchedules()
            .map(schedule => formatSchedules(schedule))
            .filter(formatted =>
                formatted.start.toDateString() === date.toDateString()
            )
            .map(formatted => {
                const matchedTx = txs.find(tx => {
                    const [startRaw, endRaw] = tx.reservedTime.split(",");
                    const txStart = new Date(startRaw.replace(/[\[\(]/, ""));
                    const txEnd = new Date(endRaw.replace(/[\]\)]/, ""));

                    return formatted.start < txEnd && formatted.end > txStart;
                });

                return {
                    ...formatted,
                    transactionId: matchedTx?.id
                };
            });

        setSlotsForDay(timeSlots);

        timeSlots.forEach(slot => {
            const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`;

            const isBooked = txs.some(tx => {
                const txStart = new Date(tx.reservedTime.split(",")[0].replace(/[\[\(]/, ""));
                const txEnd = new Date(tx.reservedTime.split(",")[1].replace(/[\]\)]/, ""));
                return slot.start < txEnd && slot.end > txStart;
            });

            newAvailability[key] = isBooked;
        });

        setAvailability(newAvailability);

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

        if (!host()) throw new Error("Host not found");

        const form: TransactionFormData = {
            productId: slot.productId,
            userId: host()?.ownerId,
            quantity: quantity,
            reservedTimeStart: slot.start,
            reservedTimeEnd: slot.end,
            status: 'PAID'
        }

        try {
            const newTransaction = await createNewTransaction(form);

            alert(`Booked successfully! Transaction ID: ${newTransaction.id}`);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const onClickDelete = (id: any) => {
        setTransactionToDelete(id);
        setIsOpen(true)
    }

    const handleDelete = async () => {
        const id = transactionToDelete();

        if (!id) return;

        try {
            await updateTransactionStatus(id, "CANCELLED");
        } catch (err) {
            console.error("Failed to update transaction", err);
        }

        setIsOpen(false);
        setTransactionToDelete(null);
        refetch();
    }

    const onChangeDay = (date: any) => {
        if (date) {
            setSelectedDate(date.currentDate);
            setSelectedSlot(null);
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
                                                            isAdmin={true}
                                                            onDelete={() => onClickDelete(slot.transactionId)}
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
                    <ConfirmationModal
                        isOpen={isOpen()}
                        title="Delete Item?"
                        message="Are you sure you want to delete this item? This action cannot be undone."
                        confirmText="Yes, Delete"
                        cancelText="Cancel"
                        onConfirm={handleDelete}
                        onCancel={() => setIsOpen(false)}
                    />
                </Show>
            </div>
        </main>
    )
}
