import { Redis } from '@upstash/redis';

/**
 * Storage behind the analytics dashboard.
 *
 * Two implementations share one interface:
 *
 *  - Redis (Upstash), used whenever UPSTASH_REDIS_REST_URL and
 *    UPSTASH_REDIS_REST_TOKEN are set. This is the only one that works in
 *    production, because each serverless invocation is a fresh process.
 *  - Memory, for local development so the dashboard is usable without
 *    provisioning anything. It is explicitly NOT a production fallback — the
 *    dashboard reports which backend it is on so an empty production graph is
 *    never a mystery.
 *
 * Everything is aggregated at write time into per-day counters rather than
 * stored as raw rows and summed at read time. A storefront generates far more
 * events than dashboard loads, and this keeps a dashboard render to a fixed
 * handful of reads no matter how much traffic accumulated.
 */

export type Store = {
  kind: 'redis' | 'memory';
  incr(key: string, by?: number): Promise<void>;
  incrField(key: string, field: string, by?: number): Promise<void>;
  addToSet(key: string, member: string): Promise<void>;
  setSize(key: string): Promise<number>;
  zincr(key: string, member: string, by?: number): Promise<void>;
  zTop(key: string, limit: number): Promise<{ member: string; score: number }[]>;
  getHash(key: string): Promise<Record<string, string>>;
  /** Writes a string value into a hash field (used by the live-visitors window). */
  setField(key: string, field: string, value: string): Promise<void>;
  /**
   * Atomically claims a key: true for the first caller only, false for every
   * later one until it expires. Used so an order is counted once however many
   * times the webhook and the thank-you page report it.
   */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  pushCapped(key: string, value: string, cap: number): Promise<void>;
  listRange(key: string, start: number, stop: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<void>;
};

/* ------------------------------------------------------------------ redis */

let redisClient: Redis | null = null;

/**
 * The REST credentials, under either name Vercel might have written.
 *
 * Upstash's own dashboard calls these UPSTASH_REDIS_REST_URL/TOKEN, but the
 * Vercel marketplace integration provisions the same database as
 * KV_REST_API_URL/TOKEN, left over from Vercel KV. Reading both means the
 * dashboard works whichever route was used to create the database, instead of
 * silently falling back to memory because the names did not match.
 *
 * Deliberately not accepting REDIS_URL: that is the TCP connection string
 * (redis://...), which @upstash/redis cannot use — it speaks HTTP so that a
 * serverless invocation does not need a persistent socket.
 */
export const redisCredentials = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
};

export const redisConfigured = () => redisCredentials() !== null;

/** Which variable names were actually found, for the dashboard to report. */
export const redisSource = (): string | null => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return 'UPSTASH_REDIS_REST_*';
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return 'KV_REST_API_*';
  return null;
};

function redis(): Redis {
  if (!redisClient) {
    const creds = redisCredentials();
    if (!creds) throw new Error('Redis credentials are not configured');
    redisClient = new Redis(creds);
  }
  return redisClient;
}

const redisStore: Store = {
  kind: 'redis',
  async incr(key, by = 1) {
    await redis().incrby(key, by);
  },
  async incrField(key, field, by = 1) {
    await redis().hincrby(key, field, by);
  },
  async addToSet(key, member) {
    await redis().sadd(key, member);
  },
  async setSize(key) {
    return (await redis().scard(key)) ?? 0;
  },
  async zincr(key, member, by = 1) {
    await redis().zincrby(key, by, member);
  },
  async zTop(key, limit) {
    // withScores returns a flat [member, score, member, score, ...] array.
    const raw = (await redis().zrange(key, 0, limit - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];
    const out: { member: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      out.push({ member: String(raw[i]), score: Number(raw[i + 1]) });
    }
    return out;
  },
  async getHash(key) {
    const h = await redis().hgetall<Record<string, string>>(key);
    return h ?? {};
  },
  async setField(key, field, value) {
    await redis().hset(key, { [field]: value });
  },
  async claim(key, ttlSeconds) {
    return (await redis().set(key, '1', { nx: true, ex: ttlSeconds })) === 'OK';
  },
  async pushCapped(key, value, cap) {
    const client = redis();
    await client.lpush(key, value);
    await client.ltrim(key, 0, cap - 1);
  },
  async listRange(key, start, stop) {
    return (await redis().lrange<string>(key, start, stop)) ?? [];
  },
  async expire(key, seconds) {
    await redis().expire(key, seconds);
  },
};

/* ----------------------------------------------------------------- memory */

type MemoryState = {
  counters: Map<string, number>;
  hashes: Map<string, Map<string, number | string>>;
  sets: Map<string, Set<string>>;
  zsets: Map<string, Map<string, number>>;
  lists: Map<string, string[]>;
};

/**
 * Survives module reloads in dev (Next re-evaluates modules on edit) by
 * hanging off globalThis, which is also why it is useless in production —
 * every serverless invocation gets a fresh global.
 */
const g = globalThis as typeof globalThis & { __h24cAnalytics?: MemoryState };
const mem: MemoryState = (g.__h24cAnalytics ??= {
  counters: new Map(),
  hashes: new Map(),
  sets: new Map(),
  zsets: new Map(),
  lists: new Map(),
});

const memoryStore: Store = {
  kind: 'memory',
  async incr(key, by = 1) {
    mem.counters.set(key, (mem.counters.get(key) ?? 0) + by);
  },
  async incrField(key, field, by = 1) {
    const h = mem.hashes.get(key) ?? new Map<string, number | string>();
    h.set(field, (Number(h.get(field)) || 0) + by);
    mem.hashes.set(key, h);
  },
  async addToSet(key, member) {
    const s = mem.sets.get(key) ?? new Set<string>();
    s.add(member);
    mem.sets.set(key, s);
  },
  async setSize(key) {
    return mem.sets.get(key)?.size ?? 0;
  },
  async zincr(key, member, by = 1) {
    const z = mem.zsets.get(key) ?? new Map<string, number>();
    z.set(member, (z.get(member) ?? 0) + by);
    mem.zsets.set(key, z);
  },
  async zTop(key, limit) {
    const z = mem.zsets.get(key);
    if (!z) return [];
    return [...z.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([member, score]) => ({ member, score }));
  },
  async getHash(key) {
    const h = mem.hashes.get(key);
    if (!h) return {};
    return Object.fromEntries([...h.entries()].map(([k, v]) => [k, String(v)]));
  },
  async setField(key, field, value) {
    const h = mem.hashes.get(key) ?? new Map<string, number | string>();
    h.set(field, value);
    mem.hashes.set(key, h);
  },
  async claim(key) {
    if (mem.counters.has(key)) return false;
    mem.counters.set(key, 1);
    return true;
  },
  async pushCapped(key, value, cap) {
    const l = mem.lists.get(key) ?? [];
    l.unshift(value);
    mem.lists.set(key, l.slice(0, cap));
  },
  async listRange(key, start, stop) {
    return (mem.lists.get(key) ?? []).slice(start, stop + 1);
  },
  async expire() {
    // Nothing to do: the process is the lifetime.
  },
};

export const store = (): Store => (redisConfigured() ? redisStore : memoryStore);
