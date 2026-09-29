'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/client';

/**
 * Fires a page_view on first load and on every client-side navigation, and a
 * once-a-minute heartbeat for the admin's live-visitors panel.
 *
 * Mounted once in the root layout. Product views are fired separately from the
 * product page itself, because only that page knows which slug it is showing.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // App Router re-runs this on query-string changes too; only count real
    // path changes so sorting a collection is not a new page view.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track('page_view');
  }, [pathname]);

  // Keeps an open tab in the admin's live-visitors window. Skipped while the
  // tab is hidden, so a forgotten background tab does not count as "live".
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === 'visible') track('heartbeat');
    };
    const id = window.setInterval(beat, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
