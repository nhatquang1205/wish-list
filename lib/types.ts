import { z } from "zod";

export const WISH_STATUSES = ["wishing", "approved", "rejected", "done"] as const;
export type WishStatus = (typeof WISH_STATUSES)[number];

/** The only status a new wish can start in. Nina never picks one herself. */
export const INITIAL_STATUS: WishStatus = "wishing";

export const STATUS_LABELS: Record<WishStatus, string> = {
  wishing: "Wishing",
  approved: "Approved",
  rejected: "Rejected",
  done: "Done",
};

/** Accepts "" / undefined as null, otherwise requires a parseable http(s) URL. */
const optionalUrl = z
  .string()
  .trim()
  .max(2000, "That link is too long")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isHttpUrl(v), "Must start with http:// or https://");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** The fields Nina owns. Status is deliberately absent — only admin sets it. */
export const wishInputSchema = z.object({
  title: z.string().trim().min(1, "Give it a name").max(120, "Name is too long"),
  url: optionalUrl,
  imageUrl: optionalUrl,
  note: optionalText(500),
  rating: z.coerce.number().int().min(1).max(5),
  tags: z
    .array(z.string())
    .default([])
    .transform((tags) => {
      const cleaned = tags.map((t) => t.trim().slice(0, 24)).filter(Boolean);
      return Array.from(new Set(cleaned)).slice(0, 8);
    }),
});

export const wishPatchSchema = wishInputSchema.partial();

/** Admin-only patch. Kept separate so a status can never ride along on an edit. */
export const wishStatusSchema = z.object({
  status: z.enum(WISH_STATUSES),
  note: optionalText(500),
});

/**
 * A wish can only be marked Done once it has been Approved — nothing arrives
 * that was never said yes to. Every other move stays open.
 */
export function canSetStatus(from: WishStatus, to: WishStatus): boolean {
  return to === "done" ? from === "approved" : true;
}

/** Approving or rejecting is a decision, so it comes with a word about why. */
export function promptsForNote(status: WishStatus): boolean {
  return status === "approved" || status === "rejected";
}

/** A rejection without a reason is just a closed door. */
export function requiresNote(status: WishStatus): boolean {
  return status === "rejected";
}

export type WishInput = z.infer<typeof wishInputSchema>;
export type WishPatch = z.infer<typeof wishPatchSchema>;

export type Wish = WishInput & {
  id: string;
  status: WishStatus;
  /** Set by the admin when approving or rejecting. Nina can only read it. */
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Only http(s) links ever reach an href or src. Guards against javascript:
 * and data: URLs being pasted into the form.
 */
export function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function safeUrl(value: string | null | undefined): string | null {
  return isHttpUrl(value) ? value : null;
}
