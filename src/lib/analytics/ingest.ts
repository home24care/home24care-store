import { store } from './store';
import type { AnalyticsEvent, Channel, EventName, IncomingEvent } from './types';

/**
 * Write path: turn one event into the per-day counters the dashboard reads.
 *
 * Aggregation happens here, at write time, rather than by scanning raw rows on
 * read. A storefront produces orders of magnitude more events than dashboard
 * loads, so paying a few small writes per event keeps every dashboard render
 * to a fixed handful of reads regardless of how much history has accumulated.
 */

/** Counters live for 400 days; the raw event feed for 7. */
const AGGREGATE_TTL = 60 * 60 * 24 * 400;
const RECENT_TTL = 60 * 60 * 24 * 7;
const RECENT_CAP = 200;

export const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const k = {
  totals: (d: string) => `a:totals:${d}`,
  visitors: (d: string) => `a:visitors:${d}`,
  sessions: (d: string) => `a:sessions:${d}`,
  productViews: (d: string) => `a:pv:${d}`,
  productAdds: (d: string) => `a:atc:${d}`,
  countries: (d: string) => `a:geo:${d}`,
  referrers: (d: string) => `a:ref:${d}`,
  channels: (d: string) => `a:chan:${d}`,
  campaigns: (d: string) => `a:camp:${d}`,
  devices: (d: string) => `a:dev:${d}`,
  landing: (d: string) => `a:land:${d}`,
  recent: () => 'a:recent',
  /**
   * Sessions that reached a funnel stage, as a set.
   *
   * The funnel must count sessions, not events: one visitor viewing three
   * products is one session that reached "viewed a product", not three. Using
   * the raw event counter produced stages above 100% of the stage before them,
   * which is nonsense in a funnel.
   */
  stage: (stage: string, d: string) => `a:stage:${stage}:${d}`,
};

/** Event names that advance a session through the funnel. */
const FUNNEL_STAGE: Partial<Record<EventName, string>> = {
  product_view: 'product_view',
  add_to_cart: 'add_to_cart',
  checkout_started: 'checkout_started',
  purchase: 'purchase',
};

/** Maps an event onto the totals-hash field it increments. */
const TOTAL_FIELD: Partial<Record<EventName, string>> = {
  page_view: 'pageViews',
  product_view: 'productViews',
  add_to_cart: 'addToCarts',
  checkout_started: 'checkouts',
  purchase: 'orders',
};

/**
 * Crawlers and preview fetchers would otherwise dominate every chart. This is
 * a coarse filter, not a security control — it only has to keep the numbers
 * honest enough to make decisions from.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bing|yandex|duckduck|baidu|facebookexternalhit|embedly|preview|scrape|curl|wget|python-requests|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor/i;

export const isBot = (userAgent: string | null) =>
  !userAgent || userAgent.length < 10 || BOT_PATTERN.test(userAgent);

export const deviceFrom = (userAgent: string | null): AnalyticsEvent['device'] => {
  if (!userAgent) return 'desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(userAgent)) return 'mobile';
  return 'desktop';
};

/**
 * Referrer is reduced to a hostname before storage. Full referring URLs can
 * carry search terms and session tokens in their query strings, which is more
 * than a traffic-source report needs to know.
 */
export const referrerHost = (referrer: string | null | undefined, selfHost: string) => {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host && host !== selfHost.replace(/^www\./, '') ? host : null;
  } catch {
    return null;
  }
};

/**
 * Hosts that mean the visit came from a search results page or a social feed.
 *
 * Matched on the registrable prefix, so google.co.uk and google.com.au both
 * count as Google without enumerating every country domain.
 */
const SEARCH_HOSTS = [
  'google.',
  'bing.',
  'duckduckgo.',
  'yahoo.',
  'ecosia.',
  'brave.',
  'startpage.',
  'yandex.',
  'baidu.',
];

