"use client";

import { useEffect, useState } from "react";
import { HeartRating } from "./HeartRating";
import { StatusBadge } from "./StatusBadge";
import { storeLabel } from "@/lib/stores";
import { safeUrl, type Wish } from "@/lib/types";

/** Nina's read view, opened by tapping a card. */
export function WishDetail({
  wish,
  onClose,
  onEdit,
  onDelete,
}: {
  wish: Wish;
  onClose: () => void;
  onEdit: (wish: Wish) => void;
  onDelete: (wish: Wish) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const link = safeUrl(wish.url);
  const image = safeUrl(wish.imageUrl);
  const shop = storeLabel(link);
  // Only an untouched wish can still be changed or taken back.
  const open = wish.status === "wishing";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={wish.title}
        className="relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-[28px] border border-hairline bg-card pb-8 card-shadow sm:max-w-lg sm:rounded-[24px]"
      >
        {image && !imageFailed && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-[28px] bg-rose-tint sm:rounded-t-[24px]">
            <img
              src={image}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-muted backdrop-blur-sm transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
          </svg>
        </button>

        <div className="px-6 pt-6">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline sm:hidden" />

          <StatusBadge status={wish.status} />

          <h2 className="mt-3 font-serif text-3xl leading-snug text-ink">{wish.title}</h2>
          {shop && <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{shop}</p>}

          <div className="mt-4">
            <HeartRating value={wish.rating} size="lg" />
          </div>

          {wish.note && (
            <p className="mt-4 text-sm leading-relaxed text-muted">{wish.note}</p>
          )}

          {wish.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
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

          {wish.adminNote && !open && (
            <div className="mt-5 rounded-xl border border-gold-soft bg-gold-soft/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gold">A word back</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{wish.adminNote}</p>
            </div>
          )}

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-full border border-hairline py-3 text-sm uppercase tracking-[0.12em] text-ink transition-colors hover:bg-rose-tint"
            >
              Open the link
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 4h8v8M16 4 7 13M4 9v7h7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {open && (
            <>
              <div className="hairline my-6" />
              {confirming ? (
                <div className="flex animate-fade items-center justify-between gap-2">
                  <span className="text-sm text-muted">Remove this wish?</span>
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
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="flex-1 rounded-full border border-hairline py-3 text-sm uppercase tracking-[0.12em] text-muted transition-colors hover:bg-rose-tint hover:text-rose"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(wish)}
                    className="flex-1 rounded-full bg-gold py-3 text-sm uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                  >
                    Edit
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
