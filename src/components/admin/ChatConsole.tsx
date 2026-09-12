'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  desktopNotify,
  notificationPermission,
  playChime,
  primeAudio,
  requestNotifications,
  setTitleBadge,
} from '@/lib/chat/notify';
import type { ChatConversation, ChatMessage } from '@/lib/chat/types';
import { ChevronIcon } from '@/components/icons';

const POLL_FOCUSED_MS = 2500;
const POLL_BLURRED_MS = 12000;

export default function ChatConsole() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [storage, setStorage] = useState<'redis' | 'memory' | null>(null);
  const [permission, setPermission] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);

  const seenVersion = useRef(-1);
  const lastUnread = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  useEffect(() => setPermission(notificationPermission()), []);

  /* ------------------------------------------------------------- polling */

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/admin?c=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages ?? []);
      // Reading it is what clears the badge, so tell the server too.
      await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, action: 'read' }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/admin?v=${seenVersion.current}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) setError('Session expired — reload to sign in again.');
        return;
      }
      const data = (await res.json()) as {
        unchanged?: boolean;
        conversations?: ChatConversation[];
        totalUnread?: number;
        storage?: 'redis' | 'memory';
        v?: number;
      };

      if (data.storage) setStorage(data.storage);
      if (typeof data.v === 'number') seenVersion.current = data.v;
      if (data.unchanged || !data.conversations) return;

      setConversations(data.conversations);

      const unread = data.totalUnread ?? 0;
      setTitleBadge(unread);

      // Alert only on a rise. Polling on a steady state must stay silent, or
      // the console would chime every few seconds all day.
      if (unread > lastUnread.current) {
        const newest = data.conversations.find((c) => c.unread > 0);
        playChime('incoming');
        desktopNotify(
          newest?.name ? `New message from ${newest.name}` : 'New chat message',
          newest?.preview || 'Open the console to reply.',
          'h24c-chat'
        );
      }
      lastUnread.current = unread;

      // Keep the open thread current without the agent clicking anything.
      const open = activeRef.current;
      if (open && data.conversations.some((c) => c.id === open && c.lastFrom === 'visitor')) {
        void loadConversation(open);
      }
    } catch {
      /* ignore */
    }
  }, [loadConversation]);

  useEffect(() => {
    void poll();
    let timer: number;
    const schedule = () => {
      const blurred = typeof document !== 'undefined' && document.hidden;
      timer = window.setTimeout(
        async () => {
          await poll();
          schedule();
        },
        blurred ? POLL_BLURRED_MS : POLL_FOCUSED_MS
      );
    };
    schedule();
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [poll]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ---------------------------------------------------------------- reply */

  const reply = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setError(null);

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      from: 'agent',
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    try {
      const res = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, text }),
      });
      const data = (await res.json()) as { message?: ChatMessage; error?: string; v?: number };
      if (!res.ok) {
        setError(data.error ?? 'Reply could not be sent.');
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(text);
        return;
      }
      if (typeof data.v === 'number') seenVersion.current = data.v;
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (data.message as ChatMessage) : m))
        );
      }
      void poll();
    } catch {
      setError('Network error — the reply was not sent.');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const openThread = (id: string) => {
    setActiveId(id);
    setMessages([]);
    primeAudio(); // this click is the gesture that lets audio start
    void loadConversation(id);
  };

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  const ago = (ts: number) => {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    if (s < 86400) return `${Math.round(s / 3600)}h`;
    return `${Math.round(s / 86400)}d`;
  };

  return (
    <section className="mt-6 rounded-xl border border-ink/10 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            Live chat
            {totalUnread > 0 && (
              <span className="ml-2 rounded-full bg-clay-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Replies reach the visitor within about two seconds.
          </p>
        </div>

        {permission !== 'granted' && permission !== 'unsupported' && (
          <button
            type="button"
            onClick={async () => setPermission(await requestNotifications())}
            className="rounded-lg border border-ink/20 px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Enable desktop notifications
          </button>
        )}
        {permission === 'denied' && (
          <span className="text-[12px] text-clay-800">
            Notifications blocked in browser settings — sound and the tab title still work.
          </span>
        )}
      </header>

      {storage === 'memory' && (
        <p className="border-b border-clay-300 bg-clay-50 px-5 py-3 text-[13px] leading-relaxed text-clay-900">
          <strong className="font-semibold">Chat storage is not configured.</strong> Messages are
          held in memory, which on a deployed site means a visitor&apos;s message and your reply
          land in different processes and never meet. Set the Upstash Redis credentials to turn
          chat on properly.
        </p>
      )}

      {error && (
        <p className="border-b border-clay-300 bg-clay-50 px-5 py-2 text-[12.5px] text-clay-900">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* conversation list */}
        <div className="max-h-[520px] overflow-y-auto border-b border-ink/10 lg:border-b-0 lg:border-r">
          {conversations.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-muted">
              No conversations yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openThread(c.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      c.id === activeId ? 'bg-moss-50' : 'hover:bg-sand'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-ink">
                        {c.name || `Visitor ${c.id.slice(0, 6)}`}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-600 px-1 text-[11px] font-bold tabular-nums text-white">
                            {c.unread}
                          </span>
                        )}
                        <span className="text-[11.5px] tabular-nums text-ink-muted">
                          {ago(c.lastAt)}
                        </span>
                      </span>
                    </span>
                    <span className="truncate text-[12.5px] text-ink-muted">
                      {c.lastFrom === 'agent' && <span className="text-ink-soft">You: </span>}
                      {c.preview || '—'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* thread */}
        <div className="flex min-h-[420px] flex-col">
          {!active ? (
            <p className="flex flex-1 items-center justify-center px-5 py-10 text-center text-[13px] text-ink-muted">
              Select a conversation to reply.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ink/10 px-5 py-3 text-[12.5px] text-ink-muted">
                <span className="text-[14px] font-semibold text-ink">
                  {active.name || `Visitor ${active.id.slice(0, 6)}`}
                </span>
                {active.email && <span>{active.email}</span>}
                {active.path && <span>on {active.path}</span>}
                {active.country && <span>{active.country}</span>}
                {active.device && <span>{active.device}</span>}
              </div>

              <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-sand px-5 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.from === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                        m.from === 'agent'
                          ? 'rounded-br-md bg-moss-700 text-white'
                          : 'rounded-bl-md bg-white text-ink shadow-sm'
                      }`}
                    >
                      {m.text}
                      <span
                        className={`mt-1 block text-[11px] tabular-nums ${
                          m.from === 'agent' ? 'text-white/60' : 'text-ink-muted'
                        }`}
                      >
                        {new Date(m.ts).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-end gap-2 border-t border-ink/10 px-4 py-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void reply();
                    }
                  }}
                  rows={1}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for a new line)"
                  aria-label="Your reply"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-ink/15 px-3.5 py-2.5 text-[14.5px] leading-relaxed outline-none transition-colors focus:border-moss-600"
                />
                <button
                  type="button"
                  onClick={() => void reply()}
                  disabled={!draft.trim() || sending}
                  aria-label="Send reply"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-700 text-white transition-all hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronIcon className="h-5 w-5 -rotate-90" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
