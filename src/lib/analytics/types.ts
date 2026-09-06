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
  Partial<Pick<AnalyticsEvent, 'slug' | 'value' | 'quantity' | 'referrer'>>;

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
  devices: RankedRow[];
  landingPages: RankedRow[];
  recent: AnalyticsEvent[];
  storage: 'redis' | 'memory';
};
