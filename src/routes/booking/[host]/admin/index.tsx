import { Title } from "@solidjs/meta";
import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug, getHostInformation } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { formatSchedules, getSchedules } from "~/lib/schedule";
import { TransactionStatus, createNewTransaction, getTransactionsForDay, updateTransactionStatus, TransactionFormData } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";
import ConfirmationModal from "~/components/confirmation_modal/ConfirmationModal";
import { clientOnly } from "@solidjs/start";
import { useSession } from "~/lib/client/auth";
import { Skeleton } from "@kobalte/core/skeleton";
import HostSkeleton from "~/components/skeleton/HostSkeleton";

const DateTimePickerClient = clientOnly(
  () => import("~/components/calendar/DatePickerClient"),
  { fallback: <div>Loading date picker...</div> }
);
export default function AdminHost() {
  const session = useSession();
  const params = useParams();

  const imageUrls = [
    '/images/cana_logo.png',
    '/images/cana_1.jpg',
    '/images/cana_2.jpg'
  ]; //static
  const [selectedCourtId, setSelectedCourtId] = createSignal<number>(0);
  const [transactionToDelete, setTransactionToDelete] = createSignal<number | null>(null);
  const [selectedSlot, setSelectedSlot] = createSignal<{
    label: string;
    start: Date;
    end: Date;
    productId: number;
    productName: string;
    productPrice: number;
  } | null>(null);

  const [host] = createResource(params.host, getHostBySlug);
  const [hostInfo] = createResource(() => host()?.id, getHostInformation);
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
    transactionUser?: string;
  }[]>([]);
  const handleSelectVenue = (id: number) => {
    if (venueId() === id) return;
    setVenueId(id);
    setSelectedCourtId(id);
    setSelectedSlot(null);
  };

  const [allSchedules] = createResource(
    () => ({ venueId: venueId() }),
    async ({ venueId }) => {
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
    const newAvailability: Record<string, boolean> = {};
    const date = selectedDate();

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
          transactionId: matchedTx?.id,
          transactionUser: matchedTx?.userName
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
      status: TransactionStatus.PAID
    }

    try {
      await createNewTransaction(form);
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
      const res = await updateTransactionStatus(id, "CANCELLED");

    } catch (err) {
      console.error("Failed to update transaction", err);
    }

    setIsOpen(false);
    setTransactionToDelete(null);
  }

  const onChangeDay = (date: any) => {
    if (date) {
      const jsDate = new Date(date.year, date.month, date.day);
      setSelectedDate(jsDate);
      setSelectedSlot(null);
    }
  }

  return (
    <main>
      <Title>Booking</Title>
      <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
        <Show
          when={!host.loading && !venues.loading}
          fallback={
            <div class="min-h-screen py-10">
              <HostSkeleton />
            </div>
          }
        >
          {/* Host Title */}
          <h1 class="text-[var(--color-text-1)] text-2xl sm:text-3xl lg:text-4xl text-justify">
            {host()?.name}
          </h1>

          {/* Carousel */}
          <div class="mt-4 sm:mt-6 lg:mt-[20px]">
            <Show when={imageUrls.length} fallback={<Skeleton class="w-full h-64 sm:h-96 rounded-xl" />}>
              <Carousel images={imageUrls} />
            </Show>
          </div>

          <div class="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-20 items-start mt-4 sm:mt-6 lg:mt-[20px]">
            {/* Main Content */}
            <div class="flex-1 w-full min-w-0 space-y-6 sm:space-y-8 lg:space-y-10">

              {/* Court Cards */}
              <div class="flex flex-col gap-3 sm:gap-4 lg:gap-[20px] w-full">
                <For each={venues.loading ? Array(3) : venues()}>
                  {(v) =>
                    venues.loading ? (
                      <Skeleton class="skeleton w-full h-20 rounded-lg" />
                    ) : (
                      <CourtCard
                        title={v.name}
                        thumbnail="/images/cana_2.jpg"
                        isSelected={selectedCourtId() === v.id}
                        onClick={[handleSelectVenue, v.id]}
                        status="open"
                      />
                    )
                  }
                </For>
              </div>

              {/* Date Picker */}
              <Show when={selectedCourtId() !== 0}>
                <div class="flex justify-center w-full">
                  <DateTimePickerClient
                    key={venueId()}
                    value={selectedDate()}
                    onChange={(val) => onChangeDay(val)}
                  />
                </div>
              </Show>

              {/* Time Slots / Upcoming Schedules */}
              <div>
                <h2 class="text-[var(--color-text-1)] text-xl sm:text-2xl text-justify mb-3 sm:mb-4">
                  <Show when={selectedCourtId()}>
                    Upcoming Schedules for {" "}
                    {venues()?.find(v => v.id === venueId())?.name || "Selected Venue"}
                  </Show>
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
                  <For each={allSchedules.loading ? Array(10) : slotsForDay()}>
                    {(slot) =>
                      allSchedules.loading || transactions.loading ? (
                        <Skeleton
                          class="flex flex-col items-start gap-3 sm:gap-4 lg:gap-[20px] w-full min-w-0 p-4"
                          radius={5}
                          style={{
                            background: "#F7F3E4",
                          }}
                        >
                          {/* Time */}
                          <Skeleton class="skeleton" height={16} radius={5} style={{ width: "67%" }} />
                          {/* Price */}
                          <Skeleton class="skeleton gap-1" height={16} radius={5} style={{ width: "20%" }} />
                          {/* Availability Badge */}
                          <Skeleton class="skeleton" height={16} radius={5} style={{ width: "25%" }} />
                        </Skeleton>
                      ) : (
                        <TimeSlot
                          time={slot.label}
                          price={slot.productPrice.toFixed(2)}
                          isSelected={
                            selectedSlot()?.start.getTime() === slot.start.getTime() &&
                            selectedSlot()?.productId === slot.productId
                          }
                          isAvailable={
                            transactions.loading || !availability()[`${slot.start.getTime()}-${slot.end.getTime()}-${slot.productId}`]
                          }
                          onClick={[setSelectedSlot, slot]}
                          isAdmin={true}
                          onDelete={() => onClickDelete(slot.transactionId)}
                          user={slot.transactionUser}
                        />
                      )
                    }
                  </For>
                </div>
              </div>

              {/* Booking Summary */}
              <Show when={selectedSlot()}>
                {(slot) => {
                  const hours = (slot().end.getTime() - slot().start.getTime()) / (1000 * 60 * 60);
                  const totalPrice = slot().productPrice * hours;

                  return (
                    <>
                      <div class="border-t border-neutral-300 pt-4 flex items-center justify-between my-4 sm:my-6" />
                      <BookingSummary
                        rows={[
                          { label: "Schedule", value: slot().label },
                          { label: "Price per hour", value: `₱${slot().productPrice.toFixed(2)}` },
                        ]}
                        total={totalPrice.toFixed(2).toString()}
                        onBook={() => handleBookNow(hours, slot())}
                      />
                    </>
                  );
                }}
              </Show>

            </div>

            {/* Sidebar */}
            <aside class="w-full lg:w-[490px] shrink-0 space-y-6 sm:space-y-8 lg:space-y-10 lg:sticky lg:top-8">
              {/* Operating Hours */}
              <div class="flex flex-col w-full gap-3">
                <Show when={products.loading || (products() && products().length > 0)}>
                  <h3 class="text-[var(--color-text-1)] text-lg sm:text-xl">Operating Hours</h3>
                </Show>
                <For each={products.loading ? Array(3) : products()}>
                  {(product) =>
                    products.loading ? (
                      <div class="flex justify-between items-center w-full pb-2">
                        <Skeleton class="skeleton" height={24} radius={6} style={{ width: "33%" }} />
                        <Skeleton class="skeleton" height={24} radius={6} style={{ width: "33%" }} />
                      </div>
                    ) : (
                      <div class="flex justify-between items-center w-full pb-2">
                        <span class="font-bold">{product.name}</span>
                        <span class="text-right">{product.description}</span>
                      </div>
                    )
                  }
                </For>
              </div>

              {/* Info Panel */}
              <Show when={!hostInfo.loading}>
                <For each={hostInfo()}>
                  {(info) => {
                    return (
                      <InfoPanel header={info.header} body={info.body} />
                    )
                  }}
                </For>
              </Show>
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
