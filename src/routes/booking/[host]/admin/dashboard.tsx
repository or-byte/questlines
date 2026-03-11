import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import Button from "~/components/button/Button";
import { Skeleton } from "@kobalte/core/skeleton";
import { getHostBySlug } from "~/lib/host";
import { createNewProduct, getProductsByVenueId, ProductFormData, updateProduct } from "~/lib/products";
import { getVenuesByHost } from "~/lib/venue";
import { getSchedules, ScheduleFormData } from "~/lib/schedule";

const EditorState = {
  PRODUCT: "PRODUCT",
  SCHEDULE: "SCHEDULE",
  EVENT: "EVENT"
} as const;

export default function HostAdminDashboard() {
  const params = useParams();

  const [host] = createResource(() => params.host, getHostBySlug);
  const [venues] = createResource(() => host()?.id, getVenuesByHost);
  const [selectedVenueId, setSelectedVenue] = createSignal();

  const [editorState, setEditorState] = createSignal(EditorState.PRODUCT);

  // Product States
  const [products, { refetch: refetchProducts }] = createResource(() => selectedVenueId(), getProductsByVenueId);
  const [selectedProductId, setSelectedProductId] = createSignal();
  const [productForm, setProductForm] = createSignal<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    price: 0,
    venueId: 0
  });

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  const handleSelectEditorState = (state) => {
    setEditorState(state)
  }

  const handleSelectVenue = (venueId: number) => {
    setSelectedVenue(venueId);
    setSelectedProductId(undefined);
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);

    const product = products()?.find(p => p.id === productId);
    if (!product) throw new Error("Error on selecting product");

    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      venueId: product.venueId
    });
  }

  const handleAddProduct = () => {
    setSelectedProductId(null);

    setProductForm({
      sku: "",
      name: "",
      description: "",
      price: 0,
      venueId: selectedVenueId()
    });
  };

  const handleSaveProduct = async () => {
    const data = productForm();

    try {
      if (!selectedProductId()) {
        const product = await createNewProduct(data);
        alert("New product created!");
      } else {
        const product = await updateProduct(selectedProductId(), data);
        alert("Product updated!");
      }

      setSelectedProductId(undefined);
      setProductForm({ sku: "", name: "", description: "", price: 0, venueId: 0 });
      refetchProducts();

    } catch (err) {
      console.error("Failed to save product", err);
    }
  };

  // Schedule States
  const [schedules] = createResource(() => selectedProductId(), getSchedules);
  const [selectedScheduleId, setSelectedScheduleId] = createSignal<number>();
  const [scheduleForm, setScheduleForm] = createSignal<ScheduleFormData>({
    productId: 0,
    dayOfWeek: 0,
    startTime: new Date(),
    endTime: new Date(),
  });

  const [selectedDays, setSelectedDays] = createSignal<number[]>([]);

  const updateScheduleField = <K extends keyof ScheduleFormData>(
    field: K,
    value: ScheduleFormData[K]
  ) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSchedule = async() => {
    
  }

  return (
    <main>
      <Title>Host Editor</Title>

      <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
        <Show when={!host.loading} fallback={<Skeleton class="skeleton w-48 h-8 rounded-md mb-6" />}>
          <h1 class="text-xl font-semibold mb-6">{host()?.name}</h1>

          {/* Action Buttons */}
          <div class="flex gap-3 mb-6">
            <Button
              class={`${editorState() === EditorState.PRODUCT ? "btn-selected" : "btn-unselected"}`}
              onClick={[handleSelectEditorState, EditorState.PRODUCT]}>
              Edit Products
            </Button>

            <Button
              class={`${editorState() === EditorState.SCHEDULE ? "btn-selected" : "btn-unselected"}`}
              onClick={[handleSelectEditorState, EditorState.SCHEDULE]}>
              Edit Timeslots
            </Button>

            <Button
              class={`${editorState() === EditorState.EVENT ? "btn-selected" : "btn-unselected opacity-50 cursor-not-allowed"}`}
              disabled>
              Create Events (coming soon)
            </Button>
          </div>

          {/* Current Editor State */}
          <p class="text-sm text-gray-500 mb-4">
            {editorState() === EditorState.PRODUCT && "Currently editing products"}
            {editorState() === EditorState.SCHEDULE && "Currently editing timeslots"}
            {editorState() === EditorState.EVENT && "Currently creating events"}
          </p>

          <div class="grid grid-cols-4 gap-6">
            {/* Venues */}
            <div class="flex flex-col gap-3">
              <Show
                when={!venues.loading}
                fallback={
                  <div class="flex flex-col gap-3">
                    <For each={[1, 2, 3, 4]}>
                      {() => (
                        <Skeleton class="skeleton w-full h-20 rounded-lg" />
                      )}
                    </For>
                  </div>
                }
              >
                <For each={venues()}>
                  {(v) => (
                    <Button
                      type="button"
                      class={`text-left ${selectedVenueId() === v.id ? "btn-selected" : "btn-unselected"}`}
                      onClick={[handleSelectVenue, v.id]}
                    >
                      {v.name}
                    </Button>
                  )}
                </For>
              </Show>

              {/* Add venue */}
              <Button class="btn btn-primary mt-4">
                + Add Venue
              </Button>
            </div>


            {/* Products */}
            <div class="flex flex-col gap-3">
              <Show
                when={!products.loading && products()}
                fallback={
                  <div class="flex flex-col gap-3">
                    <For each={[1, 2, 3, 4]}>
                      {() => (
                        <Skeleton class="skeleton w-full h-20 rounded-lg" />
                      )}
                    </For>
                  </div>
                }
              >
                <For each={products()}>
                  {(p) => (
                    <Button
                      class={`text-left ${selectedProductId() === p.id ? "btn-selected" : "btn-unselected"}`}
                      onClick={[handleSelectProduct, p.id]}>
                      {p.name}
                    </Button>
                  )}
                </For>

                {/* Add Product */}
                <Button
                  class="btn btn-primary mt-4"
                  onClick={handleAddProduct}>
                  + Add Product
                </Button>
              </Show>
            </div>

            <Show when={selectedProductId() !== undefined}>
              <Show when={editorState() === EditorState.PRODUCT}>
                {/* Product Editor */}
                <div class="border rounded-lg p-4 flex flex-col gap-4">

                  <h2 class="font-semibold text-lg">Product Editor</h2>

                  {/* Sku */}
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">SKU</label>
                    <input
                      class="border rounded px-3 py-2"
                      value={productForm().sku}
                      onInput={(e) => updateField("sku", e.currentTarget.value)}
                    />
                  </div>

                  {/* Name */}
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Name</label>
                    <input
                      class="border rounded px-3 py-2"
                      value={productForm().name}
                      onInput={(e) => updateField("name", e.currentTarget.value)}
                    />
                  </div>

                  {/* Descriptoin */}
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Description</label>
                    <textarea
                      class="border rounded px-3 py-2"
                      rows="3"
                      value={productForm().description}
                      onInput={(e) => updateField("description", e.currentTarget.value)}
                    />
                  </div>

                  {/* Price */}
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Price</label>
                    <input
                      type="number"
                      class="border rounded px-3 py-2"
                      value={productForm().price}
                      onInput={(e) => updateField("price", Number(e.currentTarget.value))}
                    />
                  </div>

                  {/* Save button */}
                  <Button class="btn mt-2" onClick={handleSaveProduct}>
                    Save Product
                  </Button>
                </div>
              </Show>

              <Show when={editorState() === EditorState.SCHEDULE}>
                <Show when={!schedules.loading} fallback={<p>Loading schedules...</p>}>
                  {/* Schedule List Sorted by Time (one button per time slot) */}
                  <div class="flex flex-wrap gap-2 mb-2">
                    <For each={(() => {
                      const allSchedules = schedules() ?? [];
                      const grouped: Record<string, ScheduleFormData[]> = {};

                      // Group schedules by time
                      allSchedules.forEach(s => {
                        const key = `${new Date(s.startTime).getTime()}-${new Date(s.endTime).getTime()}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(s);
                      });

                      return Object.values(grouped);
                    })()}>
                      {(slotGroup) => {
                        const s = slotGroup[0];
                        const days = slotGroup.map(s => s.dayOfWeek);
                        const isSelected = days.some(day => selectedDays().includes(day));

                        return (
                          <Button
                            class={`btn text-sm ${isSelected ? "btn-selected" : "btn-unselected"}`}
                            onClick={() => {
                              setSelectedScheduleId(s.id);

                              setSelectedDays(days);
                              updateScheduleField("startTime", new Date(s.startTime));
                              updateScheduleField("endTime", new Date(s.endTime));
                            }}
                          >
                            {`${new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                          </Button>
                        );
                      }}
                    </For>

                    {/* Add Schedule */}
                    <Button
                      class="btn btn-primary mt-2"
                      onClick={() => {
                        setSelectedScheduleId(null);
                        setSelectedDays([]);
                        setScheduleForm({
                          productId: selectedProductId() ?? 0,
                          dayOfWeek: 0,
                          startTime: new Date(),
                          endTime: new Date(),
                        });
                      }}
                    >
                      + Add Schedule
                    </Button>
                  </div>

                  {/* Schedule Editor Form */}
                  <Show when={selectedScheduleId() !== undefined || selectedScheduleId() === null}>
                    <div class="border rounded-lg p-4 flex flex-col gap-4 mt-4">
                      <h2 class="font-semibold text-lg">Schedule Editor</h2>

                      {/* Multi-Day Picker */}
                      <div class="flex flex-wrap gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => {
                          const selected = selectedDays().includes(index);
                          return (
                            <button
                              type="button"
                              class={`btn text-sm ${selected ? "btn-selected" : "btn-unselected"}`}
                              onClick={() => {
                                const current = selectedDays();
                                const newDays = current.includes(index)
                                  ? current.filter(d => d !== index) // deselect
                                  : [...current, index];             // select
                                setSelectedDays(newDays);
                                updateScheduleField("selectedDays", newDays);
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Start Time */}
                      <div class="flex flex-col gap-1">
                        <label class="text-sm text-gray-600">Start Time</label>
                        <input
                          type="time"
                          class="border rounded px-3 py-2"
                          value={scheduleForm().startTime.toISOString().substring(11, 16)}
                          onInput={(e) => {
                            const [h, m] = e.currentTarget.value.split(":").map(Number);
                            const date = new Date(scheduleForm().startTime);
                            date.setHours(h, m);
                            updateScheduleField("startTime", date);
                          }}
                        />
                      </div>

                      {/* End Time */}
                      <div class="flex flex-col gap-1">
                        <label class="text-sm text-gray-600">End Time</label>
                        <input
                          type="time"
                          class="border rounded px-3 py-2"
                          value={scheduleForm().endTime.toISOString().substring(11, 16)}
                          onInput={(e) => {
                            const [h, m] = e.currentTarget.value.split(":").map(Number);
                            const date = new Date(scheduleForm().endTime);
                            date.setHours(h, m);
                            updateScheduleField("endTime", date);
                          }}
                        />
                      </div>

                      {/* Save Button */}
                      <Button
                        class="btn mt-2"
                        onClick={() => {
                          const days = selectedDays();
                          days.forEach(day => {
                            console.log("Save schedule for day", day, scheduleForm());
                            // TODO: API call for each day with startTime/endTime
                          });
                        }}
                      >
                        Save Schedule
                      </Button>
                    </div>
                  </Show>
                </Show>
              </Show>
            </Show>
          </div>
        </Show>
      </div >
    </main >
  );
}