const SOCIAL_HOSTS = [
  'facebook.',
  'instagram.',
  'l.instagram.',
  'pinterest.',
  'reddit.',
  'youtube.',
  'tiktok.',
  't.co',
  'twitter.',
  'x.com',
  'linkedin.',
  'lnkd.in',
  'threads.',
  'snapchat.',
];

const matchesHost = (host: string, list: string[]) =>
  list.some((h) => host === h.replace(/\.$/, '') || host.startsWith(h));

/**
 * Buckets a visit by how it arrived.
 *
 * Derived here, server-side, rather than taken from the client, so a forged
 * payload cannot report itself as paid traffic and distort the channel report.
 *
 * The distinction that matters most is paid versus organic search. Both arrive
 * with a search engine as the referrer and are otherwise identical; only the
 * click id or an explicit cpc medium separates them, which is exactly why an
 * untagged ad campaign shows up as organic and flatters the wrong channel.
 */
export function classifyChannel(input: {
  referrerHost: string | null;
  medium: string | null;
  source: string | null;
  paidClick: boolean;
}): Channel {
  const medium = (input.medium ?? '').toLowerCase();
  const source = (input.source ?? '').toLowerCase();
  const host = (input.referrerHost ?? '').toLowerCase();

  const paid =
    input.paidClick || ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'cpm'].includes(medium);

  if (medium === 'email' || source === 'email' || source === 'newsletter') return 'email';

  if (paid) {
    const socialSource = SOCIAL_HOSTS.some((h) => source.startsWith(h.replace(/\.$/, '')));
    return socialSource || medium === 'paid_social' ? 'paid_social' : 'paid_search';
  }

  if (medium === 'social' || (host && matchesHost(host, SOCIAL_HOSTS))) return 'social';
  if (medium === 'organic' || (host && matchesHost(host, SEARCH_HOSTS))) return 'organic_search';
  if (host) return 'referral';
  // A utm-tagged visit with no referrer is still a campaign, not a bare visit.
  if (source || medium) return 'referral';
  return 'direct';
}

/** Sanity bounds so a malformed or hostile payload cannot poison the numbers. */
const clampValue = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(Math.round(v), 100_000_00); // $100k in cents
};

const clampQuantity = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(Math.round(v), 100);
};

export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  const s = store();
  const day = dayKey(event.ts);

  const writes: Promise<unknown>[] = [];

  const field = TOTAL_FIELD[event.name];
  if (field) writes.push(s.incrField(k.totals(day), field));

  // Unique visitors and sessions are sets rather than counters, so a repeat
  // visit on the same day does not inflate them.
  writes.push(s.addToSet(k.visitors(day), event.visitorId));
  writes.push(s.addToSet(k.sessions(day), event.sessionId));

  const stage = FUNNEL_STAGE[event.name];
  if (stage) writes.push(s.addToSet(k.stage(stage, day), event.sessionId));

  if (event.country) writes.push(s.zincr(k.countries(day), event.country));
  writes.push(s.zincr(k.devices(day), event.device));

  if (event.name === 'page_view') {
    if (event.referrer) writes.push(s.zincr(k.referrers(day), event.referrer));
    writes.push(s.zincr(k.landing(day), event.path));
    writes.push(s.zincr(k.channels(day), event.channel));
    // Only tagged traffic earns a campaign row; an untagged visit would
    // otherwise pile up under a meaningless "(none) / (none)".
    if (event.source || event.medium || event.campaign) {
      const label = [event.source ?? '(none)', event.medium ?? '(none)', event.campaign ?? '(none)']
        .join(' / ')
        .slice(0, 180);
      writes.push(s.zincr(k.campaigns(day), label));
    }
  }

  if (event.slug) {
    if (event.name === 'product_view') writes.push(s.zincr(k.productViews(day), event.slug));
    if (event.name === 'add_to_cart') {
      writes.push(s.zincr(k.productAdds(day), event.slug, event.quantity ?? 1));
    }
  }

  if (event.name === 'purchase' && event.value) {
    writes.push(s.incrField(k.totals(day), 'revenue', event.value));
  }

  writes.push(s.pushCapped(k.recent(), JSON.stringify(event), RECENT_CAP));

  await Promise.all(writes);

  // Set TTLs after the writes so the keys exist. Failures here are not worth
  // failing the request over — worst case a key never expires.
  await Promise.all([
    s.expire(k.totals(day), AGGREGATE_TTL),
    s.expire(k.visitors(day), AGGREGATE_TTL),
    s.expire(k.sessions(day), AGGREGATE_TTL),
    s.expire(k.productViews(day), AGGREGATE_TTL),
    s.expire(k.productAdds(day), AGGREGATE_TTL),
    s.expire(k.countries(day), AGGREGATE_TTL),
    s.expire(k.referrers(day), AGGREGATE_TTL),
    s.expire(k.channels(day), AGGREGATE_TTL),
    s.expire(k.campaigns(day), AGGREGATE_TTL),
    s.expire(k.devices(day), AGGREGATE_TTL),
    s.expire(k.landing(day), AGGREGATE_TTL),
    ...(stage ? [s.expire(k.stage(stage, day), AGGREGATE_TTL)] : []),
    s.expire(k.recent(), RECENT_TTL),
  ]).catch(() => {});
}

