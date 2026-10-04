import { redirect } from "next/navigation";
import { WishBoard } from "@/components/WishBoard";
import { LockButton } from "@/components/LockButton";
import { store, usingMemoryStore } from "@/lib/db";
import { currentRole } from "@/lib/session";
import { APP_TITLE } from "@/lib/app";

export const dynamic = "force-dynamic";

/** Admin route: read the list, rule on each wish. No adding, no editing. */
export default async function AdminPage() {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role !== "admin") redirect("/");

  const wishes = await store.list();
  const waiting = wishes.filter((w) => w.status === "wishing").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-12 sm:px-8 sm:pt-16">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
        <h1 className="mt-3 font-serif text-4xl font-light leading-tight text-ink sm:text-5xl">
          {APP_TITLE}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {waiting === 0
            ? "Nothing is waiting on you right now."
            : `${waiting} ${waiting === 1 ? "wish is" : "wishes are"} waiting on you.`}
        </p>
        <div className="hairline mx-auto mt-6 max-w-xs" />
      </header>

      {usingMemoryStore() && (
        <p className="mb-6 rounded-xl border border-dashed border-gold-soft bg-card/70 px-4 py-3 text-center text-xs text-muted">
          Running without a database — wishes live in memory and disappear when the server restarts.
          Set <code className="text-gold">DATABASE_URL</code> to keep them.
        </p>
      )}

      <WishBoard initialWishes={wishes} role={role} />

      <footer className="mt-16 flex flex-col items-center gap-4">
        <div className="hairline w-full max-w-xs" />
        <LockButton />
      </footer>
    </main>
  );
}
