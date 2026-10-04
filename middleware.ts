import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, readToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

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
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Each role has its own home. Landing anywhere else sends you to yours.
  const home = role === "admin" ? "/admin" : "/";
  if (role === "admin" && pathname === "/") {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (role !== "admin" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"],
};
