import { Pool } from "pg";
import { INITIAL_STATUS, type Wish, type WishInput, type WishPatch, type WishStatus } from "./types";

/**
 * Postgres when DATABASE_URL is set, otherwise an in-memory store so that
 * `npm run dev` works before any database is reachable. The fallback is
 * refused in production so a missing env var can never silently drop data.
 *
 * Resolved lazily: `next build` runs with NODE_ENV=production, and the
 * database is not necessarily reachable at build time.
 */

type Row = {
  id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  note: string | null;
  rating: number;
  status: WishStatus;
  tags: string[] | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toWish(row: Row): Wish {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    imageUrl: row.image_url,
    note: row.note,
    rating: Number(row.rating),
    status: row.status,
    tags: row.tags ?? [],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function merge(current: Wish, patch: WishPatch): WishInput {
  return {
    title: patch.title ?? current.title,
    url: patch.url !== undefined ? patch.url : current.url,
    imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : current.imageUrl,
    note: patch.note !== undefined ? patch.note : current.note,
    rating: patch.rating ?? current.rating,
    tags: patch.tags ?? current.tags,
  };
}

export interface WishStore {
  list(): Promise<Wish[]>;
  get(id: string): Promise<Wish | null>;
  create(input: WishInput): Promise<Wish>;
  update(id: string, patch: WishPatch): Promise<Wish | null>;
  setStatus(id: string, status: WishStatus): Promise<Wish | null>;
  remove(id: string): Promise<boolean>;
}

function createPostgresStore(connectionString: string): WishStore {
  /**
   * One pool per process, cached on globalThis so dev hot reloads reuse it
   * instead of leaking a new pool on every module re-evaluation. SSL comes
   * from the connection string (`?sslmode=require` for hosted Postgres).
   */
  const globalRef = globalThis as typeof globalThis & { __wlPool?: Pool };
  globalRef.__wlPool ??= new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  const pool = globalRef.__wlPool;

  const query = (text: string, values: unknown[] = []) => pool.query<Row>(text, values);

  const one = async (text: string, values: unknown[]) => {
    const { rows } = await query(text, values);
    return rows[0] ? toWish(rows[0]) : null;
  };

  const getOne = (id: string) =>
    UUID.test(id) ? one("select * from wishes where id = $1", [id]) : Promise.resolve(null);

  return {
    async list() {
      const { rows } = await query("select * from wishes order by created_at desc");
      return rows.map(toWish);
    },

    get: getOne,

    async create(input) {
      // The initial status is stamped here, never taken from the request.
      const wish = await one(
        `insert into wishes (title, url, image_url, note, rating, status, tags)
         values ($1, $2, $3, $4, $5, $6, $7::text[])
         returning *`,
        [input.title, input.url, input.imageUrl, input.note, input.rating, INITIAL_STATUS, input.tags],
      );
      return wish!;
    },

    async update(id, patch) {
      const current = await getOne(id);
      if (!current) return null;
      const next = merge(current, patch);
      return one(
        `update wishes set
           title = $2,
           url = $3,
           image_url = $4,
           note = $5,
           rating = $6,
           tags = $7::text[],
           updated_at = now()
         where id = $1
         returning *`,
        [id, next.title, next.url, next.imageUrl, next.note, next.rating, next.tags],
      );
    },

    async setStatus(id, status) {
      if (!UUID.test(id)) return null;
      return one(
        "update wishes set status = $2, updated_at = now() where id = $1 returning *",
        [id, status],
      );
    },

    async remove(id) {
      if (!UUID.test(id)) return false;
      const { rowCount } = await query("delete from wishes where id = $1 returning id", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}

function createMemoryStore(): WishStore {
  // Survives hot reloads in dev, which recreate module scope.
  const globalRef = globalThis as typeof globalThis & { __wishes?: Wish[] };
  globalRef.__wishes ??= [];
  const wishes = globalRef.__wishes;

  const find = (id: string) => wishes.findIndex((w) => w.id === id);

  return {
    async list() {
      return [...wishes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id) {
      return wishes[find(id)] ?? null;
    },
    async create(input) {
      const now = new Date().toISOString();
      const wish: Wish = {
        ...input,
        id: crypto.randomUUID(),
        status: INITIAL_STATUS,
        createdAt: now,
        updatedAt: now,
      };
      wishes.push(wish);
      return wish;
    },
    async update(id, patch) {
      const index = find(id);
      if (index === -1) return null;
      const next: Wish = {
        ...wishes[index],
        ...merge(wishes[index], patch),
        updatedAt: new Date().toISOString(),
      };
      wishes[index] = next;
      return next;
    },
    async setStatus(id, status) {
      const index = find(id);
      if (index === -1) return null;
      const next: Wish = { ...wishes[index], status, updatedAt: new Date().toISOString() };
      wishes[index] = next;
      return next;
    },
    async remove(id) {
      const index = find(id);
      if (index === -1) return false;
      wishes.splice(index, 1);
      return true;
    },
  };
}

let resolved: WishStore | null = null;

function resolve(): WishStore {
  if (resolved) return resolved;
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    resolved = createPostgresStore(connectionString);
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.");
  } else {
    resolved = createMemoryStore();
  }
  return resolved;
}

export const store: WishStore = {
  list: () => resolve().list(),
  get: (id) => resolve().get(id),
  create: (input) => resolve().create(input),
  update: (id, patch) => resolve().update(id, patch),
  setStatus: (id, status) => resolve().setStatus(id, status),
  remove: (id) => resolve().remove(id),
};

export function usingMemoryStore(): boolean {
  return !process.env.DATABASE_URL;
}
