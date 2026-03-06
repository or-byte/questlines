import { createSignal, For } from "solid-js";
import { Button } from "@kobalte/core/button";

type CarouselProps = {
  images: string[];
};

export default function Carousel(props: CarouselProps) {
  const [index, setIndex] = createSignal(0);

  const prev = () =>
    setIndex((i) => (i === 0 ? props.images.length - 1 : i - 1));

  const next = () =>
    setIndex((i) => (i === props.images.length - 1 ? 0 : i + 1));

  return (
    <section>
      <div class="relative w-full overflow-hidden rounded-lg h-[200px] sm:h-[250px] md:h-[300px]">
        {/* Slider */}
        <div
          class="flex transition-transform duration-500 ease-in-out bg-[var(--color-accent-4)]"
          style={{
            transform: `translateX(-${index() * 100}%)`,
          }}
        >
          <For each={props.images}>
            {(image) => (
              <div class="min-w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <img
                  src={image}
                  alt="User Image"
                  class="w-full h-full object-cover"
                />
              </div>
            )}
          </For>
        </div>

        {/* Controls */}
        <div class="absolute inset-0 flex items-center justify-between px-4">
          <Button
            onClick={prev}
            class="bg-[var(--color-bg)]/20 text-white px-3 py-2 rounded-full hover:bg-[var(--color-bg)]/60 transition-colors duration-200 cursor-pointer"
          >
            ‹
          </Button>

          <Button
            onClick={next}
            class="bg-[var(--color-bg)]/20 text-white px-3 py-2 rounded-full hover:bg-[var(--color-bg)]/60 transition-colors duration-200 cursor-pointer"
          >
            ›
          </Button>
        </div>
      </div>
      {/* Dots */}
      <div class="flex justify-center mt-4 gap-2">
        <For each={props.images}>
          {(image, i) => (
            <span class={`w-2 h-2 rounded-full cursor-pointer transition-colors duration-200
                    ${i() === index() ? "bg-[var(--color-accent-1)]" : "bg-[var(--color-accent-4)]"}`}
              onClick={() => setIndex(i())}></span>
          )}
        </For>
      </div>
    </section>
  );
}
