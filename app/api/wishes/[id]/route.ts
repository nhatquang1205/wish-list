import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/db";
import { currentRole } from "@/lib/session";
import { wishPatchSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** Nina edits the details of a wish; the status is not part of that patch. */
export async function PATCH(request: NextRequest, { params }: Context) {
  if ((await currentRole()) !== "nina") {
    return NextResponse.json({ error: "Only Nina can edit a wish." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = wishPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid wish" },
      { status: 400 },
    );
  }

  const updated = await store.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  if ((await currentRole()) !== "nina") {
    return NextResponse.json({ error: "Only Nina can remove a wish." }, { status: 403 });
  }

  const { id } = await params;

  // Once the admin has ruled on a wish, it stays on the list.
  const wish = await store.get(id);
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wish.status !== "wishing") {
    return NextResponse.json(
      { error: "This one has already been answered — it can't be removed now." },
      { status: 403 },
    );
  }

  const removed = await store.remove(id);
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
