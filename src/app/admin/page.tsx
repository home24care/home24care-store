import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardData } from '@/lib/analytics/query';
import { MetricCard, TimeSeries, Funnel, RankedList } from '@/components/admin/Charts';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
};

// Never cached — it is per-request private data, and the middleware already
// sets no-store on the response.
export const dynamic = 'force-dynamic';

const RANGES = [1, 7, 30, 90] as const;

const RANGE_LABEL: Record<number, string> = {
  1: 'Today',
  7: '7 days',
  30: '30 days',
  90: '90 days',
};

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const ago = (ts: number) => {
  const seconds = Math.round((ts - Date.now()) / 1000);
  if (Math.abs(seconds) < 60) return RELATIVE.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute');
  return RELATIVE.format(Math.round(minutes / 60), 'hour');
};

const EVENT_LABEL: Record<string, string> = {
  page_view: 'Viewed page',
  product_view: 'Viewed product',
  add_to_cart: 'Added to cart',
  remove_from_cart: 'Removed from cart',
  checkout_started: 'Started checkout',
  purchase: 'Purchased',
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam) as never) ? Number(daysParam) : 7;

  const data = await getDashboardData(days);
  const { totals, previous } = data;

  // Conversion is measured against sessions, not visitors — one person
  // browsing twice has had two chances to buy.
  const conversion = totals.sessions > 0 ? (totals.orders / totals.sessions) * 100 : 0;
  const previousConversion =
    previous && previous.sessions > 0 ? (previous.orders / previous.sessions) * 100 : null;
  const aov = totals.orders > 0 ? totals.revenue / totals.orders : 0;
  const previousAov = previous && previous.orders > 0 ? previous.revenue / previous.orders : null;
  const cartRate =
    totals.productViews > 0 ? (totals.addToCarts / totals.productViews) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] leading-none tracking-tight text-ink">
            Analytics
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">
            {days === 1
              ? `Today, ${data.range.to}`
              : `${data.range.from} to ${data.range.to}`}{' '}
            · {site.name}
          </p>
        </div>

        <nav className="flex items-center gap-1 rounded-lg border border-ink/12 bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin?days=${r}`}
              aria-current={r === days ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                r === days ? 'bg-moss-600 text-white' : 'text-ink-soft hover:bg-moss-50'
              }`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </nav>
      </header>

      {data.storage === 'memory' && (
        <p className="mb-6 rounded-xl border border-clay-300 bg-clay-50 px-4 py-3 text-[13px] leading-relaxed text-clay-900">
          <strong className="font-semibold">In-memory storage — data will not persist.</strong>{' '}
          Every serverless invocation gets a fresh process, so on a deployed site these numbers
          reset constantly and will look near-empty. Set{' '}
          <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> to store
          events properly.
        </p>
      )}

      {/* ------------------------------------------------------- headline */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Revenue" value={totals.revenue} previous={previous?.revenue} format="money" />
        <MetricCard label="Orders" value={totals.orders} previous={previous?.orders} />
        <MetricCard
          label="Conversion rate"
          value={conversion}
          previous={previousConversion}
          format="percent"
          hint="orders ÷ sessions"
        />
        <MetricCard
          label="Average order"
          value={aov}
          previous={previousAov}
          format="money"
        />
        <MetricCard label="Visitors" value={totals.visitors} previous={previous?.visitors} hint="unique browsers" />
        <MetricCard label="Sessions" value={totals.sessions} previous={previous?.sessions} />
        <MetricCard label="Page views" value={totals.pageViews} previous={previous?.pageViews} />
        <MetricCard
          label="Add-to-cart rate"
          value={cartRate}
          format="percent"
          previous={null}
          hint="of product views"
        />
      </section>

      {/* ---------------------------------------------------------- trend */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <TimeSeries series={data.series} metric="sessions" label="Sessions" />
        <TimeSeries series={data.series} metric="revenue" label="Revenue" money />
      </div>

      {/* --------------------------------------------------------- funnel */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Funnel steps={data.funnel.map((f) => ({ label: f.label, count: f.sessions }))} />
        <RankedList
          title="Countries"
          subtitle="From the CDN edge header — no IP is stored."
          rows={data.countries}
          unit="events"
          emptyHint="No traffic recorded yet."
        />
      </div>

      {/* ------------------------------------------------------- products */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <RankedList
          title="Most viewed products"
          rows={data.topProductsViewed}
          unit="views"
          linkPrefix="/products/"
          emptyHint="No product views recorded yet."
        />
        <RankedList
          title="Most added to cart"
          rows={data.topProductsAdded}
          unit="added"
          linkPrefix="/products/"
          emptyHint="No add-to-cart events recorded yet."
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <RankedList title="Referrers" rows={data.referrers} unit="sessions" emptyHint="All traffic is direct so far." />
        <RankedList title="Landing pages" rows={data.landingPages} unit="views" />
        <RankedList title="Devices" rows={data.devices} unit="events" />
      </div>

      {/* --------------------------------------------------------- recent */}
      <section className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="text-[15px] font-semibold text-ink">Live activity</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          The 50 most recent events. Visitor ids are random and are not linked to any customer.
        </p>

        {data.recent.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-muted">Nothing yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-ink/10 text-left text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">Page</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium">Device</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {data.recent.map((e, i) => (
                  <tr key={`${e.ts}-${i}`}>
                    <td className="whitespace-nowrap py-2 pr-4 text-ink-muted">{ago(e.ts)}</td>
                    <td className="whitespace-nowrap py-2 pr-4 font-medium text-ink">
                      {EVENT_LABEL[e.name] ?? e.name}
                    </td>
                    <td className="max-w-[240px] truncate py-2 pr-4 text-ink-soft">{e.path}</td>
                    <td className="py-2 pr-4 text-ink-soft">{e.country ?? '—'}</td>
                    <td className="py-2 pr-4 capitalize text-ink-soft">{e.device}</td>
                    <td className="py-2 text-right tabular-nums text-ink-soft">
                      {e.value ? formatPrice(e.value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
