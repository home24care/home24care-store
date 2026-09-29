import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardData } from '@/lib/analytics/query';
import { MetricCard, TimeSeries, Funnel, RankedList } from '@/components/admin/Charts';
import LiveVisitors from '@/components/admin/LiveVisitors';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { products } from '@/lib/catalog';
import { countryName } from '@/lib/countries';
import { EXCLUDED_COUNTRIES } from '@/lib/analytics/types';
import { listRecentOrders, stripeMode } from '@/lib/admin-orders';

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

const n = (v: number) => v.toLocaleString('en-US');

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam) as never) ? Number(daysParam) : 7;

  const [data, orders] = await Promise.all([getDashboardData(days), listRecentOrders(25)]);
  const { totals, previous } = data;
  const excludedLabel = EXCLUDED_COUNTRIES.map(countryName).join(', ');

  // Store health, last on the page: it changes rarely and is read rarely.
  const stripeCheck = stripeMode();
  const feedable = products.filter((p) => p.images.length > 0 && p.gtin).length;
  const checks = [
    {
      label: 'Analytics storage',
      ok: data.storage === 'redis',
      detail: data.storage === 'redis' ? 'Redis — numbers persist' : 'In memory — numbers reset on every request',
    },
    { label: 'Stripe', ok: stripeCheck.ok, detail: stripeCheck.detail },
    {
      label: 'Orders feed',
      ok: orders !== null,
      detail: orders === null ? 'Could not read orders from Stripe' : `${orders.length} recent paid order(s) read from Stripe`,
    },
    {
      label: 'Merchant feed coverage',
      ok: feedable === products.length,
      detail: `${feedable} of ${products.length} products have an image and a GTIN`,
    },
    {
      label: 'Out of stock',
      ok: products.every((p) => p.available),
      detail: products.every((p) => p.available)
        ? 'every product is in stock'
        : products.filter((p) => !p.available).map((p) => p.sku).join(', '),
    },
  ];
  const failing = checks.filter((c) => !c.ok).length;

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
            · {site.name} ·{' '}
            <span className="whitespace-nowrap">
              {excludedLabel} excluded ({n(data.excludedEvents)} {data.excludedEvents === 1 ? 'event' : 'events'})
            </span>
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
          reset constantly and will look near-empty.
          <br />
          Set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code>, or the{' '}
          <code>KV_REST_API_URL</code> / <code>KV_REST_API_TOKEN</code> pair that Vercel&apos;s
          Upstash integration writes — either is read. Then <strong>redeploy</strong>: environment
          variables only reach a new build.
          <br />
          Seen in this deployment:{' '}
          <code>
            UPSTASH_REDIS_REST_URL={process.env.UPSTASH_REDIS_REST_URL ? 'set' : 'missing'},{' '}
            UPSTASH_REDIS_REST_TOKEN={process.env.UPSTASH_REDIS_REST_TOKEN ? 'set' : 'missing'},{' '}
            KV_REST_API_URL={process.env.KV_REST_API_URL ? 'set' : 'missing'},{' '}
            KV_REST_API_TOKEN={process.env.KV_REST_API_TOKEN ? 'set' : 'missing'}
          </code>
        </p>
      )}

      {/* ------------------------------------------------ live + headline */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <LiveVisitors excludedLabel={excludedLabel} />
      <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div>

      {/* ---------------------------------------------------------- trend */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <TimeSeries series={data.series} metric="sessions" label="Sessions" />
        <TimeSeries series={data.series} metric="revenue" label="Revenue" money />
      </div>

      {/* ---------------------------------------------------- day by day */}
      <section className="mt-6 min-w-0 rounded-xl border border-ink/10 bg-white">
        <h2 className="border-b border-ink/10 px-5 py-3 text-[15px] font-semibold text-ink">Day by day (UTC)</h2>
        <div className="max-h-[22rem] min-w-0 overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-sand text-[11.5px] uppercase tracking-wide text-ink-muted">
              <tr>
                {['Day', 'Visitors', 'Sessions', 'Page views', 'Products', 'Carts', 'Checkouts', 'Orders', 'Revenue'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 text-right font-medium first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {[...data.series].reverse().map((d) => {
                const cells = [d.visitors, d.sessions, d.pageViews, d.productViews, d.addToCarts, d.checkouts, d.orders];
                return (
                  <tr key={d.date}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{d.date.slice(5)}</td>
                    {cells.map((c, i) => (
                      <td key={i} className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${c ? 'text-ink' : 'text-ink/30'}`}>
                        {n(c)}
                      </td>
                    ))}
                    <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${d.revenue ? 'font-medium text-ink' : 'text-ink/30'}`}>
                      {formatPrice(d.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------------------------------------------- funnel */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Funnel steps={data.funnel.map((f) => ({ label: f.label, count: f.sessions }))} />
        <RankedList
          title="Countries"
          subtitle={`From the CDN edge header — no IP is stored. ${excludedLabel} is left out.`}
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

      {/* ------------------------------------------------- traffic source */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <RankedList
          title="Traffic channels"
          rows={data.channels}
          unit="sessions"
          emptyHint="No sessions recorded yet."
        />
        <RankedList
          title="Referrers"
          rows={data.referrers}
          unit="sessions"
          emptyHint="All traffic is direct so far."
        />
        <RankedList
          title="Campaigns"
          rows={data.campaigns}
          unit="sessions"
          emptyHint="No tagged campaigns yet. Add utm_source, utm_medium and utm_campaign to an ad or newsletter link and it will appear here as source / medium / campaign."
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <RankedList title="Landing pages" rows={data.landingPages} unit="views" />
        <RankedList title="Devices" rows={data.devices} unit="events" />
      </div>

      {/* --------------------------------------------------------- orders */}
      <section className="mt-6 min-w-0 rounded-xl border border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-5 py-3">
          <h2 className="text-[15px] font-semibold text-ink">Recent orders</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            The last 25 paid orders, read from Stripe. Orders shipped to {excludedLabel} are marked as your own tests.
          </p>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-sand text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
              <tr>
                {['Placed', 'Customer', 'Ship to', 'Items', 'Total', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {orders === null && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-muted">Stripe is not configured or could not be reached.</td></tr>
              )}
              {orders !== null && orders.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-muted">No paid orders yet.</td></tr>
              )}
              {orders?.map((o) => (
                <tr key={o.id} className={o.excluded ? 'text-ink/40' : ''}>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                    {new Date(o.createdAt).toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block">{o.name ?? '—'}</span>
                    <span className="block text-[12px] text-ink-muted">{o.email ?? ''}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {o.shipTo ?? '—'}
                    {o.country && o.country !== 'US' ? ` (${o.country})` : ''}
                    {o.excluded && <span className="ml-1.5 text-[11px] uppercase tracking-wide">test</span>}
                  </td>
                  <td className="max-w-[16rem] truncate px-3 py-2.5 font-mono text-[11.5px] text-ink-soft">{o.skus ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium tabular-nums">
                    {formatPrice(o.amount)}
                    {o.refunded > 0 && (
                      <span className="block text-[11.5px] font-normal text-clay-700">−{formatPrice(o.refunded)} refunded</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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

      {/* --------------------------------------------------------- health */}
      <section className="mt-6 min-w-0 rounded-xl border border-ink/10 bg-white">
        <h2 className="flex items-center justify-between border-b border-ink/10 px-5 py-3 text-[15px] font-semibold text-ink">
          Store health
          <span className={`text-[12.5px] font-medium ${failing ? 'text-clay-700' : 'text-ink-muted'}`}>
            {failing ? `${failing} need attention` : 'all good'}
          </span>
        </h2>
        <ul className="divide-y divide-ink/8 text-[13px]">
          {checks.map((c) => (
            <li key={c.label} className="flex min-w-0 items-start gap-3 px-5 py-2.5">
              <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.ok ? 'bg-moss-500' : 'bg-clay-500'}`} />
              <span className="min-w-0">
                <span className="font-medium text-ink">{c.label}</span>
                <span className={`block break-words text-[12px] ${c.ok ? 'text-ink-muted' : 'text-clay-700'}`}>{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
