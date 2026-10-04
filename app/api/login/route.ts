import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE, createToken, roleForCode } from "@/lib/auth";

// Per-instance throttle. Not bulletproof on serverless, but enough to make
// guessing a short code over a public URL impractical.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (tooManyAttempts(ip)) {
    return NextResponse.json(
      { error: "Too many tries. Take a little break and come back in a bit." },
      { status: 429 },
    );
  }

  let code = "";
  try {
    const body = await request.json();
    code = typeof body?.passcode === "string" ? body.passcode : "";
  } catch {
    return NextResponse.json({ error: "That didn't look right." }, { status: 400 });
  }

  const role = roleForCode(code);
  if (!role) {
    return NextResponse.json({ error: "That's not the magic word." }, { status: 401 });
  }

  attempts.delete(ip);

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(AUTH_COOKIE, await createToken(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return response;
}
