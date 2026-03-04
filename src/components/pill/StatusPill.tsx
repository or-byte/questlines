import { MdFillCircle } from 'solid-icons/md'

type StatusPillProps = {
  status: "open" | "closed";
}

export default function StatusPill(props: StatusPillProps) {
  const statusColor = props.status === "open" ? 'text-[var(--color-success-2)]' : "text-[var(--color-error-1)]";
  const statusColorBg = props.status === "open" ? 'bg-[var(--color-success-3)]' : "bg-[var(--color-footer)]/20";
  const statusColorText = props.status === "open" ? 'text-[var(--color-success-1)]' : "text-[var(--color-footer)]";
  const statusText = props.status === "open" ? "Open" : "Closed";

  return (
    <div class={`${statusColorBg} rounded-full px-2 py-1 flex items-center gap-1`}>
      <MdFillCircle size={12} class={statusColor} />
      <p class={`body-3 ${statusColorText}`}>{statusText}</p>
    </div>
  );
}
