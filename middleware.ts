import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, readToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

/**
 * A relative Location, resolved by the browser against the host it actually
 * asked for. `new URL(path, request.url)` would hardcode whatever host Next
 * thinks it is serving, which behind a reverse proxy is localhost:3000.
 */
function redirectTo(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
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
    return redirectTo(`/login${next}`);
  }

  // Each role has its own home. Landing anywhere else sends you to yours.
  if (role === "admin" && pathname === "/") return redirectTo("/admin");
  if (role !== "admin" && pathname.startsWith("/admin")) return redirectTo("/");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"],
};
