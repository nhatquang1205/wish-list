import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/db";
import { currentRole } from "@/lib/session";
import {
  STATUS_LABELS,
  canSetStatus,
  promptsForNote,
  requiresNote,
  wishStatusSchema,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** The one place a status changes, and only an admin may reach it. */
export async function PUT(request: NextRequest, { params }: Context) {
  if ((await currentRole()) !== "admin") {
    return NextResponse.json({ error: "Only the admin can change a status." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = wishStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "That isn't a status." }, { status: 400 });
  }
  const { status, note } = parsed.data;

  const current = await store.get(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canSetStatus(current.status, status)) {
    return NextResponse.json(
      {
        error: `A wish has to be ${STATUS_LABELS.approved} before it can be ${STATUS_LABELS.done} — this one is ${STATUS_LABELS[current.status]}.`,
      },
      { status: 409 },
    );
  }

  if (requiresNote(status) && !note) {
    return NextResponse.json({ error: "Say why, so she knows." }, { status: 400 });
  }

  /**
   * The note belongs to the decision: approving or rejecting writes a fresh
   * one, going back to Wishing clears it, and marking Done keeps whatever was
   * said when it was approved.
   */
  const nextNote = promptsForNote(status) ? note : status === "wishing" ? null : undefined;

  const updated = await store.setStatus(id, status, nextNote);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
