"use client";

import { STATUS_TONE, StatusIcon } from "./StatusBadge";
import { STATUS_LABELS, WISH_STATUSES, canSetStatus, type WishStatus } from "@/lib/types";

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
        // Done stays locked until the wish has been approved.
        const allowed = active || canSetStatus(value, status);
        return (
          <button
            key={status}
            type="button"
            disabled={busy || !allowed}
            onClick={() => !active && onChange(status)}
            aria-pressed={active}
            title={
              allowed
                ? undefined
                : `Approve it first, then it can be marked ${STATUS_LABELS[status]}`
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active
                ? STATUS_TONE[status]
                : allowed
                  ? "border-hairline text-muted hover:border-gold-soft hover:text-ink"
                  : "cursor-not-allowed border-hairline/60 text-muted/40"
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
