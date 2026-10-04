"use client";

import { useRef, useState } from "react";

const MAX_MB = 8;

/**
 * Uploads as soon as a photo is chosen, so by the time the wish is saved the
 * object already exists and the form submit stays a single quick request.
 *
 * `path` is the bucket key the wish stores; `preview` is the resolved URL the
 * server hands back, used only to show the thumbnail here.
 */
export function PhotoPicker({
  path,
  preview,
  onChange,
}: {
  path: string | null;
  preview: string | null;
  onChange: (path: string | null, url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same photo be chosen again after a failure.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) return setError("Pick an image file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Keep it under ${MAX_MB}MB.`);

    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "That didn't upload.");
      onChange(data.path as string, (data.url as string | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">
        Photo <span className="normal-case tracking-normal">(optional)</span>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {path ? (
        <div className="relative overflow-hidden rounded-xl border border-hairline">
          {preview ? (
            <img src={preview} alt="" className="h-40 w-full object-cover" />
          ) : (
            <div className="grid h-40 w-full place-items-center bg-rose-tint text-xs text-muted">
              Photo attached
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-card/90 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-ink backdrop-blur-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null, null)}
              aria-label="Remove photo"
              className="grid h-8 w-8 place-items-center rounded-full bg-card/90 text-muted backdrop-blur-sm transition-colors hover:text-rose"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-cream/40 py-6 text-sm text-muted transition-colors hover:border-gold-soft hover:text-ink disabled:opacity-60"
        >
          {uploading ? (
            "Uploading…"
          ) : (
            <>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 14.5V5.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
                <path d="m3 12.5 3.5-3 4 3.5 2.5-2 4 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add a photo
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
