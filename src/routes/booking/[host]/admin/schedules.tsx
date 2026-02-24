import { Title } from "@solidjs/meta";
import { useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createResource, createSignal, For, Show } from "solid-js";
import { getHostBySlug } from "~/lib/host";
import { getProductsByVenueId } from "~/lib/products";
import { createNewSchedule, deleteSchedule, formatSchedules, getSchedules, Schedule, ScheduleWithProduct, updateSchedule } from "~/lib/schedule";
import { getVenueById } from "~/lib/venue";

export default function AdminSchedules() {
    const params = useParams();
    const [searchParams] = useSearchParams();

    const [host] = createResource(params.host, getHostBySlug);

    const venueIdRaw = searchParams.v;
    const venueId = Array.isArray(venueIdRaw) ? venueIdRaw[0] : venueIdRaw;
    if (!venueId) throw new Error("Missing venue ID");

    const venueIdNumber = Number(venueId);
    if (isNaN(venueIdNumber)) throw new Error("Invalid venue ID");

    const [venue] = createResource(() => venueIdNumber, getVenueById);

    const [allSchedules, { refetch }] = createResource<ScheduleWithProduct[], number>(
        () => venue()?.id,
        async (venueId) => {
            if (!venueId) return [];
            const products = await getProductsByVenueId(venueId);
            if (!products.length) return [];
            const schedules = await Promise.all(products.map((p) => getSchedules(p.id)));
            return schedules
                .flat()
                .map((s) => ({ ...s, product: products.find((p) => p.id === s.productId) }));
        },
        { initialValue: [] }
    );

    const [selectedSlot, setSelectedSlot] = createSignal<{
        start: Date;
        end: Date;
        productId: number;
        productName: string;
        productPrice: number;
    } | null>(null);

    const [selectedDays, setSelectedDays] = createSignal<number[]>([]);

    const groupedSlots = createMemo(() => {
        const schedules = allSchedules();
        if (!schedules?.length) return [];

        const map = new Map<string, {
            start: Date;
            end: Date;
            productId: number;
            productName: string;
            productPrice: number;
            days: number[];
        }>();

        schedules.forEach(schedule => {
            const formatted = formatSchedules(schedule);

            const key = `${formatted.start.getHours()}-${formatted.start.getMinutes()}-${formatted.end.getHours()}-${formatted.end.getMinutes()}-${schedule.productId}`;

            if (!map.has(key)) {
                map.set(key, {
                    start: formatted.start,
                    end: formatted.end,
                    productId: schedule.productId,
                    productName: schedule.product?.name || "",
                    productPrice: schedule.product?.price || 0,
                    days: []
                });
            }

            map.get(key)!.days.push(schedule.dayOfWeek);
        });

        return Array.from(map.values());
    });

    const handleSaveSlot = async () => {
        const slot = selectedSlot();
        if (!slot) return;

        const schedules = allSchedules(); // your existing schedules

        for (let day = 0; day < 7; day++) {
            const exists = schedules.find(
                (s) =>
                    s.productId === slot.productId &&
                    s.dayOfWeek === day &&
                    new Date(s.startTime).getHours() === slot.start.getHours() &&
                    new Date(s.startTime).getMinutes() === slot.start.getMinutes() &&
                    new Date(s.endTime).getHours() === slot.end.getHours() &&
                    new Date(s.endTime).getMinutes() === slot.end.getMinutes()
            );

            if (selectedDays().includes(day)) {
                if (exists) {
                    await updateSchedule(exists.id, {
                        productId: slot.productId,
                        dayOfWeek: day,
                        startTime: slot.start,
                        endTime: slot.end,
                    });
                } else {
                    await createNewSchedule({
                        productId: slot.productId,
                        dayOfWeek: day,
                        startTime: slot.start,
                        endTime: slot.end,
                    });
                }
            } else {
                if (exists) await deleteSchedule(exists.id);
            }
        }

        refetch();
        alert("Schedules saved successfully!");
    };

    return (
        <main>
            <Title>Schedules</Title>
            <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
                <Show
                    when={!host.loading && host()}
                    fallback={
                        <div class="flex justify-center items-center min-h-screen">
                            <div class="spinner"></div>
                        </div>
                    }
                >
                    <h1 class="text-[var(--color-text-1)] text-2xl sm:text-3xl lg:text-4xl text-justify">{host()?.name}</h1>

                    <div class="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-20 items-start mt-4 sm:mt-6 lg:mt-[20px]">
                        <div class="flex-1 w-full min-w-0 space-y-6 sm:space-y-8 lg:space-y-10">
                            <Show when={venue()} fallback={<div>Loading venue...</div>}>
                                <div class="flex flex-col gap-3 sm:gap-4 lg:gap-[20px] w-full">{venue()?.name}</div>
                                {/* Day selector */}
                                <For each={groupedSlots()}>
                                    {(slot) => (
                                        <div class="border p-4 rounded mb-3">
                                            <div class="font-bold">
                                                {slot.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                {" - "}
                                                {slot.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>

                                            {/* Select the slot */}
                                            <button
                                                class={`mt-2 px-3 py-1 rounded ${selectedSlot()?.productId === slot.productId &&
                                                    selectedSlot()?.start.getTime() === slot.start.getTime() ? "bg-blue-500 text-white" : "bg-gray-200"
                                                    }`}
                                                // When selecting a slot
                                                onClick={() => {
                                                    setSelectedSlot(slot);
                                                    setSelectedDays(slot.days);
                                                }}
                                            >
                                                Select this time
                                            </button>

                                            {/* Show day checkboxes only for selected slot */}
                                            <Show
                                                when={
                                                    selectedSlot()?.productId === slot.productId &&
                                                    selectedSlot()?.start.getTime() === slot.start.getTime()
                                                }
                                            >
                                                <div class="flex gap-2 mt-2 flex-wrap">
                                                    <For each={[0, 1, 2, 3, 4, 5, 6]}>
                                                        {(dayIndex) => (
                                                            <label class="flex items-center gap-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDays().includes(dayIndex)}
                                                                    onChange={(e) => {
                                                                        const checked = e.currentTarget.checked;
                                                                        setSelectedDays((prev) =>
                                                                            checked
                                                                                ? [...new Set([...prev, dayIndex])]
                                                                                : prev.filter((d) => d !== dayIndex)
                                                                        );
                                                                    }}
                                                                />
                                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}
                                                            </label>
                                                        )}
                                                    </For>
                                                    <button
                                                        class="mt-2 px-3 py-1 bg-green-500 text-white rounded"
                                                        onClick={handleSaveSlot}
                                                    >
                                                        Save Slot
                                                    </button>
                                                </div>
                                            </Show>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </div>
                    </div>
                </Show>
            </div>
        </main>
    );
}