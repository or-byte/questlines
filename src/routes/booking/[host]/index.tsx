import { Title } from "@solidjs/meta";
import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, createMemo } from "solid-js"
import { getHostBySlug } from "~/lib/host"
import { getProductsByVenueId } from "~/lib/products";
import { formatSchedules, getSchedules } from "~/lib/schedule";
import { TransactionStatus, createNewTransaction, getTransactionsForDay } from "~/lib/transaction";
import { getVenuesByHost } from "~/lib/venue";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";
import { createPaymongoCheckout } from "~/lib/paymongo";
import { clientOnly } from "@solidjs/start";
import { useSession } from "~/lib/client/auth";
import { getUserIdByEmail as getUserIdByEmail } from "~/lib/user";
import { Skeleton } from "@kobalte/core/skeleton";
import HostSkeleton from "~/components/skeleton/HostSkeleton";

const DateTimePickerClient = clientOnly(
  () => import("~/components/calendar/DatePickerClient"),
  { fallback: <div>Loading date picker...</div> }
);

export default function Host() {
  const session = useSession();
  const navigate = useNavigate();

  createEffect(() => {
    const user = session()?.data?.user;

    if (user && user.role === "ADMIN") {
      navigate("admin");
    }
  });

  const params = useParams();
  const imageUrls = [
    '/images/cana_logo.png',
    '/images/cana_1.jpg',
    '/images/cana_2.jpg'
  ]; //static
  const [selectedCourtId, setSelectedCourtId] = createSignal<number>(0);
  const [selectedDate, setSelectedDate] = createSignal<Date>(new Date());
  const [userId, setUserId] = createSignal<string>("")
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

  createEffect(async () => {
    const currentTime = new Date;
    const currentSlots = slots();
    const txs = transactions() || [];
    const newAvailability: Record<string, boolean> = {};
    const date = selectedDate();
    const timeSlots = [];


    allSchedules().map((schedule) => {
      const formatted = formatSchedules(schedule);
      if (formatted.start.toDateString() === date.toDateString() && currentTime < formatted.end) {
        timeSlots.push(formatted)
      }
    });

    const availableSlots = timeSlots.filter(slot => {
      return !txs.some(tx => {
        const times = tx.reservedTime.split(",");

        const txStart = new Date(times[0].replace(/[\[\("]/g, "").replace(/"/g, ""));
        const txEnd = new Date((times[1]?.replace(/[\]\)"]/g, "").trim()) || times[0].replace(/[\[\("]/g, "").replace(/"/g, ""));

        return slot.start < txEnd && slot.end > txStart;
      });
    });

    setSlotsForDay(availableSlots);

  });

  createEffect(async () => {
    if (session().data) {
      const email = session().data?.user.email || "";
      const id = await getUserIdByEmail(email) || "";
      setUserId(id);
    }
  })

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
      if (userId() === "") {
        navigate("/login");
        return;
      }

      const transaction = await createNewTransaction({
        productId: slot.productId,
        userId: userId(),
        quantity,
        reservedTimeStart: slot.start,
        reservedTimeEnd: slot.end,
        status: TransactionStatus.PENDING
      });

      const checkoutUrl = await createPaymongoCheckout(
        quantity,
        transaction.id,
        {
          productId: slot.productId,
          start: slot.start,
          end: slot.end,
          productName: slot.productName,
          productPrice: slot.productPrice,
          venue: `${host()?.name}`
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
      const jsDate = new Date(date.year, date.month, date.day);
      setSelectedDate(jsDate);
      setSelectedSlot(null);
      refetch();
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
                <div class="flex w-full">
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
                          isAvailable={true}
                          onClick={[setSelectedSlot, slot]}
                          isAdmin={false}
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
                        bookingState={"FAILED"}
                        timeLeft={60}
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