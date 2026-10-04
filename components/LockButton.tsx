"use client";

export function LockButton() {
  async function lock() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={lock}
      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold"
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
        <path d="M7 8.5V6.5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
      </svg>
      Lock
    </button>
  );
}
