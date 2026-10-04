import { redirect } from "next/navigation";
import { WishBoard } from "@/components/WishBoard";
import { LockButton } from "@/components/LockButton";
import { store, usingMemoryStore } from "@/lib/db";
import { currentRole } from "@/lib/session";
import { APP_TITLE } from "@/lib/app";

export const dynamic = "force-dynamic";

/** Nina's route. Middleware sends admins to /admin before this renders. */
export default async function HomePage() {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role === "admin") redirect("/admin");

  const wishes = await store.list();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-12 sm:px-8 sm:pt-16">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Wish upon a list</p>
        <h1 className="mt-3 font-serif text-4xl font-light leading-tight text-ink sm:text-5xl">
          {APP_TITLE}
        </h1>
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
