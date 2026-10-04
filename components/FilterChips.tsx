"use client";

import { STATUS_LABELS, WISH_STATUSES, type WishStatus } from "@/lib/types";

const chip = (active: boolean) =>
  `rounded-full border px-4 py-2 text-xs uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
    active
      ? "border-gold bg-gold-soft/40 text-ink"
      : "border-hairline text-muted hover:border-gold-soft hover:text-ink"
  }`;

export function FilterChips({
  status,
  onStatusChange,
  tags,
  activeTag,
  onTagChange,
  counts,
}: {
  status: WishStatus | "all";
  onStatusChange: (status: WishStatus | "all") => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  counts: Record<WishStatus | "all", number>;
}) {
  return (
    <div className="space-y-3">
      <div className="scroll-row -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(["all", ...WISH_STATUSES] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(value)}
            aria-pressed={status === value}
            className={chip(status === value)}
          >
            {value === "all" ? "Everything" : STATUS_LABELS[value]}
            <span className="ml-1.5 text-gold">{counts[value]}</span>
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="scroll-row -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => onTagChange(null)}
            aria-pressed={activeTag === null}
            className={chip(activeTag === null)}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={chip(activeTag === tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
