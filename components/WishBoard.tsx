"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "./EmptyState";
import { FilterChips } from "./FilterChips";
import { StatusNoteModal } from "./StatusNoteModal";
import { WishCard } from "./WishCard";
import { WishDetail } from "./WishDetail";
import { WishForm } from "./WishForm";
import {
  WISH_STATUSES,
  promptsForNote,
  type Wish,
  type WishInput,
  type WishStatus,
} from "@/lib/types";
import type { Role } from "@/lib/auth";

type Sort = "newest" | "loved" | "name";

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "loved", label: "Most loved" },
  { value: "name", label: "A–Z" },
];

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Try again?");
  }
  return response.json();
}

export function WishBoard({
  initialWishes,
  role,
}: {
  initialWishes: Wish[];
  role: Role;
}) {
  const isAdmin = role === "admin";
  const [wishes, setWishes] = useState(initialWishes);
  const [status, setStatus] = useState<WishStatus | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wish | null>(null);
  const [detail, setDetail] = useState<Wish | null>(null);
  // An approve/reject waiting on the admin's note.
  const [pending, setPending] = useState<{ wish: Wish; status: WishStatus } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const counts = useMemo(() => {
    const base = { all: wishes.length } as Record<WishStatus | "all", number>;
    for (const s of WISH_STATUSES) base[s] = wishes.filter((w) => w.status === s).length;
    return base;
  }, [wishes]);

  const tags = useMemo(
    () => Array.from(new Set(wishes.flatMap((w) => w.tags))).sort((a, b) => a.localeCompare(b)),
    [wishes],
  );

  const visible = useMemo(() => {
    const filtered = wishes.filter(
      (w) =>
        (status === "all" || w.status === status) &&
        (activeTag === null || w.tags.includes(activeTag)),
    );
    const sorted = [...filtered];
    if (sort === "loved") sorted.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    else if (sort === "name") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [wishes, status, activeTag, sort]);

  async function handleSubmit(input: WishInput) {
    if (editing) {
      const previous = wishes;
      const optimistic = { ...editing, ...input };
      setWishes((list) => list.map((w) => (w.id === editing.id ? optimistic : w)));
      setFormOpen(false);
      try {
        const saved = await api<Wish>(`/api/wishes/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        setWishes((list) => list.map((w) => (w.id === saved.id ? saved : w)));
      } catch (error) {
        setWishes(previous);
        flash(error instanceof Error ? error.message : "Could not save that.");
      }
      return;
    }

    const saved = await api<Wish>("/api/wishes", { method: "POST", body: JSON.stringify(input) });
    setWishes((list) => [saved, ...list]);
    setFormOpen(false);
  }

  /**
   * Admin-only: its own endpoint, so an edit can never carry a status.
   * Approving and rejecting go through the note modal first; the note is part
   * of the same request, so a decision is never saved without its reason.
   */
  async function saveStatus(wish: Wish, next: WishStatus, note?: string | null) {
    const previous = wishes;
    setWishes((list) => list.map((w) => (w.id === wish.id ? { ...w, status: next } : w)));
    try {
      const saved = await api<Wish>(`/api/wishes/${wish.id}/status`, {
        method: "PUT",
        body: JSON.stringify(note === undefined ? { status: next } : { status: next, note }),
      });
      setWishes((list) => list.map((w) => (w.id === saved.id ? saved : w)));
    } catch (error) {
      setWishes(previous);
      throw error;
    }
  }

  function handleStatusChange(wish: Wish, next: WishStatus) {
    if (promptsForNote(next)) {
      setPending({ wish, status: next });
      return;
    }
    saveStatus(wish, next).catch((error) =>
      flash(error instanceof Error ? error.message : "Could not update that."),
    );
  }

  async function handleDelete(wish: Wish) {
    const previous = wishes;
    setWishes((list) => list.filter((w) => w.id !== wish.id));
    setDetail(null);
    try {
      await api(`/api/wishes/${wish.id}`, { method: "DELETE" });
    } catch (error) {
      setWishes(previous);
      flash(error instanceof Error ? error.message : "Could not delete that.");
    }
  }

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <FilterChips
            status={status}
            onStatusChange={setStatus}
            tags={tags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            counts={counts}
          />
        </div>

        <div className="flex shrink-0 gap-1 rounded-full border border-hairline p-1">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              aria-pressed={sort === option.value}
              className={`rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                sort === option.value ? "bg-gold-soft/50 text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          filtered={wishes.length > 0}
          onAdd={isAdmin ? undefined : openNew}
          role={role}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              role={role}
              onOpen={setDetail}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {!isAdmin && (
        <button
          type="button"
          onClick={openNew}
          aria-label="Add a wish"
          className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-full border border-hairline bg-card px-5 py-3 text-sm text-ink card-shadow"
        >
          {toast}
        </div>
      )}

      {!isAdmin && detail && (
        <WishDetail
          wish={wishes.find((w) => w.id === detail.id) ?? detail}
          onClose={() => setDetail(null)}
          onEdit={(w) => {
            setDetail(null);
            setEditing(w);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {isAdmin && pending && (
        <StatusNoteModal
          wish={pending.wish}
          status={pending.status}
          onCancel={() => setPending(null)}
          onConfirm={async (note) => {
            await saveStatus(pending.wish, pending.status, note);
            setPending(null);
          }}
        />
      )}

      {!isAdmin && (
        <WishForm
          open={formOpen}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
