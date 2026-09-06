import { store } from './store';
import { getProduct } from '@/lib/catalog';
import type { AnalyticsEvent, DailyTotals, DashboardData, FunnelStage, RankedRow } from './types';

/**
 * Read path for the admin dashboard.
 *
 * Every figure is assembled from the per-day counters written by ingest.ts, so
 * a 30-day view costs a bounded number of reads rather than a scan over raw
 * events.
 */

const k = {
  totals: (d: string) => `a:totals:${d}`,
  visitors: (d: string) => `a:visitors:${d}`,
  sessions: (d: string) => `a:sessions:${d}`,
  productViews: (d: string) => `a:pv:${d}`,
  productAdds: (d: string) => `a:atc:${d}`,
  countries: (d: string) => `a:geo:${d}`,
  referrers: (d: string) => `a:ref:${d}`,
  devices: (d: string) => `a:dev:${d}`,
  landing: (d: string) => `a:land:${d}`,
  recent: () => 'a:recent',
  stage: (stage: string, d: string) => `a:stage:${stage}:${d}`,
};

const EMPTY: Omit<DailyTotals, 'date'> = {
  pageViews: 0,
  sessions: 0,
  visitors: 0,
  productViews: 0,
  addToCarts: 0,
  checkouts: 0,
  orders: 0,
  revenue: 0,
};

/** Days ending today, oldest first. */
function dayRange(days: number, offsetDays = 0): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - (i + offsetDays) * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const num = (v: string | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

async function totalsFor(days: string[]): Promise<DailyTotals[]> {
  const s = store();
  return Promise.all(
    days.map(async (date) => {
      const [hash, visitors, sessions] = await Promise.all([
        s.getHash(k.totals(date)),
        s.setSize(k.visitors(date)),
        s.setSize(k.sessions(date)),
      ]);
      return {
        date,
        pageViews: num(hash.pageViews),
        productViews: num(hash.productViews),
        addToCarts: num(hash.addToCarts),
        checkouts: num(hash.checkouts),
        orders: num(hash.orders),
        revenue: num(hash.revenue),
        visitors,
        sessions,
      };
    })
  );
}

const sum = (rows: DailyTotals[]): Omit<DailyTotals, 'date'> =>
  rows.reduce(
    (acc, r) => ({
      pageViews: acc.pageViews + r.pageViews,
      sessions: acc.sessions + r.sessions,
      visitors: acc.visitors + r.visitors,
      productViews: acc.productViews + r.productViews,
      addToCarts: acc.addToCarts + r.addToCarts,
      checkouts: acc.checkouts + r.checkouts,
      orders: acc.orders + r.orders,
      revenue: acc.revenue + r.revenue,
    }),
    { ...EMPTY }
  );

/**
 * Merges one sorted set across several days.
 *
 * Redis can union sorted sets server-side, but that needs a write to hold the
 * destination and the ranked lists here are small. Merging in the process
 * keeps the read path read-only, which means the dashboard cannot corrupt the
 * data it is displaying.
 */
async function mergedTop(
  keyFor: (d: string) => string,
  days: string[],
  limit: number
): Promise<{ key: string; count: number }[]> {
  const s = store();
  const perDay = await Promise.all(days.map((d) => s.zTop(keyFor(d), 200)));
  const merged = new Map<string, number>();
  for (const rows of perDay) {
    for (const { member, score } of rows) {
      merged.set(member, (merged.get(member) ?? 0) + score);
    }
  }
  return [...merged.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const REGION = new Intl.DisplayNames(['en'], { type: 'region' });

const countryLabel = (code: string) => {
  try {
    return REGION.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};


/**
 * Sessions that reached each funnel stage.
 *
 * Summing per-day set sizes double-counts a session only if it spans midnight,
 * which is rare and always understates rather than inflates the drop-off. The
 * alternative — unioning sets across the whole range — would mean reading
 * every member of every day's set on each dashboard load.
 */
async function funnelFor(days: string[], sessions: number): Promise<FunnelStage[]> {
  const s = store();
  const stages: [string, string][] = [
    ['product_view', 'Viewed a product'],
    ['add_to_cart', 'Added to cart'],
    ['checkout_started', 'Started checkout'],
    ['purchase', 'Purchased'],
  ];

  const counts = await Promise.all(
    stages.map(async ([stage]) => {
      const perDay = await Promise.all(days.map((d) => s.setSize(k.stage(stage, d))));
      return perDay.reduce((a, b) => a + b, 0);
    })
  );

  // A later stage can never exceed an earlier one. Clamping keeps a
  // midnight-spanning session from rendering an impossible funnel.
  let ceiling = sessions;
  const out: FunnelStage[] = [{ label: 'Sessions', sessions }];
  stages.forEach(([, label], i) => {
    const value = Math.min(counts[i], ceiling);
    out.push({ label, sessions: value });
    ceiling = value;
  });
  return out;
}

export async function getDashboardData(days: number): Promise<DashboardData> {
  const s = store();
  const current = dayRange(days);
  const previous = dayRange(days, days);

  const [currentTotals, previousTotals, viewed, added, geo, refs, devices, landing, recentRaw] =
    await Promise.all([
      totalsFor(current),
      totalsFor(previous),
      mergedTop(k.productViews, current, 10),
      mergedTop(k.productAdds, current, 10),
      mergedTop(k.countries, current, 12),
      mergedTop(k.referrers, current, 10),
      mergedTop(k.devices, current, 5),
      mergedTop(k.landing, current, 10),
      s.listRange(k.recent(), 0, 49),
    ]);

  const toProductRow = (r: { key: string; count: number }): RankedRow => {
    const product = getProduct(r.key);
    return {
      key: r.key,
      label: product?.title ?? r.key,
      count: r.count,
      value: product?.price,
    };
  };

  const recent: AnalyticsEvent[] = recentRaw
    .map((raw) => {
      try {
        return JSON.parse(raw) as AnalyticsEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is AnalyticsEvent => e !== null);

  const previousSum = sum(previousTotals);
  const currentSum = sum(currentTotals);
  const funnel = await funnelFor(current, currentSum.sessions);

  return {
    range: { from: current[0], to: current[current.length - 1], days },
    totals: currentSum,
    // Only offer a comparison once the prior window actually has data, so an
    // empty baseline is not reported as "+100%".
    previous: previousSum.sessions > 0 || previousSum.pageViews > 0 ? previousSum : null,
    series: currentTotals,
    funnel,
    topProductsViewed: viewed.map(toProductRow),
    topProductsAdded: added.map(toProductRow),
    countries: geo.map((r) => ({ key: r.key, label: countryLabel(r.key), count: r.count })),
    referrers: refs.map((r) => ({ key: r.key, label: r.key, count: r.count })),
    devices: devices.map((r) => ({
      key: r.key,
      label: r.key.charAt(0).toUpperCase() + r.key.slice(1),
      count: r.count,
    })),
    landingPages: landing.map((r) => ({ key: r.key, label: r.key, count: r.count })),
    recent,
    storage: s.kind,
  };
}
