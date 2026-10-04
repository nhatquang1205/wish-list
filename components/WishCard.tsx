"use client";

import { useState } from "react";
import { HeartRating } from "./HeartRating";
import { StatusBadge } from "./StatusBadge";
import { StatusPicker } from "./StatusPicker";
import { storeLabel } from "@/lib/stores";
import { safeUrl, type Wish, type WishStatus } from "@/lib/types";
import type { Role } from "@/lib/auth";

export function WishCard({
  wish,
  role,
  onOpen,
  onDelete,
  onStatusChange,
}: {
  wish: Wish;
  role: Role;
  onOpen: (wish: Wish) => void;
  onDelete: (wish: Wish) => void;
  onStatusChange: (wish: Wish, status: WishStatus) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const link = safeUrl(wish.url);
  const image = safeUrl(wish.imageUrl);
  const shop = storeLabel(link);
  const settled = wish.status === "rejected" || wish.status === "done";
  const isNina = role !== "admin";
  // Nina removes a wish only while it is still waiting to be seen.
  const removable = isNina && wish.status === "wishing";

  /**
   * Shared between both roles. For Nina it sits inside a button that opens the
   * detail view, so nothing in here may be interactive itself.
   */
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-rose-tint">
        {image && !imageFailed ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-tint via-cream-deep to-gold-soft"
          >
            <span className="font-serif text-5xl text-rose/70">
              {wish.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 backdrop-blur-sm">
          <StatusBadge status={wish.status} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="font-serif text-xl leading-snug text-ink">{wish.title}</h2>
          {shop && <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{shop}</p>}
        </div>

        <HeartRating value={wish.rating} />

        {wish.note && <p className="text-sm leading-relaxed text-muted">{wish.note}</p>}

        {wish.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {wish.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-2">
          <div className="hairline mb-3" />
          {wish.status === "wishing" ? (
            <p className="text-xs text-muted">Waiting to be seen</p>
          ) : wish.adminNote ? (
            <p className="text-sm italic leading-relaxed text-ink/80">“{wish.adminNote}”</p>
          ) : (
            <p className="text-xs text-muted">No note left</p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article
      className={`group animate-rise relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-card card-shadow transition-opacity ${
        settled ? "opacity-75" : ""
      }`}
    >
      {removable && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${wish.title}`}
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-muted backdrop-blur-sm transition-colors hover:text-rose"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 6h12M8.5 6V4.5h3V6M6 6l.7 9.5h6.6L14 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {isNina ? (
        <button
          type="button"
          onClick={() => onOpen(wish)}
          aria-label={`Open ${wish.title}`}
          className="flex flex-1 flex-col text-left"
        >
          {body}
        </button>
      ) : (
        <>
          {body}
          <div className="px-5 pb-5">
            <StatusPicker value={wish.status} onChange={(next) => onStatusChange(wish, next)} />
          </div>
        </>
      )}

      {confirming && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex animate-fade items-center justify-between gap-2 border-t border-hairline bg-card/95 px-4 py-3 backdrop-blur-sm">
          <span className="text-xs text-muted">Remove this wish?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.12em] text-muted hover:text-ink"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={() => onDelete(wish)}
              className="rounded-full bg-rose px-4 py-2 text-xs uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
