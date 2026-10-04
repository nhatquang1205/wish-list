"use client";

import { STATUS_TONE, StatusIcon } from "./StatusBadge";
import { STATUS_LABELS, WISH_STATUSES, type WishStatus } from "@/lib/types";

/** Admin-only control. Nina's cards show a StatusBadge instead. */
export function StatusPicker({
  value,
  onChange,
  busy,
}: {
  value: WishStatus;
  onChange: (status: WishStatus) => void;
  busy?: boolean;
}) {
  return (
    <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5">
      {WISH_STATUSES.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() => !active && onChange(status)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-60 ${
              active
                ? STATUS_TONE[status]
                : "border-hairline text-muted hover:border-gold-soft hover:text-ink"
            }`}
          >
            <StatusIcon status={status} className="h-3 w-3" />
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
