import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import {
  appendMessage,
  available,
  writable,
  conversationMessages,
  isConversationId,
  listConversations,
  markRead,
  storageKind,
  version,
} from '@/lib/chat/store';
import { MAX_MESSAGE_LENGTH, type AdminPoll, type ChatMessage } from '@/lib/chat/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Agent side of the chat: list conversations, read one, reply, mark read.
 *
 * Auth is checked here rather than left to middleware. The middleware matcher
 * only covers /admin, and extending it to this path would answer an API call
 * with a 302 to a login page — which a fetch cannot act on. A 401 can be.
 */
async function guard() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  return null;
}

/** GET — poll the inbox, or fetch one conversation's messages. */
export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const url = new URL(request.url);
  const conversationId = url.searchParams.get('c');

  // One conversation, in full.
  if (conversationId) {
    if (!isConversationId(conversationId)) {
      return NextResponse.json({ error: 'Unknown conversation.' }, { status: 400 });
    }
    const messages = await conversationMessages(conversationId);
    return NextResponse.json(
      { messages, v: await version() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Inbox. Same cheap-poll trick as the visitor side: when the write counter
  // has not moved, this costs one Redis GET and returns nothing.
  const seenVersion = Number(url.searchParams.get('v') ?? -1);
  const current = writable() ? await version() : 0;

  if (seenVersion === current) {
    return NextResponse.json(
      { unchanged: true, cursor: current, v: current, storage: storageKind() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const conversations = await listConversations();
  const body: AdminPoll = {
    conversations,
    totalUnread: conversations.reduce((n, c) => n + c.unread, 0),
    cursor: current,
    storage: storageKind(),
  };
  return NextResponse.json({ ...body, v: current }, { headers: { 'Cache-Control': 'no-store' } });
}

/** POST — send a reply, or mark a conversation read. */
export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  if (!writable()) {
    return NextResponse.json(
      { error: 'Chat storage is not configured. Set the Upstash Redis credentials.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const input = body as { conversationId?: unknown; text?: unknown; action?: unknown };

  if (!isConversationId(input.conversationId)) {
    return NextResponse.json({ error: 'Unknown conversation.' }, { status: 400 });
  }

  if (input.action === 'read') {
    await markRead(input.conversationId);
    return NextResponse.json({ ok: true, v: await version() });
  }

  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'Reply is empty.' }, { status: 400 });
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Reply is too long.' }, { status: 400 });
  }

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'agent',
    text,
    ts: Date.now(),
  };

  await appendMessage(input.conversationId, message);

  return NextResponse.json({ message, v: await version() });
}
