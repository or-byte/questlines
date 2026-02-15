import Button from "~/components/button/Button";

type SummaryRow = {
  label: string
  value: string
}

type BookingSummaryProps = {
  rows: SummaryRow[]
  total: string
  buttonLabel?: string
  onBook?: () => void
}

export default function BookingSummary(props: BookingSummaryProps) {
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
      >
        {props.buttonLabel ?? 'Book Now'}
      </Button>

    </section>
  )
}
