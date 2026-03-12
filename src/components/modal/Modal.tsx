import { createSignal, JSX } from "solid-js";
import { MdFillAdd, MdFillClose } from 'solid-icons/md';

type ModalProps = {
  title: string;
  children: JSX.Element;
  triggerLabel?: string;
  triggerClass?: string;
};

export default function Modal(props: ModalProps) {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <button class={props.triggerClass ?? "btn"} onClick={() => setOpen(true)}>
        <div class="flex items-center gap-2">
          <MdFillAdd />
          {props.triggerLabel ?? "Open"}
        </div>
      </button>

      {open() && (
        <>
          {/* Overlay */}
          <div
            class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div class="pointer-events-auto inline-flex flex-col border border-[hsl(240_5%_84%)] rounded-[10px] p-[30px] bg-[var(--color-bg)] shadow-lg">
              <div class="flex items-baseline justify-between mb-[12px]">
                <h2 class="text-2xl font-[var(--font-weight-bold)] mb-5">{props.title}</h2>
                <button onClick={() => setOpen(false)}>
                  <MdFillClose />
                </button>
              </div>
              <div class="flex flex-col gap-5">
                {props.children}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}