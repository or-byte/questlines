import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import Button from "~/components/button/Button";
import { Skeleton } from "@kobalte/core/skeleton";
import { getHostBySlug, getHostInformation, HostFormData, Information, InformationFormData, updateHost } from "~/lib/host";
import { createNewProduct, getProductsByVenueId, ProductFormData, updateProduct } from "~/lib/products";
import { createNewVenue, getVenuesByHost, updateVenue, VenueFormData } from "~/lib/venue";
import { createNewSchedule, deleteSchedule, getSchedules, ScheduleFormData, updateSchedule } from "~/lib/schedule";

enum EditorStates {
  HOST,
  VENUE,
  INFORMATION,
  PRODUCT,
  SCHEDULE,
  EVENT
}

const editorLabels = {
  [EditorStates.HOST]: "Host",
  [EditorStates.VENUE]: "Venue",
  [EditorStates.INFORMATION]: "Information",
  [EditorStates.PRODUCT]: "Product",
  [EditorStates.SCHEDULE]: "Schedule",
  [EditorStates.EVENT]: "Event",
};

export default function HostAdminDashboard() {
  const params = useParams();

  const [editorState, setEditorState] = createSignal<EditorStates>(EditorStates.PRODUCT);

  // Host State
  const [host, { refetch: refetchHost }] = createResource(() => params.host, getHostBySlug);

  const [hostForm, setHostForm] = createSignal<HostFormData>({
    slug: "",
    name: "",
    description: "",
  });

  const updateHostForm = <K extends keyof HostFormData>(
    field: K,
    value: HostFormData[K]
  ) => {
    setHostForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  const handleToggleEditHost = async () => {
    setEditorState(EditorStates.HOST);
    setHostForm({
      slug: host()?.slug,
      name: host()?.name,
      description: host()?.description,
    })
  }

  const handleUpdateHost = async () => {
    const data = hostForm();

    try {
      await updateHost(host()?.id, data);
      refetchHost();
    } catch (err) {
      console.error("Failed to save changes when editing host", err);
    }
  };

  // Venue States
  const [venues, { refetch: refetchVenue }] = createResource(() => host()?.id, getVenuesByHost);
  const [selectedVenueId, setSelectedVenue] = createSignal();

  const [venueForm, setVenueForm] = createSignal<VenueFormData>({
    slug: "",
    name: "",
    description: "",
    address: "",
    hostId: host()?.id
  });

  const updateVenueForm = <K extends keyof VenueFormData>(
    field: K,
    value: VenueFormData[K]
  ) => {
    setVenueForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  const handleToggleEditVenue = async () => {
    setEditorState(EditorStates.VENUE);
    hydrateVenueEditor();
  }

  const hydrateVenueEditor = () => {
    const venueId = selectedVenueId();
    const venueList = venues();

    if (!venueId || !venueList) return;

    const venue = venueList.find(v => v.id === venueId);
    if (!venue) return;

    setVenueForm({
      slug: venue.slug,
      name: venue.name,
      description: venue.description,
      address: venue.address,
      hostId: venue.hostId
    });
  };

  const handleAddVenue = () => {
    setEditorState(EditorStates.VENUE);
    setSelectedVenue(null);

    setVenueForm({
      slug: "",
      name: "",
      description: "",
      address: "",
      hostId: host()?.id
    });
  };

  const handleUpdateVenue = async () => {
    const data = venueForm();
    const venueId = selectedVenueId();

    try {
      if (venueId === null) {
        // CREATE
        await createNewVenue(data);
        alert("Venue created!");
      } else {
        // UPDATE
        await updateVenue(venueId, data);
        alert("Venue updated!");
      }

      setSelectedVenue(undefined);
      refetchVenue();

    } catch (err) {
      console.error("Failed to save venue", err);
    }
  };

  // Information states
  const [hostInfo] = createResource(() => host()?.id, getHostInformation);
  const [informationForm, setInformationForm] = createSignal<InformationFormData>({
    header: "",
    body: []
  });

  const updateInformationForm = <K extends keyof InformationFormData>(
    field: K,
    value: InformationFormData[K]
  ) => {
    setInformationForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  const handleToggleEditInformation = async () => {
    setEditorState(EditorStates.INFORMATION);
  }

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

  const updateProductField = <K extends keyof ProductFormData>(
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
    hydrateVenueEditor();
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
  const [schedules, { refetch: refetchSchedules }] = createResource(() => selectedProductId(), getSchedules);
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

  const handleSaveSchedule = async () => {
    const form = scheduleForm();             // current start/end time
    const productId = selectedProductId();   // current selected product
    const allSchedules = schedules() ?? [];  // all schedules for this product

    // Get schedules with the same time as current form
    const existingSchedules = allSchedules.filter(s =>
      new Date(s.startTime).getTime() === form.startTime.getTime() &&
      new Date(s.endTime).getTime() === form.endTime.getTime()
    );

    const existingDays = existingSchedules.map((s) => s.dayOfWeek);
    const newDays = selectedDays();

    const daysToDelete = existingDays.filter((d) => !newDays.includes(d));
    const daysToCreate = newDays.filter((d) => !existingDays.includes(d));

    try {
      // DELETE removed days
      for (const day of daysToDelete) {
        const schedule = existingSchedules.find(s => s.dayOfWeek === day);
        if (schedule) {
          await deleteSchedule(schedule.id);
        }
      }

      // CREATE new days
      for (const day of daysToCreate) {
        await createNewSchedule({
          productId: productId,
          dayOfWeek: day,
          startTime: form.startTime,
          endTime: form.endTime
        });
      }

      refetchSchedules();

      alert("Schedule saved!");
    } catch (err) {
      console.error("Failed to save schedule", err);
    }
  };

  return (
    <main>
      <Title>Host Editor</Title>

      <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
        <Show when={!host.loading} fallback={<Skeleton class="skeleton w-48 h-8 rounded-md mb-6" />}>
          <h2 class="text-xl font-semibold mb-6">
            {host()?.name}
          </h2>

          {/* Action Buttons */}
          <div class="flex flex-wrap gap-3 mb-6">
            <Button
              class={`${editorState() === EditorStates.HOST ? "btn-selected" : "btn-unselected"}`}
              onclick={handleToggleEditHost}>
              Edit Host
            </Button>
            <Button
              class={`${editorState() === EditorStates.VENUE ? "btn-selected" : "btn-unselected"}`}
              onclick={handleToggleEditVenue}>
              Edit Venue
            </Button>
            <Button
              class={`${editorState() === EditorStates.INFORMATION ? "btn-selected" : "btn-unselected"}`}
              onclick={handleToggleEditInformation}>
              Edit Info
            </Button>
            <Button
              class={`${editorState() === EditorStates.PRODUCT ? "btn-selected" : "btn-unselected"}`}
              onClick={[handleSelectEditorState, EditorStates.PRODUCT]}>
              Edit Products
            </Button>

            <Button
              class={`${editorState() === EditorStates.SCHEDULE ? "btn-selected" : "btn-unselected"}`}
              onClick={[handleSelectEditorState, EditorStates.SCHEDULE]}>
              Edit Timeslots
            </Button>

            <Button
              class={`${editorState() === EditorStates.EVENT ? "btn-selected" : "btn-unselected opacity-50 cursor-not-allowed"}`}
              disabled>
              Create Events (coming soon)
            </Button>
          </div>

          {/* Current Editor State */}
          <p class="text-sm text-gray-500 mb-4">
            Currently editing {editorLabels[editorState()]}
          </p>

          {/* Host Editor */}
          <Show when={editorState() === EditorStates.HOST}>
            <div class="border rounded-lg p-4 flex flex-col gap-4 md:col-span-2 lg:col-span-2">

              <h2 class="font-semibold text-lg">Host Editor</h2>

              {/* Slug */}
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">Slug</label>
                <input
                  class="border rounded px-3 py-2"
                  value={hostForm().slug}
                  onInput={(e) => updateHostForm("slug", e.currentTarget.value)}
                />
              </div>

              {/* Name */}
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">Name</label>
                <input
                  class="border rounded px-3 py-2"
                  value={hostForm().name}
                  onInput={(e) => updateHostForm("name", e.currentTarget.value)}
                />
              </div>

              {/* Description */}
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">Description</label>
                <input
                  class="border rounded px-3 py-2"
                  value={hostForm().description}
                  onInput={(e) => updateHostForm("description", e.currentTarget.value)}
                />
              </div>

              {/* Save button */}
              <Button class="btn mt-2" onClick={handleUpdateHost}>
                Save Changes
              </Button>
            </div>
          </Show>

          {/* Venues */}
          <div class="flex flex-col gap-2">

            <Show
              when={!venues.loading && (editorState() === EditorStates.PRODUCT || editorState() === EditorStates.SCHEDULE || editorState() === EditorStates.VENUE)}
              fallback={
                <div class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2">
                  <For each={[1, 2, 3, 4]}>
                    {() => (
                      <Skeleton class="skeleton w-full h-20 rounded-lg" />
                    )}
                  </For>
                </div>
              }
            >
              <h3 class="text-sm font-semibold">Venues</h3>

              <div class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2"></div>
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

              <Button
                class="btn btn-primary mt-4"
                onClick={handleAddVenue}>
                + Add Venue
              </Button>
            </Show>
          </div>

          {/* Venue Editor */}
          <Show when={editorState() === EditorStates.VENUE}>
            <Show when={selectedVenueId() !== undefined}
              fallback={
                <div>Please select a venue to edit...</div>
              }>

              <div class="border rounded-lg p-4 flex flex-col gap-4 md:col-span-2 lg:col-span-2 mt-4">

                <h2 class="font-semibold text-lg">{selectedVenueId() === null ? "Add new venue" : "Edit Venue" }</h2>

                {/* Slug */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Slug</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={venueForm().slug}
                    onInput={(e) => updateVenueForm("slug", e.currentTarget.value)}
                  />
                </div>

                {/* Name */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Name</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={venueForm().name}
                    onInput={(e) => updateVenueForm("name", e.currentTarget.value)}
                  />
                </div>

                {/* Description */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Description</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={venueForm().description}
                    onInput={(e) => updateVenueForm("description", e.currentTarget.value)}
                  />
                </div>

                {/* Address */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Address</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={venueForm().address}
                    onInput={(e) => updateVenueForm("address", e.currentTarget.value)}
                  />
                </div>

                {/* Save button */}
                <Button class="btn mt-2" onClick={handleUpdateVenue}>
                  Save Changes
                </Button>
              </div>
            </Show>
          </Show>


          {/* Products List */}
          <div class="flex flex-col gap-2 mt-4">

            <div class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2">
              <Show
                when={!products.loading && products() && (editorState() === EditorStates.PRODUCT || editorState() === EditorStates.SCHEDULE)}
                fallback={
                  <div class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2">
                    <For each={[1, 2, 3, 4]}>
                      {() => (
                        <Skeleton class="skeleton w-full h-20 rounded-lg" />
                      )}
                    </For>
                  </div>
                }
              >
                <h3 class="text-sm font-semibold">Products</h3>

                <For each={products()}>
                  {(p) => (
                    <Button
                      class={`min-w-[140px] text-left ${selectedProductId() === p.id ? "btn-selected" : "btn-unselected"}`}
                      onClick={[handleSelectProduct, p.id]}
                    >
                      {p.name}
                    </Button>
                  )}
                </For>

                {/* Add Product */}
                <Button
                  class="btn btn-primary mt-4 min-w-[140px]"
                  onClick={handleAddProduct}
                >
                  + Add Product
                </Button>
              </Show>
            </div>
          </div>

          <Show when={selectedProductId() !== undefined}>
            <Show when={editorState() === EditorStates.PRODUCT}>
              {/* Product Editor */}
              <div class="border rounded-lg p-4 flex flex-col gap-4 md:col-span-2 lg:col-span-2">

                <h2 class="font-semibold text-lg">Product Editor</h2>

                {/* Sku */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">SKU</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={productForm().sku}
                    onInput={(e) => updateProductField("sku", e.currentTarget.value)}
                  />
                </div>

                {/* Name */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Name</label>
                  <input
                    class="border rounded px-3 py-2"
                    value={productForm().name}
                    onInput={(e) => updateProductField("name", e.currentTarget.value)}
                  />
                </div>

                {/* Descriptoin */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Description</label>
                  <textarea
                    class="border rounded px-3 py-2"
                    rows="3"
                    value={productForm().description}
                    onInput={(e) => updateProductField("description", e.currentTarget.value)}
                  />
                </div>

                {/* Price */}
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Price</label>
                  <input
                    type="number"
                    class="border rounded px-3 py-2"
                    value={productForm().price}
                    onInput={(e) => updateProductField("price", Number(e.currentTarget.value))}
                  />
                </div>

                {/* Save button */}
                <Button class="btn mt-2" onClick={handleSaveProduct}>
                  Save Product
                </Button>
              </div>
            </Show>

            <Show when={editorState() === EditorStates.SCHEDULE}>
              <Show when={!schedules.loading} fallback={<p>Loading schedules...</p>}>
                {/* Schedule List Sorted by Time */}
                <div class="flex flex-col gap-2">
                  <h3 class="text-sm font-semibold">Time Slots</h3>

                  <div class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2">
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
                            class={`min-w-[120px] btn text-sm ${isSelected ? "btn-selected" : "btn-unselected"}`}
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
                      class="btn btn-primary mt-2 min-w-[120px]"
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
                </div>

                {/* Schedule Editor */}
                <Show when={selectedScheduleId() !== undefined || selectedScheduleId() === null}>
                  <div class="border rounded-lg p-4 flex flex-col gap-4 md:col-span-2 lg:col-span-2">
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
                        value={scheduleForm().startTime.toTimeString().substring(0, 5)}
                        onInput={(e) => {
                          const [h, m] = e.currentTarget.value.split(":").map(Number);
                          const current = scheduleForm().startTime;
                          const updated = new Date(current);
                          updated.setHours(h, m, 0, 0);
                          updateScheduleField("startTime", updated);
                        }}
                      />
                    </div>

                    {/* End Time */}
                    <div class="flex flex-col gap-1">
                      <label class="text-sm text-gray-600">End Time</label>
                      <input
                        type="time"
                        class="border rounded px-3 py-2"
                        value={scheduleForm().endTime.toTimeString().substring(0, 5)}
                        onInput={(e) => {
                          const [h, m] = e.currentTarget.value.split(":").map(Number);
                          const current = scheduleForm().endTime;
                          const updated = new Date(current);
                          updated.setHours(h, m, 0, 0);
                          updateScheduleField("endTime", updated);
                        }}
                      />
                    </div>

                    {/* Save Button */}
                    <Button
                      class="btn mt-2"
                      onClick={handleSaveSchedule}
                    >
                      Save Schedule
                    </Button>
                  </div>
                </Show>
              </Show>
            </Show>
          </Show>
        </Show>
      </div >
    </main >
  );
}