const VALID_NAMES = new Set<EventName>([
  'page_view',
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'purchase',
]);

/**
 * Builds a trusted event from an untrusted body.
 *
 * The client supplies only what it alone knows — which page, which product,
 * its own random ids. Country, device, timestamp and referrer host are derived
 * server-side from headers, so a forged payload cannot claim to be from
 * somewhere it is not or backdate itself into a closed reporting period.
 */
export function normalizeEvent(
  body: IncomingEvent,
  ctx: { country: string | null; userAgent: string | null; selfHost: string }
): AnalyticsEvent | null {
  if (!body || typeof body !== 'object') return null;
  if (!VALID_NAMES.has(body.name)) return null;
  if (typeof body.visitorId !== 'string' || typeof body.sessionId !== 'string') return null;
  if (typeof body.path !== 'string') return null;

  const id = (v: string) => /^[a-z0-9-]{8,64}$/i.test(v);
  if (!id(body.visitorId) || !id(body.sessionId)) return null;

  const text = (v: unknown) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, 60).toLowerCase() : null;

  const host = referrerHost(body.referrer, ctx.selfHost);
  const source = text(body.utmSource);
  const medium = text(body.utmMedium);
  const campaign = text(body.utmCampaign);

  return {
    name: body.name,
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    path: body.path.slice(0, 200),
    country: ctx.country,
    referrer: host,
    channel: classifyChannel({
      referrerHost: host,
      medium,
      source,
      paidClick: body.paidClick === true,
    }),
    source,
    medium,
    campaign,
    device: deviceFrom(ctx.userAgent),
    slug: typeof body.slug === 'string' ? body.slug.slice(0, 120) : undefined,
    value: body.value === undefined ? undefined : clampValue(body.value),
    quantity: body.quantity === undefined ? undefined : clampQuantity(body.quantity),
    ts: Date.now(),
  };
}

/**
 * Server-side purchase recording, called from the Stripe webhook.
 *
 * Orders and revenue come from here rather than from a client beacon on the
 * thank-you page: the beacon misses anyone who closes the tab on redirect, and
 * can be replayed by anyone who can POST. The webhook is the only source that
 * has actually seen the money.
 */
export async function recordPurchase(input: {
  value: number;
  country: string | null;
  sessionId?: string;
  visitorId?: string;
}): Promise<void> {
  await recordEvent({
    name: 'purchase',
    visitorId: input.visitorId ?? 'server',
    sessionId: input.sessionId ?? 'server',
    path: '/checkout/success',
    country: input.country,
    referrer: null,
    // The webhook has no browser context, so this order carries no channel of
    // its own. It is not attributed to `direct` — that would credit direct
    // traffic with every paid sale. Channel counts come from page_view only.
    channel: 'direct',
    source: null,
    medium: null,
    campaign: null,
    device: 'desktop',
    value: clampValue(input.value),
    ts: Date.now(),
  });
}
