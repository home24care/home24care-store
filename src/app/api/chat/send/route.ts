import { NextResponse } from 'next/server';
import {
  appendMessage,
  available,
  writable,
  isConversationId,
  newConversationId,
} from '@/lib/chat/store';
import { MAX_MESSAGE_LENGTH, type ChatMessage } from '@/lib/chat/types';

export const dynamic = 'force-dynamic';

/**
 * Visitor sends a message.
 *
 * Public and unauthenticated by necessity — a shopper has no account. The
 * conversation id is the only credential, so it is generated server-side on
 * the first message rather than accepted from the client, which stops anyone
 * writing into a conversation id they guessed.
 */

/**
 * Crude per-IP rate limit.
 *
 * Process-local, so on serverless it limits per warm instance rather than
 * globally — which is enough to stop a single browser hammering the endpoint,
 * and is honest about not being a defence against a distributed flood. A
 * Redis-backed counter would be stricter, at one extra command per message.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bound the map
  return recent.length > RATE_MAX;
}

export async function POST(request: Request) {
  if (!writable()) {
    return NextResponse.json(
      { error: 'Chat is not configured. Set the Upstash Redis credentials.' },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages. Please wait a moment.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const input = body as {
    conversationId?: unknown;
    text?: unknown;
    name?: unknown;
    email?: unknown;
    path?: unknown;
  };

  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'Message is empty.' }, { status: 400 });
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  }

  // An unrecognised id starts a fresh conversation rather than erroring, so a
  // cleared localStorage just means a new thread instead of a broken widget.
  const conversationId = isConversationId(input.conversationId)
    ? input.conversationId
    : newConversationId();

  const clean = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'visitor',
    text,
    // Server clock only. A client-supplied timestamp could order itself ahead
    // of the agent's replies or escape the poll cursor entirely.
    ts: Date.now(),
  };

  await appendMessage(conversationId, message, {
    name: clean(input.name, 80),
    email: clean(input.email, 160),
    path: clean(input.path, 200),
    country: request.headers.get('x-vercel-ip-country'),
    device: /Mobi|Android|iPhone/i.test(request.headers.get('user-agent') ?? '')
      ? 'mobile'
      : 'desktop',
  });

  return NextResponse.json({ conversationId, message });
}
