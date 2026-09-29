import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { readLive } from '@/lib/analytics/live';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Visitors active in the last five minutes, for the dashboard's live panel.
 *
 * Checks the signed session itself: the middleware only guards /admin pages,
 * not /api/admin. Excluded countries are never stored (see touchLive), so
 * nothing needs filtering here.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }
  try {
    const visitors = await readLive();
    return NextResponse.json(
      { ok: true, at: Date.now(), visitors: visitors.slice(0, 50), count: visitors.length },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch (err) {
    console.error('[admin/live] failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not read live visitors.' }, { status: 500 });
  }
}
