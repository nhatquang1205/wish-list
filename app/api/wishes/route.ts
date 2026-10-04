import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/db";
import { currentRole } from "@/lib/session";
import { wishInputSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await currentRole())) return NextResponse.json({ error: "Locked" }, { status: 401 });
  return NextResponse.json(await store.list());
}

export async function POST(request: NextRequest) {
  // Wishes are Nina's to make; admin only rules on them afterwards.
  if ((await currentRole()) !== "nina") {
    return NextResponse.json({ error: "Only Nina can add wishes." }, { status: 403 });
  }

  const parsed = wishInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid wish" },
      { status: 400 },
    );
  }
  // The store always stamps the initial status, so a posted one cannot stick.
  return NextResponse.json(await store.create(parsed.data), { status: 201 });
}
