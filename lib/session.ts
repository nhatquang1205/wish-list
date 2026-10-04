import { cookies } from "next/headers";
import { AUTH_COOKIE, readToken, type Role } from "./auth";

/**
 * The role for the current request, for server components and route handlers.
 * Middleware has already rejected unsigned cookies, but every caller re-checks
 * so a route is never trusted on the strength of the matcher alone.
 */
export async function currentRole(): Promise<Role | null> {
  const store = await cookies();
  return readToken(store.get(AUTH_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await currentRole()) === "admin";
}
