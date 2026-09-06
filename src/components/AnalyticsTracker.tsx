'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/client';

/**
 * Fires a page_view on first load and on every client-side navigation.
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

  return null;
}
