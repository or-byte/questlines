import Button from "~/components/button/Button";
import { Switch, Match, createSignal, onMount, onCleanup } from "solid-js";

type SummaryRow = {
  label: string
  value: string
}

type BookingSummaryProps = {
  rows: SummaryRow[]
  total: string
  buttonLabel?: string
  onBook?: () => void
  bookingState: "FAILED" | "LOADING" | "default"
  timeLeft?: number
}

export default function BookingSummary(props: BookingSummaryProps) {
  const [timeLeft, setTimeLeft] = createSignal(props.timeLeft ?? 0);

  onMount(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    onCleanup(() => clearInterval(timer));
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section class="space-y-6 w-full">
      <div class="space-y-3">
        {props.rows.map((row) => (
          <div class="flex items-center justify-between text-sm">
            <span>{row.label}</span>
            <span class="font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      <div class="border-t border-neutral-300 pt-4 flex items-center justify-between">
        <span class="font-medium">Total:</span>
        <span class="font-semibold">{`${props.total}`}</span>
      </div>

      <Button
        onClick={props.onBook}
        class="btn w-full"
        disabled={props.bookingState !== "default"}
      >
        <Switch>
          {/* loading */}
          <Match when={props.bookingState === "LOADING"}>
            <div class="flex justify-center items-center gap-3">
              <p class="body-1">Processing...</p>
              <div class="spinner"></div>
            </div>
          </Match>

          {/* existing booking */}
          <Match when={props.bookingState === "FAILED"}>
            Please try again in {formatTime(timeLeft())}
          </Match>

          {/* default */}
          <Match when={true}>
            {props.buttonLabel ?? "Book Now"}
          </Match>
        </Switch>
      </Button>

    </section >
  )
}
