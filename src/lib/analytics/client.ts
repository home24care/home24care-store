'use client';

import type { EventName, IncomingEvent } from './types';

/**
 * Browser-side event sender.
 *
 * Identifiers are random and first-party — no third-party script, no
 * fingerprinting, nothing that identifies a person. `visitorId` persists in
 * localStorage so returning visits are recognisable; `sessionId` lives in
 * sessionStorage and rolls after 30 minutes idle, which is the same session
 * definition most analytics tools use.
 *
 * Storage access is wrapped because it throws outright in some privacy modes.
 * When it does, tracking degrades to per-event ids rather than breaking the
 * page — the visitor is simply not counted as returning.
 */

const VISITOR_KEY = 'h24c.vid';
const SESSION_KEY = 'h24c.sid';
const SESSION_TS_KEY = 'h24c.sts';
const SESSION_IDLE_MS = 30 * 60 * 1000;

const randomId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
};

const read = (storage: 'local' | 'session', key: string): string | null => {
  try {
    return (storage === 'local' ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
};

const write = (storage: 'local' | 'session', key: string, value: string) => {
  try {
    (storage === 'local' ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // Blocked or full — ids stay per-event.
  }
};

function visitorId(): string {
  const existing = read('local', VISITOR_KEY);
  if (existing) return existing;
  const id = randomId();
  write('local', VISITOR_KEY, id);
  return id;
}

function sessionId(): string {
  const now = Date.now();
  const last = Number(read('session', SESSION_TS_KEY) ?? 0);
  const existing = read('session', SESSION_KEY);

  if (existing && now - last < SESSION_IDLE_MS) {
    write('session', SESSION_TS_KEY, String(now));
    return existing;
  }

  const id = randomId();
  write('session', SESSION_KEY, id);
  write('session', SESSION_TS_KEY, String(now));
  return id;
}

/** Only the first page of a session carries a referrer worth attributing. */
let referrerSent = false;

export function track(
  name: EventName,
  extra: Partial<Pick<IncomingEvent, 'slug' | 'value' | 'quantity'>> = {}
): void {
  if (typeof window === 'undefined') return;

  const payload: IncomingEvent = {
    name,
    visitorId: visitorId(),
    sessionId: sessionId(),
    path: window.location.pathname,
    ...extra,
  };

  if (!referrerSent && document.referrer) {
    payload.referrer = document.referrer;
    referrerSent = true;
  }

  const body = JSON.stringify(payload);

  try {
    // sendBeacon survives the page being unloaded, which a fetch started on a
    // click that also navigates does not.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Never surface an analytics failure to a shopper.
  });
}
