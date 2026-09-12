import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isValidSession } from '@/lib/admin-auth';
import { products } from '@/lib/catalog';
import type { RecentSale } from '@/lib/sales-proof/store';

export const dynamic = 'force-dynamic';

/**
 * Sample sales, for previewing the notification on the live site.
 *
 * Why this exists as its own admin endpoint rather than a flag on
 * /api/sales/recent:
 *
 *  - /api/sales/recent is edge-cached (s-maxage=30) and shared by every
 *    visitor. Branching inside it on "is this an admin" risks one admin
 *    request populating the shared cache with sample data, which would then be
 *    served to real shoppers. A separate, never-cached URL removes that
 *    failure mode entirely instead of relying on the cache key including a
 *    cookie or query string.
 *  - Nothing here is ever written to Redis. The real feed still contains only
 *    paid orders; this response is assembled per request and discarded.
 *
 * Requires a valid admin session. Without one it 401s, so the query parameter
 * that triggers it is useless to anyone who finds it.
 *
 * Every entry is flagged `preview: true`, and the widget renders a visible
 * PREVIEW badge when that flag is set. A fabricated sale is therefore never
 * displayed as though it were real, even to whoever is holding the session.
 */

/** Buyer placeholders. Obvious samples, not plausible-looking invented people. */
const SAMPLE_BUYERS: { firstName: string | null; region: string | null }[] = [
  { firstName: 'Sample', region: 'Texas' },
  { firstName: 'Preview', region: 'North Carolina' },
  // No name: exercises the "A customer in <state>" fallback.
  { firstName: null, region: 'Arizona' },
  // No region either: exercises the bare "A customer" fallback.
  { firstName: 'Sample', region: null },
];

export async function GET() {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json(
      { error: 'Admin session required.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  /*
    Pick titles that stress the layout rather than four comfortable ones: the
    longest title in the catalogue and the shortest, so truncation and wrapping
    are both visible in the preview.
  */
  const titles = products.map((p) => p.title).filter(Boolean);
  const byLength = [...titles].sort((a, b) => a.length - b.length);
  const chosen = [
    byLength[byLength.length - 1], // longest — tests truncation
    byLength[0], // shortest
    byLength[Math.floor(byLength.length / 2)], // typical
    byLength[byLength.length - 2], // second longest
  ].filter((t): t is string => Boolean(t));

  const now = Date.now();
  const sales: (RecentSale & { preview: true })[] = chosen.map((product, i) => ({
    firstName: SAMPLE_BUYERS[i % SAMPLE_BUYERS.length].firstName,
    region: SAMPLE_BUYERS[i % SAMPLE_BUYERS.length].region,
    product,
    // Spread across the "mins / hours ago" branches of the relative clock.
    ts: now - [4, 37, 3 * 60, 26 * 60][i % 4] * 60 * 1000,
    preview: true,
  }));

  return NextResponse.json(
    { sales, preview: true },
    {
      headers: {
        // Private and uncacheable: this must never be stored by the edge, a
        // proxy, or the browser and replayed to someone else.
        'Cache-Control': 'no-store, max-age=0, private',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );
}
