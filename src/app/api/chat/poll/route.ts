import { NextResponse } from 'next/server';
import { isConversationId, messagesSince, version, writable } from '@/lib/chat/store';
import type { VisitorPoll } from '@/lib/chat/types';

export const dynamic = 'force-dynamic';

/**
 * Visitor polls for new messages.
 *
 * Two-stage on purpose. The widget sends the write-counter value it last saw;
 * if the counter has not moved, this returns an empty result after a single
 * Redis GET. Only a real change costs a message read. That is what makes a
 * 2-second poll affordable.
 *
 * `after` is a message timestamp rather than an index, so a trim of the
 * message list cannot shift the cursor and replay old messages.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('c');
  const after = Number(url.searchParams.get('after') ?? 0);
  const seenVersion = Number(url.searchParams.get('v') ?? -1);

  if (!isConversationId(conversationId)) {
    return NextResponse.json({ error: 'Unknown conversation.' }, { status: 400 });
  }

  if (!writable()) {
    const body: VisitorPoll = { messages: [], cursor: after, degraded: true };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  }

  const current = await version();
  if (seenVersion === current) {
    const body: VisitorPoll = { messages: [], cursor: after };
    return NextResponse.json(
      { ...body, v: current },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const messages = await messagesSince(conversationId, Number.isFinite(after) ? after : 0);
  const cursor = messages.length ? messages[messages.length - 1].ts : after;

  const body: VisitorPoll = { messages, cursor };
  return NextResponse.json(
    { ...body, v: current },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
