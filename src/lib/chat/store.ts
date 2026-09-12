import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { redisCredentials } from '@/lib/analytics/store';
import {
  CONVERSATION_TTL_SECONDS,
  MAX_MESSAGES_PER_CONVERSATION,
  type ChatConversation,
  type ChatMessage,
} from './types';

/**
 * Chat persistence.
 *
 * Redis-backed, and genuinely required rather than preferred. Every serverless
 * invocation is a fresh process, so an in-memory conversation would be visible
 * to the one request that created it and to nothing else — the visitor would
 * send a message and the agent would never see it. `available()` therefore
 * reports honestly and the UI says so, instead of silently dropping messages.
 *
 * A local dev fallback lives at the bottom of this file: a module-level Map,
 * which works only because `next dev` is a single long-lived process.
 *
 * The analytics store's own Store type was not reused — it is shaped for
 * write-time aggregation (counters and sorted sets) and has no list append or
 * hash write, which is most of what a message log needs. Credential resolution
 * IS shared, so the Upstash/Vercel-KV env aliasing is fixed in one place.
 */

const key = {
  messages: (id: string) => `chat:c:${id}:m`,
  meta: (id: string) => `chat:c:${id}:h`,
  index: () => 'chat:index',
  /**
   * Monotonic write counter.
   *
   * The poll endpoints read this one integer first and do nothing else when it
   * has not moved. A 2-second poll therefore costs one Redis command instead of
   * a conversation list plus a message range — which is the difference between
   * a chat widget that fits in a free Upstash plan and one that exhausts it by
   * lunchtime.
   */
  version: () => 'chat:version',
};

let client: Redis | null = null;

function redis(): Redis | null {
  const creds = redisCredentials();
  if (!creds) return null;
  if (!client) client = new Redis(creds);
  return client;
}

export const available = () => redisCredentials() !== null;
export const storageKind = (): 'redis' | 'memory' => (available() ? 'redis' : 'memory');

/**
 * Whether chat may accept messages at all.
 *
 * Redis is required in production, where each request is its own process and
 * the memory fallback would drop every message on the floor. Outside
 * production it is allowed, because `next dev` and `next start` are each a
 * single long-lived process, so the fallback genuinely works and the feature
 * can be developed and tested without provisioning a database.
 */
export const writable = () => available() || process.env.NODE_ENV !== 'production';

const randomId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(16).slice(2).padEnd(32, '0');

export const newConversationId = () => randomId();

/** Conversation ids come from the client, so they are validated as ids only. */
export const isConversationId = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-f0-9]{16,64}$/i.test(v);

/* ------------------------------------------------------------------ writes */

export async function appendMessage(
  conversationId: string,
  message: ChatMessage,
  meta: Partial<Pick<ChatConversation, 'name' | 'email' | 'path' | 'country' | 'device'>> = {}
): Promise<void> {
  const r = redis();
  if (!r) return memory.append(conversationId, message, meta);

  const p = r.pipeline();
  p.rpush(key.messages(conversationId), JSON.stringify(message));
  // Trim from the head so a very long conversation keeps its most recent turns.
  p.ltrim(key.messages(conversationId), -MAX_MESSAGES_PER_CONVERSATION, -1);

  const fields: Record<string, string | number> = {
    lastAt: message.ts,
    preview: message.text.slice(0, 140),
    lastFrom: message.from,
  };
  for (const [k, v] of Object.entries(meta)) {
    if (v !== undefined && v !== null && v !== '') fields[k] = String(v);
  }
  p.hset(key.meta(conversationId), fields);
  p.hsetnx(key.meta(conversationId), 'createdAt', message.ts);

  // Unread is the agent's inbox count, so only a visitor message raises it.
  if (message.from === 'visitor') p.hincrby(key.meta(conversationId), 'unread', 1);
  else p.hset(key.meta(conversationId), { unread: 0 });

  p.zadd(key.index(), { score: message.ts, member: conversationId });
  p.incr(key.version());
  p.expire(key.messages(conversationId), CONVERSATION_TTL_SECONDS);
  p.expire(key.meta(conversationId), CONVERSATION_TTL_SECONDS);

  await p.exec();
}

export async function markRead(conversationId: string): Promise<void> {
  const r = redis();
  if (!r) return memory.markRead(conversationId);
  const p = r.pipeline();
  p.hset(key.meta(conversationId), { unread: 0 });
  p.incr(key.version());
  await p.exec();
}

/* ------------------------------------------------------------------- reads */

/** The write counter. Cheap enough to poll; see the comment on key.version. */
export async function version(): Promise<number> {
  const r = redis();
  if (!r) return memory.version;
  const v = await r.get<number | string>(key.version());
  return Number(v ?? 0);
}

