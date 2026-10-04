import { STATUS_LABELS, type WishStatus } from "@/lib/types";

/** One look per status, shared by the badge and the admin picker. */
export const STATUS_TONE: Record<WishStatus, string> = {
  wishing: "border-gold-soft bg-gold-soft/35 text-ink",
  approved: "border-sage-soft bg-sage-soft/60 text-sage",
  rejected: "border-rose-soft bg-rose-tint text-rose",
  done: "border-gold bg-gold/15 text-gold",
};

const ICONS: Record<WishStatus, React.ReactNode> = {
  wishing: <path d="M10 5.5v5l3 2" strokeLinecap="round" strokeLinejoin="round" />,
  approved: <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />,
  rejected: <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" strokeLinecap="round" />,
  done: (
    <>
      <path d="M10 3.2l1.9 4 4.4.6-3.2 3 .8 4.3-3.9-2.1-3.9 2.1.8-4.3-3.2-3 4.4-.6z" strokeLinejoin="round" />
    </>
  ),
};

export function StatusIcon({ status, className }: { status: WishStatus; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className ?? "h-3.5 w-3.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {ICONS[status]}
    </svg>
  );
}

export function StatusBadge({ status }: { status: WishStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs tracking-wide ${STATUS_TONE[status]}`}
    >
      <StatusIcon status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}
