import { createSignal, Show, JSX } from "solid-js";
import Button from "../button/Button";
import { AiOutlineCloseCircle } from 'solid-icons/ai'

type ConfirmationModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal(props: ConfirmationModalProps) {
  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs"
        onClick={props.onCancel}
      >
        <div
          class="flex flex-col gap-[20px] bg-[var(--color-bg)] rounded-lg shadow-lg max-w-md w-full p-6 relative "
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex justify-center">
            <AiOutlineCloseCircle size={60} color="var(--color-accent-1)" />
          </div>
          {/* Title */}
          <h3>
            {props.title ?? "Confirm Action"}
          </h3>

          {/* Message */}
          <p class="body-2">
            {props.message ?? "Are you sure you want to proceed?"}
          </p>

          {/* Buttons */}
          <div class="flex justify-center gap-3">
            <Button
              onClick={props.onCancel}
              class="px-4 py-2 rounded-lg bg-[var(--color-footer)]/30 text-gray-800 hover:bg-[var(--color-footer)]/20"
            >
              {props.cancelText ?? "Cancel"}
            </Button>
            <Button
              onClick={props.onConfirm}
              class="px-4 py-2 rounded-lg bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-2)]"
            >
              {props.confirmText ?? "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}
