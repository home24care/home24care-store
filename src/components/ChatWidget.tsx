'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { site } from '@/lib/site';
import { playChime, primeAudio } from '@/lib/chat/notify';
import type { ChatMessage } from '@/lib/chat/types';
import { CloseIcon, ChevronIcon } from './icons';

const STORAGE_KEY = 'h24c_chat_conversation';
const DRAFT_KEY = 'h24c_chat_draft';

/** Poll fast while the visitor is looking, slowly when the tab is hidden. */
const POLL_ACTIVE_MS = 2000;
const POLL_HIDDEN_MS = 15000;

export default function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const conversationId = useRef<string | null>(null);
  const cursor = useRef(0);
  const seenVersion = useRef(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      conversationId.current = localStorage.getItem(STORAGE_KEY);
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(saved);
    } catch {
      /* private mode */
    }
  }, []);

  /* ------------------------------------------------------------- polling */

  const poll = useCallback(async () => {
    const id = conversationId.current;
    if (!id) return;
    try {
      const res = await fetch(
        `/api/chat/poll?c=${encodeURIComponent(id)}&after=${cursor.current}&v=${seenVersion.current}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: ChatMessage[];
        cursor: number;
        v?: number;
      };
      if (typeof data.v === 'number') seenVersion.current = data.v;
      if (!data.messages?.length) return;

      cursor.current = data.cursor;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const fresh = data.messages.filter((m) => !known.has(m.id));
        if (!fresh.length) return prev;

        // Only an agent message earns a chime; the visitor's own message
        // arriving back from the server must not ping them.
        const fromAgent = fresh.filter((m) => m.from === 'agent');
        if (fromAgent.length) {
          playChime('incoming');
          setUnread((n) => (open ? 0 : n + fromAgent.length));
        }
        return [...prev, ...fresh].sort((a, b) => a.ts - b.ts);
      });
    } catch {
      /* A failed poll is not worth surfacing; the next one may succeed. */
    }
  }, [open]);

  // Poll only once a conversation exists, and slow right down when the tab is
  // hidden — a widget left open in a background tab should not keep spending
  // Redis commands at full rate.
  useEffect(() => {
    if (!mounted || !conversationId.current) return;
    let timer: number;
    const schedule = () => {
      const hidden = typeof document !== 'undefined' && document.hidden;
      timer = window.setTimeout(
        async () => {
          await poll();
          schedule();
        },
        hidden ? POLL_HIDDEN_MS : POLL_ACTIVE_MS
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
  }, [mounted, poll, messages.length]);

  /* ---------------------------------------------------------- open/close */

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    // Prime audio on this gesture: browsers will not start an AudioContext
    // without one, and by the time a reply lands the visitor may not have
    // clicked anything else.
    primeAudio();
    if (conversationId.current && !messages.length) void poll();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Keep the newest message in view whenever the list grows.
  useEffect(() => {
    if (!open) return;
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ---------------------------------------------------------------- send */

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    // Optimistic: the message appears instantly and is reconciled by id when
    // the server's copy arrives on the next poll.
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      from: 'visitor',
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId.current,
          text,
          path: window.location.pathname,
        }),
      });

      const data = (await res.json()) as {
        conversationId?: string;
        message?: ChatMessage;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Message could not be sent.');
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(text);
        return;
      }

      if (data.conversationId && data.conversationId !== conversationId.current) {
        conversationId.current = data.conversationId;
        try {
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        } catch {
          /* ignore */
        }
      }

      if (data.message) {
        cursor.current = Math.max(cursor.current, data.message.ts);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (data.message as ChatMessage) : m))
        );
      }
      void poll();
    } catch {
      setError('You appear to be offline.');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  if (!mounted) return null;

  const initials = site.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();

  /*
    Sizing.

    On a phone the panel deliberately does NOT cover the screen: it is inset on
    both sides and leaves the top of the page visible, so the visitor can still
    see the store behind it and understands the chat is a layer over the site
    rather than a separate app they have been taken to. Expanding raises the
    top edge but still stops short of the status bar.

    On desktop it is the conventional bottom-right panel, and expanding makes
    it taller and wider for a long conversation.
  */
  const panelSize = expanded
    ? 'inset-x-3 bottom-24 top-10 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(720px,calc(100vh-8rem))] sm:w-[420px]'
    : 'inset-x-3 bottom-24 top-24 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(560px,calc(100vh-8rem))] sm:w-[380px]';

  const panel = (
    <div
      className={`fixed z-[80] flex flex-col overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink/10 ${panelSize}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chat with support"
    >
      {/* header */}
      <div className="relative shrink-0 bg-gradient-to-b from-sand to-white px-4 pb-4 pt-3">
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Hide chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Shrink chat' : 'Expand chat'}
              aria-pressed={expanded}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                <path
                  d={
                    expanded
                      ? 'M9 3H4v5M15 21h5v-5M4 3l6 6M20 21l-6-6'
                      : 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'
                  }
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* avatar + title, centred */}
        <div className="-mt-7 flex flex-col items-center text-center">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-moss-700 text-[16px] font-semibold text-white shadow-card">
            {initials}
            <span
              className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
              aria-hidden="true"
            />
          </span>
          <p className="mt-2 font-display text-[19px] leading-tight tracking-tight text-ink">
            Our team is here for you
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {site.contact.hours.split(',')[0]} · replies in a few minutes
          </p>
        </div>
      </div>

      {/* messages */}
      <div
        ref={scroller}
        className="flex-1 space-y-2.5 overflow-y-auto bg-gradient-to-b from-white to-sand/60 px-4 py-4"
      >
        {/* opening line from the shop, always present */}
        <div className="flex items-end gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-100 text-moss-700"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M4 12a8 8 0 1 1 16 0v4a3 3 0 0 1-3 3h-1M4 12v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-ink/[0.055] px-3.5 py-2.5 text-[14.5px] leading-relaxed text-ink">
            Hi, how can we help?
          </div>
        </div>

        {messages.map((m, i) => {
          const agent = m.from === 'agent';
          // Only the first of a run shows the avatar, so a burst of replies
          // reads as one voice rather than a column of icons.
          const startsRun = agent && messages[i - 1]?.from !== 'agent';
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${agent ? 'justify-start' : 'justify-end'}`}
            >
              {agent &&
                (startsRun ? (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[10px] font-bold text-moss-700"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                ) : (
                  <span className="h-7 w-7 shrink-0" aria-hidden="true" />
                ))}
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
                  agent
                    ? 'rounded-2xl rounded-bl-md bg-ink/[0.055] text-ink'
                    : 'rounded-2xl rounded-br-md bg-moss-700 text-white'
                }`}
              >
                {m.text}
                <span
                  className={`mt-1 block text-[11px] tabular-nums ${
                    agent ? 'text-ink-muted' : 'text-white/60'
                  }`}
                >
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="shrink-0 border-t border-clay-200 bg-clay-50 px-4 py-2 text-[12.5px] text-clay-900">
          {error}
        </p>
      )}

      {/* composer — one rounded field with the send button inside it */}
      <div className="shrink-0 border-t border-ink/[0.07] bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 rounded-[22px] border border-ink/15 bg-white py-1 pl-4 pr-1 transition-colors focus-within:border-moss-600">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              try {
                sessionStorage.setItem(DRAFT_KEY, e.target.value);
              } catch {
                /* ignore */
              }
            }}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter is a newline. Matches every chat app.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Write your message…"
            aria-label="Your message"
            className="max-h-28 flex-1 resize-none border-0 bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss-700 text-white transition-all hover:bg-moss-800 disabled:cursor-not-allowed disabled:bg-ink/15"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
              <path
                d="M4 12l16-8-6 8 6 8-16-8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {open && panel}

      {/* launcher */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? 'Close chat' : 'Chat with support'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[81] flex h-14 w-14 items-center justify-center rounded-full bg-moss-700 text-white shadow-lift transition-all hover:bg-moss-800 active:scale-95"
      >
        {open ? (
          <ChevronIcon className="h-6 w-6 rotate-90" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-600 px-1 text-[11px] font-bold tabular-nums text-white">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>,
    document.body
  );
}
