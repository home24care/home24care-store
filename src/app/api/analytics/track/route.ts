import { NextResponse } from 'next/server';
import { normalizeEvent, recordEvent, isBot } from '@/lib/analytics/ingest';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Analytics collection endpoint.
 *
 * Country comes from the CDN's own edge header rather than a geo-IP lookup, so
 * no address ever reaches this code or the store. Bot traffic is dropped here
 * rather than filtered in the dashboard, so the stored numbers are the honest
 * ones.
 *
 * Always answers 204, even on a rejected payload: a tracking beacon should
 * never surface an error to a shopper, and a 4xx tells a probe what shape the
 * endpoint wants.
 */
export async function POST(request: Request) {
  const noContent = new NextResponse(null, { status: 204 });

  try {
    const userAgent = request.headers.get('user-agent');
    if (isBot(userAgent)) return noContent;

    const country =
      request.headers.get('x-vercel-ip-country') ??
      request.headers.get('cf-ipcountry') ??
      null;

    const body = await request.json();
    const events = Array.isArray(body?.events) ? body.events.slice(0, 20) : [body];

    const selfHost = (() => {
      try {
        return new URL(site.url).hostname;
      } catch {
        return site.domain;
      }
    })();

    await Promise.all(
      events
        .map((e: unknown) =>
          normalizeEvent(e as never, { country, userAgent, selfHost })
        )
        .filter(Boolean)
        .map((e: never) => recordEvent(e))
    );
  } catch {
    // Swallow: analytics must never be able to break a page for a shopper.
  }

  return noContent;
}