export async function messagesSince(
  conversationId: string,
  after: number
): Promise<ChatMessage[]> {
  const r = redis();
  if (!r) return memory.since(conversationId, after);

  const raw = await r.lrange<string | ChatMessage>(key.messages(conversationId), 0, -1);
  return raw
    .map((entry) => {
      // Upstash deserialises JSON strings automatically on some paths, so a row
      // can come back as an object already.
      if (typeof entry === 'object' && entry !== null) return entry as ChatMessage;
      try {
        return JSON.parse(entry) as ChatMessage;
      } catch {
        return null;
      }
    })
    .filter((m): m is ChatMessage => m !== null && m.ts > after)
    .sort((a, b) => a.ts - b.ts);
}

export async function listConversations(limit = 60): Promise<ChatConversation[]> {
  const r = redis();
  if (!r) return memory.list();

  const ids = await r.zrange<string[]>(key.index(), 0, limit - 1, { rev: true });
  if (!ids.length) return [];

  const metas = await Promise.all(
    ids.map((id) => r.hgetall<Record<string, string>>(key.meta(id)))
  );

  return ids.map((id, i) => {
    const m = metas[i] ?? {};
    return {
      id,
      createdAt: Number(m.createdAt ?? 0),
      lastAt: Number(m.lastAt ?? 0),
      preview: m.preview ?? '',
      lastFrom: (m.lastFrom as ChatConversation['lastFrom']) ?? 'visitor',
      unread: Number(m.unread ?? 0),
      name: m.name ?? null,
      email: m.email ?? null,
      path: m.path ?? null,
      country: m.country ?? null,
      device: m.device ?? null,
    };
  });
}

export async function conversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return messagesSince(conversationId, 0);
}

/* ------------------------------------------------------- dev-only fallback */

/**
 * File-backed store, for local development only.
 *
 * This began as a module-level Map and did not work: Next compiles each route
 * handler into its own chunk, so /api/chat/send and /api/chat/poll each got
 * their own copy of the module and neither could see the other's messages. A
 * module singleton is not shared between routes even under `next dev`.
 *
 * A file is. It is slow and races under concurrency, which is acceptable for
 * one developer and is why `available()` still reports false so production
 * can never end up here.
 */
type DevState = {
  version: number;
  conversations: Record<string, { meta: Record<string, string>; messages: ChatMessage[] }>;
};

const devFile = () => path.join(os.tmpdir(), 'h24c-chat-dev.json');

function devRead(): DevState {
  try {
    return JSON.parse(fs.readFileSync(devFile(), 'utf8')) as DevState;
  } catch {
    return { version: 0, conversations: {} };
  }
}

function devWrite(state: DevState): void {
  try {
    fs.writeFileSync(devFile(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const memory = {
  get version() {
    return devRead().version;
  },

  append(
    id: string,
    message: ChatMessage,
    meta: Partial<Pick<ChatConversation, 'name' | 'email' | 'path' | 'country' | 'device'>>
  ) {
    const state = devRead();
    const c =
      state.conversations[id] ??
      (state.conversations[id] = { meta: { createdAt: String(message.ts) }, messages: [] });

    c.messages.push(message);
    if (c.messages.length > MAX_MESSAGES_PER_CONVERSATION) c.messages.shift();
    c.meta.lastAt = String(message.ts);
    c.meta.preview = message.text.slice(0, 140);
    c.meta.lastFrom = message.from;
    c.meta.unread = message.from === 'visitor' ? String(Number(c.meta.unread ?? 0) + 1) : '0';
    for (const [k, v] of Object.entries(meta)) {
      if (v !== undefined && v !== null && v !== '') c.meta[k] = String(v);
    }
    state.version++;
    devWrite(state);
  },

  markRead(id: string) {
    const state = devRead();
    if (state.conversations[id]) state.conversations[id].meta.unread = '0';
    state.version++;
    devWrite(state);
  },

  since(id: string, after: number) {
    return (devRead().conversations[id]?.messages ?? [])
      .filter((m) => m.ts > after)
      .sort((a, b) => a.ts - b.ts);
  },

  list(): ChatConversation[] {
    const state = devRead();
    return Object.entries(state.conversations)
      .map(([id, c]) => ({
        id,
        createdAt: Number(c.meta.createdAt ?? 0),
        lastAt: Number(c.meta.lastAt ?? 0),
        preview: c.meta.preview ?? '',
        lastFrom: (c.meta.lastFrom as ChatConversation['lastFrom']) ?? 'visitor',
        unread: Number(c.meta.unread ?? 0),
        name: c.meta.name ?? null,
        email: c.meta.email ?? null,
        path: c.meta.path ?? null,
        country: c.meta.country ?? null,
        device: c.meta.device ?? null,
      }))
      .sort((a, b) => b.lastAt - a.lastAt);
  },
};
