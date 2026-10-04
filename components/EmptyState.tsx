import { Heart } from "./Heart";
import type { Role } from "@/lib/auth";

export function EmptyState({
  filtered,
  onAdd,
  role,
}: {
  filtered: boolean;
  onAdd?: () => void;
  role: Role;
}) {
  const empty =
    role === "admin"
      ? {
          heading: "No wishes yet",
          body: "When Nina adds something, it will land here waiting for your word.",
        }
      : {
          heading: "Your list is waiting",
          body: "Paste a link, give it a few hearts, and it will live here until it finds its way to you.",
        };

  return (
    <div className="animate-fade rounded-[var(--radius-card)] border border-dashed border-hairline bg-card/60 px-8 py-16 text-center">
      <Heart filled={false} className="mx-auto h-10 w-10 text-gold-soft" />
      <h2 className="mt-5 font-serif text-2xl text-ink">
        {filtered ? "Nothing here yet" : empty.heading}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {filtered ? "No wishes match this filter. Try another one." : empty.body}
      </p>
      {!filtered && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 rounded-full bg-gold px-7 py-3 text-sm uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
        >
          Add the first wish
        </button>
      )}
    </div>
  );
}
