/**
 * Two codes, two roles, no accounts. Everything here uses Web Crypto so the
 * same helpers run in middleware (Edge runtime) and in route handlers.
 *
 * The cookie holds "<role>.<hmac(role)>", so the role itself cannot be edited
 * by hand without invalidating the signature.
 */

export const AUTH_COOKIE = "wl_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const ROLES = ["nina", "admin"] as const;
export type Role = (typeof ROLES)[number];

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy .env.example to .env.local.");
  }
  return secret;
}

function codeFor(role: Role): string {
  const key = role === "admin" ? "ADMIN_CODE" : "NINA_CODE";
  const code = process.env[key];
  if (!code) {
    throw new Error(`${key} is not set. Copy .env.example to .env.local.`);
  }
  return code;
}

/** Length-independent constant-time comparison. */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

async function hmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(role: Role): Promise<string> {
  return `${role}.${await hmac(`wishlist:${role}`, requireSecret())}`;
}

/** Returns the role carried by a valid cookie, or null. */
export async function readToken(token: string | undefined | null): Promise<Role | null> {
  if (!token) return null;
  const separator = token.indexOf(".");
  if (separator === -1) return null;
  const role = token.slice(0, separator) as Role;
  if (!ROLES.includes(role)) return null;
  try {
    return safeEqual(token, await createToken(role)) ? role : null;
  } catch {
    return null;
  }
}

/** Maps an entered code to its role. Both codes are always compared. */
export function roleForCode(input: string): Role | null {
  let matched: Role | null = null;
  for (const role of ROLES) {
    let expected: string;
    try {
      expected = codeFor(role);
    } catch {
      continue;
    }
    if (safeEqual(input, expected)) matched = role;
  }
  return matched;
}
