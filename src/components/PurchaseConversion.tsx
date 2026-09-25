'use client';

import { useEffect } from 'react';
import { ADS_CONVERSIONS, adsConversion, ga4Event } from '@/lib/gtag';

type Item = { name: string; quantity: number; amount: number };

/**
 * Reports the Google Ads purchase conversion, and the matching GA4 purchase
 * event, from the order confirmation page.
 *
 * Everything here comes from the Stripe session the page already retrieved
 * server-side, so the figures are the ones actually charged rather than
 * anything the browser could have tampered with.
 *
 * Reported once per order. Two things enforce that:
 *
 *  - `transaction_id` is the Stripe session id. Google's generated snippet
 *    leaves it empty, which is the single most costly thing to ship as-is: it
 *    is what Ads and GA4 deduplicate on, so without it every reload,
 *    back-navigation and bookmarked visit to this page books another sale.
 *  - a localStorage mark, so a reload does not even send the duplicate. Google
 *    would discard it, but a conversion that never leaves the browser cannot
 *    be miscounted by anything downstream either.
 */
export default function PurchaseConversion({
  transactionId,
  value,
  currency,
  items,
}: {
  transactionId: string;
  value: number;
  currency: string;
  items: Item[];
}) {
  useEffect(() => {
    if (!transactionId || !(value >= 0)) return;

    const key = `tuf_purchase_reported:${transactionId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // Private browsing can throw on access. Reporting the conversion matters
      // more than the duplicate guard, and transaction_id still dedupes it.
    }

    adsConversion(ADS_CONVERSIONS.purchase, value, currency, transactionId);

    ga4Event('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items: items.map((item, i) => ({
        item_id: `line-${i + 1}`,
        item_name: item.name,
        price: item.amount / 100 / Math.max(1, item.quantity),
        quantity: item.quantity,
      })),
    });

    try {
      localStorage.setItem(key, '1');
    } catch {
      /* nothing to do; see above */
    }
  }, [transactionId, value, currency, items]);

  return null;
}
