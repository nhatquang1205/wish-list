"use client";

import { useState } from "react";
import { Heart } from "./Heart";

export function LoginForm({ next }: { next: string }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "That didn't work.");
        setPasscode("");
        return;
      }
      // Each code opens its own door; "next" only applies within that role's side.
      const home = body?.role === "admin" ? "/admin" : "/";
      window.location.href = next === "/" ? home : next;
    } catch {
      setError("Couldn't reach the server. Check your connection?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm animate-rise rounded-[24px] border border-hairline bg-card px-8 py-10 text-center card-shadow"
    >
      <Heart filled className="mx-auto h-9 w-9 text-gold" />
      <h1 className="mt-5 font-serif text-3xl font-light text-ink">Hello, lovely</h1>
      <p className="mt-2 text-sm text-muted">Enter your six-digit code to open the list.</p>
      <div className="hairline mx-auto my-7 w-24" />

      <label htmlFor="passcode" className="sr-only">
        Six-digit code
      </label>
      <input
        id="passcode"
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={12}
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="• • • • • •"
        className="w-full rounded-xl border border-hairline bg-cream/60 px-4 py-3 text-center tracking-[0.3em] text-ink transition-colors focus:border-gold focus:bg-card"
      />

      {error && (
        <p role="alert" className="mt-4 text-sm text-rose">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || passcode.length === 0}
        className="mt-6 w-full rounded-full bg-gold py-3 text-sm uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Opening…" : "Open"}
      </button>
    </form>
  );
}
