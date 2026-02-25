import { Title } from "@solidjs/meta";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createResource, createSignal, For, Show } from "solid-js";
import { getHostBySlug } from "~/lib/host";
import { getProductsByVenueId } from "~/lib/products";
import { createNewSchedule, deleteSchedule, formatSchedules, getSchedules, ScheduleWithProduct, updateSchedule } from "~/lib/schedule";
import { getVenueById } from "~/lib/venue";

export default function AdminSchedules() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
    const [originalDays, setOriginalDays] = createSignal<number[]>([]);

    const [showAddSlot, setShowAddSlot] = createSignal(false);
    const [newSlotStart, setNewSlotStart] = createSignal("12:00");
    const [newSlotEnd, setNewSlotEnd] = createSignal("13:00");
    const [newSlotProductId, setNewSlotProductId] = createSignal<number | null>(null);
    const [newSlotDays, setNewSlotDays] = createSignal<number[]>([]);

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

        return Array.from(map.values()).sort(
            (a, b) => a.start.getTime() - b.start.getTime()
        );
    });

    const handleBack = async () => {
        navigate(`/booking/${host()?.slug}/admin`)
    }

    const handleSelectSlot = async (slot: any) => {
        const isSelected =
            selectedSlot()?.productId === slot.productId &&
            selectedSlot()?.start.getTime() === slot.start.getTime();

        if (isSelected) {
            setSelectedSlot(null);
            setSelectedDays([]);
            setOriginalDays([]);
        } else {
            setSelectedSlot(slot);
            setSelectedDays([...slot.days]);
            setOriginalDays([...slot.days]);
        }
    }

    const handleSaveSlot = async () => {
        const slot = selectedSlot();
        if (!slot) return;

        const schedules = allSchedules();

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
                    <h1 class="text-[var(--color-text-1)] text-2xl sm:text-3xl lg:text-4xl text-justify">
                        <div class="flex justify-between items-center">
                            <span class="text-left">{host()?.name}</span>
                            <span class="text-right cursor-pointer"
                                onClick={handleBack}>Back</span>
                        </div>
                    </h1>

                    <div class="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-20 items-start mt-4 sm:mt-6 lg:mt-[20px]">
                        <div class="flex-1 w-full min-w-0 space-y-6 sm:space-y-8 lg:space-y-10">
                            <Show when={venue()} fallback={<div>Loading venue...</div>}>
                                <div class="flex flex-col gap-3 sm:gap-4 lg:gap-[20px] w-full">{venue()?.name}</div>
                                {/* Time Slots */}
                                <div class="flex justify-between items-center mb-4">
                                    <h2 class="text-lg font-semibold">Time Slots</h2>
                                    <button
                                        class="px-3 py-1.5 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition"
                                        onClick={() => setShowAddSlot(true)}
                                    >
                                        + Add Time Slot
                                    </button>
                                </div>
                                {/* Add Slot Modal */}
                                <Show when={showAddSlot()}>
                                    <div class="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
                                        <div class="bg-white p-6 rounded-lg w-80">
                                            <h3 class="text-lg font-semibold mb-4">Add New Slot</h3>

                                            {/* Product selector */}
                                            <div class="mb-3">
                                                <label class="block mb-1">Product</label>
                                                <select
                                                    class="w-full border px-2 py-1 rounded"
                                                    value={newSlotProductId() ?? ""}
                                                    onInput={(e) => setNewSlotProductId(Number(e.currentTarget.value))}
                                                >
                                                    <option value="">Select Product</option>
                                                    <For each={allSchedules().map(s => s.product).filter(Boolean).filter((v, i, a) => a.findIndex(p => p?.id === v?.id) === i)}>
                                                        {(p) => <option value={p!.id}>{p!.name}</option>}
                                                    </For>
                                                </select>
                                            </div>

                                            {/* Start/End Time */}
                                            <div class="mb-3 flex gap-2">
                                                <div class="flex-1">
                                                    <label class="block mb-1">Start</label>
                                                    <input type="time" class="w-full border px-2 py-1 rounded" value={newSlotStart()} onInput={e => setNewSlotStart(e.currentTarget.value)} />
                                                </div>
                                                <div class="flex-1">
                                                    <label class="block mb-1">End</label>
                                                    <input type="time" class="w-full border px-2 py-1 rounded" value={newSlotEnd()} onInput={e => setNewSlotEnd(e.currentTarget.value)} />
                                                </div>
                                            </div>

                                            {/* Days */}
                                            <div class="mb-3 flex flex-wrap gap-2">
                                                <For each={[0, 1, 2, 3, 4, 5, 6]}>
                                                    {(dayIndex) => {
                                                        const isActive = () => newSlotDays().includes(dayIndex);
                                                        return (
                                                            <button
                                                                type="button"
                                                                class={`px-3 py-1 rounded-full text-sm transition ${isActive() ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                                                                onClick={() => {
                                                                    setNewSlotDays(prev => isActive() ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
                                                                }}
                                                            >
                                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}
                                                            </button>
                                                        )
                                                    }}
                                                </For>
                                            </div>

                                            {/* Buttons */}
                                            <div class="flex justify-end gap-2 mt-4">
                                                <button
                                                    class="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                                                    onClick={() => setShowAddSlot(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    class="px-3 py-1.5 rounded-md bg-green-500 text-white font-medium hover:bg-green-600 transition"
                                                    onClick={async () => {
                                                        if (!newSlotProductId() || !newSlotStart() || !newSlotEnd()) {
                                                            alert("Please fill all fields");
                                                            return;
                                                        }

                                                        for (const day of newSlotDays()) {
                                                            await createNewSchedule({
                                                                productId: newSlotProductId()!,
                                                                dayOfWeek: day,
                                                                startTime: new Date(`1970-01-01T${newSlotStart()}:00`),
                                                                endTime: new Date(`1970-01-01T${newSlotEnd()}:00`),
                                                            });
                                                        }

                                                        refetch();
                                                        setShowAddSlot(false);
                                                        setNewSlotDays([]);
                                                        alert("New slot added!");
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Show>
                                {/* Slots */}
                                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <For each={groupedSlots()}>
                                        {(slot) => {
                                            const isSelected = () =>
                                                selectedSlot()?.productId === slot.productId &&
                                                selectedSlot()?.start.getTime() === slot.start.getTime();

                                            return (
                                                <div
                                                    class={`p-4 rounded-xl border transition cursor-pointer
                                                    ${isSelected()
                                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                                            : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
                                                        }`}
                                                    onClick={() => handleSelectSlot(slot)}
                                                >
                                                    {/* Time Header */}
                                                    <div class="flex justify-between items-center">
                                                        <div class="text-lg font-semibold text-gray-800">
                                                            {slot.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            {" - "}
                                                            {slot.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </div>

                                                        {isSelected() && (
                                                            <span class="text-sm text-blue-600 font-medium">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Days */}
                                                    <Show when={isSelected()}>
                                                        <div class="flex flex-wrap gap-2 mt-4">
                                                            <For each={[0, 1, 2, 3, 4, 5, 6]}>
                                                                {(dayIndex) => {
                                                                    const isActive = () => selectedDays().includes(dayIndex);

                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            class={`px-3 py-1 rounded-full text-sm transition
                                                                            ${isActive()
                                                                                    ? "bg-blue-500 text-white"
                                                                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                                                }`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedDays((prev) =>
                                                                                    isActive()
                                                                                        ? prev.filter((d) => d !== dayIndex)
                                                                                        : [...prev, dayIndex]
                                                                                );
                                                                            }}
                                                                        >
                                                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}
                                                                        </button>
                                                                    );
                                                                }}
                                                            </For>
                                                        </div>

                                                        {/* Save Button */}
                                                        <div class="flex justify-end gap-2 mt-3">
                                                            <button
                                                                class="px-3 py-1.5 text-sm rounded-md bg-green-500 text-white font-medium hover:bg-green-600 transition"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveSlot();
                                                                }}
                                                            >
                                                                Save
                                                            </button>

                                                            <button
                                                                class="px-3 py-1.5 text-sm rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedDays([...originalDays()]);
                                                                }}
                                                            >
                                                                Undo
                                                            </button>
                                                        </div>
                                                    </Show>
                                                </div>
                                            );
                                        }}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>
                </Show>
            </div>
        </main>
    );
}