import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

/** Only same-origin relative paths are allowed back, never "//evil.com". */
function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <LoginForm next={safeNext(next)} />
    </main>
  );
}
