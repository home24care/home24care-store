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

/**
 * Campaign tags off the LANDING url, read once at module load.
 *
 * Read here rather than inside track(), because by the time an add-to-cart
 * fires the visitor may be three client-side navigations deep and the query
 * string is long gone. This module loads on the first page of the visit, so
 * this is the one moment the campaign context is still present.
 *
 * Only the presence of a click id is kept, never its value: gclid and msclkid
 * identify a single click, and this event stream is deliberately anonymous.
 */
const landingCampaign = (() => {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search);
    const clean = (v: string | null) => (v ? v.trim().slice(0, 60) || undefined : undefined);
    return {
      utmSource: clean(q.get('utm_source')),
      utmMedium: clean(q.get('utm_medium')),
      utmCampaign: clean(q.get('utm_campaign')),
      // gbraid/wbraid are Google's privacy-preserving replacements for gclid.
      paidClick:
        q.has('gclid') || q.has('gbraid') || q.has('wbraid') || q.has('msclkid') || undefined,
    };
  } catch {
    return null;
  }
})();

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

  // Attribution travels with the first event of the session only. Repeating it
  // on every event would count one visit many times over in the channel report.
  if (!referrerSent) {
    if (document.referrer) payload.referrer = document.referrer;
    if (landingCampaign) {
      if (landingCampaign.utmSource) payload.utmSource = landingCampaign.utmSource;
      if (landingCampaign.utmMedium) payload.utmMedium = landingCampaign.utmMedium;
      if (landingCampaign.utmCampaign) payload.utmCampaign = landingCampaign.utmCampaign;
      if (landingCampaign.paidClick) payload.paidClick = true;
    }
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
