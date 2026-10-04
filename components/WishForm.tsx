"use client";

import { useEffect, useRef, useState } from "react";
import { HeartRating } from "./HeartRating";
import { PhotoPicker } from "./PhotoPicker";
import { isHttpUrl, type Wish, type WishInput } from "@/lib/types";

const EMPTY = {
  title: "",
  url: "",
  imagePath: null as string | null,
  /** Display only — the wish records the path, never this. */
  imagePreview: null as string | null,
  note: "",
  rating: 5,
  tags: "",
};

const fieldClass =
  "w-full rounded-xl border border-hairline bg-cream/60 px-4 py-3 text-ink placeholder:text-muted/60 transition-colors focus:border-gold focus:bg-card";

const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted";

export function WishForm({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Wish | null;
  onClose: () => void;
  onSubmit: (input: WishInput) => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      editing
        ? {
            title: editing.title,
            url: editing.url ?? "",
            imagePath: editing.imagePath,
            imagePreview: editing.imageUrl,
            note: editing.note ?? "",
            rating: editing.rating,
            tags: editing.tags.join(", "),
          }
        : EMPTY,
    );
    const timer = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const title = form.title.trim();
    if (!title) return setError("Give it a name first.");
    if (form.url.trim() && !isHttpUrl(form.url.trim())) {
      return setError("The store link needs to start with http:// or https://");
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        url: form.url.trim() || null,
        imagePath: form.imagePath,
        note: form.note.trim() || null,
        rating: form.rating,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

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
        aria-label={editing ? "Edit wish" : "Add a wish"}
        className="relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-[28px] border border-hairline bg-card px-6 pb-8 pt-6 card-shadow sm:max-w-lg sm:rounded-[24px]"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-ink">{editing ? "Edit this wish" : "A new wish"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-rose-tint"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className={labelClass}>
              What is it?
            </label>
            <input
              id="title"
              ref={titleRef}
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Don't hesitate"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="url" className={labelClass}>
              Store link
            </label>
            <input
              id="url"
              type="url"
              inputMode="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="Paste the link"
              className={fieldClass}
            />
          </div>

          <PhotoPicker
            path={form.imagePath}
            preview={form.imagePreview}
            onChange={(path, url) =>
              setForm((prev) => ({ ...prev, imagePath: path, imagePreview: url }))
            }
          />

          <div>
            <span className={labelClass}>How much do you love it?</span>
            <HeartRating value={form.rating} onChange={(v) => set("rating", v)} size="lg" />
          </div>

          <div>
            <label htmlFor="note" className={labelClass}>
              Note <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={3}
              maxLength={500}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Size M, the cream colour one"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags <span className="normal-case tracking-normal">(comma separated)</span>
            </label>
            <input
              id="tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="skincare, clothes, someday"
              className={fieldClass}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-sm text-rose">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-hairline py-3 text-sm uppercase tracking-[0.12em] text-muted transition-colors hover:bg-rose-tint"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-gold py-3 text-sm uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save" : "Add to list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
