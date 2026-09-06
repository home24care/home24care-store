'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/client';

/** Records that a specific product page was viewed. */
export default function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track('product_view', { slug });
  }, [slug]);

  return null;
}
