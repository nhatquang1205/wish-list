import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, readToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

/** First value of a possibly comma-joined proxy header. */
function first(value: string | null): string | null {
  return value ? (value.split(",")[0]?.trim() || null) : null;
}

/**
 * Behind a reverse proxy, `request.url` reports the address Next itself is
 * bound to (localhost:3000), so redirects built from it send the browser to
 * the wrong host. The Host and X-Forwarded-* headers carry the real one, and
 * nginx overwrites them on every request, so they can be trusted here.
 */
function redirectTo(request: NextRequest, path: string) {
  const host = first(request.headers.get("x-forwarded-host")) ?? first(request.headers.get("host"));
  const proto =
    first(request.headers.get("x-forwarded-proto")) ?? request.nextUrl.protocol.replace(":", "");

  try {
    return NextResponse.redirect(new URL(path, host ? `${proto}://${host}` : request.nextUrl.origin));
  } catch {
    return NextResponse.redirect(new URL(path, request.nextUrl.origin));
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const role = await readToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (!role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Locked" }, { status: 401 });
    }
    const next =
      pathname === "/" ? "" : `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return redirectTo(request, `/login${next}`);
  }

  // Each role has its own home. Landing anywhere else sends you to yours.
  if (role === "admin" && pathname === "/") return redirectTo(request, "/admin");
  if (role !== "admin" && pathname.startsWith("/admin")) return redirectTo(request, "/");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"],
};
