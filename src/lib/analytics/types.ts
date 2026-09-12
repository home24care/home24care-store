/**
 * Analytics event model.
 *
 * Deliberately anonymous: no name, email, IP or any other identifier that
 * points at a person. A visitor is a random id in a first-party cookie, and
 * country comes from the edge header the CDN already sets — we never call a
 * geo-IP service or store the address itself. That keeps the store's own
 * privacy policy honest and avoids turning the dashboard into a data-subject
 * request magnet.
 */
export type EventName =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchase';

/**
 * How the visit arrived.
 *
 * Derived server-side from the referrer and the campaign tags, never sent by
 * the client, so a forged payload cannot claim to be paid traffic.
 */
export type Channel =
  | 'direct'
  | 'organic_search'
  | 'paid_search'
  | 'social'
  | 'paid_social'
  | 'email'
  | 'referral';

export type AnalyticsEvent = {
  name: EventName;
  /** Random per-browser id. Not linked to a customer record. */
  visitorId: string;
  /** Random per-tab-session id, reset after 30 minutes idle. */
  sessionId: string;
  path: string;
  /** ISO 3166-1 alpha-2, from the CDN edge header. */
  country: string | null;
  /** Hostname only — never the full referring URL with its query string. */
  referrer: string | null;
  /** Bucketed traffic source. Always set; `direct` when nothing else fits. */
  channel: Channel;
  /** utm_source / utm_medium / utm_campaign, when the landing URL carried them. */
  source: string | null;
  medium: string | null;
  campaign: string | null;
  device: 'mobile' | 'tablet' | 'desktop';
  /** Product slug, for product_view / add_to_cart / remove_from_cart. */
  slug?: string;
  /** Integer cents, for cart and order events. */
  value?: number;
  quantity?: number;
  /** Server-assigned epoch ms. Never trusted from the client. */
  ts: number;
};

/** What the client is allowed to send. Everything else is derived server-side. */
export type IncomingEvent = Pick<
  AnalyticsEvent,
  'name' | 'visitorId' | 'sessionId' | 'path'
> &
  Partial<Pick<AnalyticsEvent, 'slug' | 'value' | 'quantity' | 'referrer'>> & {
    /**
     * Campaign tags read off the landing URL, sent once per session.
     *
     * `paidClick` is a flag, not the click id itself. Google Ads arrives with
     * a gclid, Microsoft with an msclkid; those are per-click identifiers, and
     * storing them would put a re-identifiable token in an event stream this
     * store deliberately keeps anonymous. Whether the click was paid is the
     * only part a traffic report needs.
     */
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    paidClick?: boolean;
  };

export type DailyTotals = {
  date: string;
  pageViews: number;
  sessions: number;
  visitors: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  orders: number;
  /** Integer cents. */
  revenue: number;
};

export type RankedRow = { key: string; label: string; count: number; value?: number };

/** Sessions that reached each stage — never events, so it only ever narrows. */
export type FunnelStage = { label: string; sessions: number };

export type DashboardData = {
  range: { from: string; to: string; days: number };
  totals: Omit<DailyTotals, 'date'>;
  previous: Omit<DailyTotals, 'date'> | null;
  series: DailyTotals[];
  funnel: FunnelStage[];
  topProductsViewed: RankedRow[];
  topProductsAdded: RankedRow[];
  countries: RankedRow[];
  referrers: RankedRow[];
  /** Traffic bucketed by how it arrived — direct, organic, paid, social… */
  channels: RankedRow[];
  /** `source / medium / campaign`, for tagged traffic only. */
  campaigns: RankedRow[];
  devices: RankedRow[];
  landingPages: RankedRow[];
  recent: AnalyticsEvent[];
  storage: 'redis' | 'memory';
};
