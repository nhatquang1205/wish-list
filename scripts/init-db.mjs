import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local reader so the script needs no extra dependency.
for (const file of [".env.local", ".env"]) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    process.env[key] = (match[2] ?? "").trim().replace(/^["']|["']$/g, "");
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add your Postgres connection string to .env.local.");
  process.exit(1);
}

const statements = readFileSync(resolve(root, "db/schema.sql"), "utf8")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const client = new pg.Client({ connectionString });
await client.connect();

try {
  for (const statement of statements) {
    const first = statement.split("\n").find((l) => l.trim() && !l.trim().startsWith("--")) ?? "";
    console.log(`> ${first.trim().slice(0, 70)}...`);
    await client.query(statement);
  }
  console.log(`\nSchema applied (${statements.length} statements). Ready to wish.`);
} finally {
  await client.end();
}
