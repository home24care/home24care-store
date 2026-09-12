import { NextResponse } from 'next/server';
import { recentSales } from '@/lib/sales-proof/store';

export const dynamic = 'force-dynamic';

/**
 * Recent real sales, for the storefront's notifications.
 *
 * Public, and safe to be: the stored entries hold a first name, a region, a
 * product title and a timestamp, and nothing else was ever written. There is
 * no email, phone or address here to withhold.
 *
 * Returns an empty list when there have been no orders. The widget then shows
 * nothing at all, rather than inventing a sale to fill the space.
 */
export async function GET() {
  const sales = await recentSales(12);

  return NextResponse.json(
    { sales },
    {
      headers: {
        /*
          Cacheable at the EDGE but not in the browser.

          max-age was 60 and that was wrong: the browser then holds whatever it
          first saw for a minute, so a visitor whose first page load happened
          before the shop's first sale keeps being handed the empty feed even
          after one lands. It also silently defeated a test of this endpoint.

          s-maxage keeps the scale benefit — every visitor sees the same feed,
          so the edge can serve one copy — while max-age=0 makes each page load
          revalidate, which is a conditional request, not a full read.
        */
        'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
      },
    }
  );
}
