import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/db";
import { currentRole } from "@/lib/session";
import { wishStatusSchema } from "@/lib/types";

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

  const updated = await store.setStatus(id, parsed.data.status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
