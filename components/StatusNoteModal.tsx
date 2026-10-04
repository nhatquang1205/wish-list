"use client";

import { useEffect, useRef, useState } from "react";
import { StatusIcon } from "./StatusBadge";
import { STATUS_LABELS, requiresNote, type Wish, type WishStatus } from "@/lib/types";

const COPY: Partial<Record<WishStatus, { heading: string; hint: string; placeholder: string }>> = {
  approved: {
    heading: "Saying yes",
    hint: "A line she'll see on the card. Optional.",
    placeholder: "For your birthday — already ordered it",
  },
  rejected: {
    heading: "Saying not this one",
    hint: "Tell her why, so it isn't just a no.",
    placeholder: "Too close to the trip, let's look again in May",
  },
};

/** Shown to the admin before an Approved or Rejected actually lands. */
export function StatusNoteModal({
  wish,
  status,
  onCancel,
  onConfirm,
}: {
  wish: Wish;
  status: WishStatus;
  onCancel: () => void;
  onConfirm: (note: string | null) => Promise<void>;
}) {
  const [note, setNote] = useState(status === wish.status ? (wish.adminNote ?? "") : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const copy = COPY[status] ?? COPY.approved!;
  const mustExplain = requiresNote(status);

  useEffect(() => {
    const timer = setTimeout(() => noteRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const trimmed = note.trim();
    if (mustExplain && !trimmed) return setError("Say why, so she knows.");

    setSaving(true);
    setError(null);
    try {
      await onConfirm(trimmed || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade bg-ink/25 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={`${STATUS_LABELS[status]} — add a note`}
        className="relative w-full animate-rise rounded-t-[28px] border border-hairline bg-card px-6 pb-8 pt-6 card-shadow sm:max-w-md sm:rounded-[24px]"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline sm:hidden" />

        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold">
          <StatusIcon status={status} />
          {STATUS_LABELS[status]}
        </p>
        <h2 className="mt-2 font-serif text-2xl text-ink">{copy.heading}</h2>
        <p className="mt-1 truncate text-sm text-muted">{wish.title}</p>

        <div className="hairline my-5" />

        <label htmlFor="adminNote" className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">
          Note{" "}
          <span className="normal-case tracking-normal">
            {mustExplain ? "(required)" : "(optional)"}
          </span>
        </label>
        <textarea
          id="adminNote"
          ref={noteRef}
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={copy.placeholder}
          className="w-full resize-none rounded-xl border border-hairline bg-cream/60 px-4 py-3 text-ink placeholder:text-muted/60 transition-colors focus:border-gold focus:bg-card"
        />
        <p className="mt-1.5 text-xs text-muted">{copy.hint}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-tint px-4 py-3 text-sm text-rose">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-hairline py-3 text-sm uppercase tracking-[0.12em] text-muted transition-colors hover:bg-rose-tint"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-gold py-3 text-sm uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : STATUS_LABELS[status]}
          </button>
        </div>
      </form>
    </div>
  );
}
