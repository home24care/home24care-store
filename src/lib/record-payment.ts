import type Stripe from 'stripe';
import { store } from '@/lib/analytics/store';
import { recordPurchase } from '@/lib/analytics/ingest';
import { isExcludedCountry } from '@/lib/analytics/types';
import { recordOrderFromIntent } from '@/lib/orders';

/** Long enough to outlive every Stripe retry and any reload of an old thank-you page. */
const CLAIM_TTL = 60 * 60 * 24 * 400;

/**
 * Record a paid order — the one way a sale reaches the dashboard.
 *
 * Two callers, and either may be the only one that runs:
 *   - the Stripe webhook (payment_intent.succeeded): reliable, but only once the
 *     endpoint and its signing secret are set up, and Stripe can be minutes late;
 *   - the thank-you page (/checkout/success): the shopper lands there the moment
 *     they pay, with the PaymentIntent id in the URL.
 *
 * The intent passed in is always one fetched from Stripe with the secret key
 * (or delivered in a signed webhook), never anything the browser sent — the id
 * in the URL is only a lookup key. Only a succeeded intent counts.
 *
 * Safe to call any number of times, in any order: the claim lets each payment
 * be counted once, by whichever caller sees it first, so a webhook retry or a
 * reloaded thank-you page never adds a second order.
 *
 * Returns true when this call is the one that counted the order.
 */
export async function recordPaidIntent(
  intent: Stripe.PaymentIntent,
  via: 'webhook' | 'thank-you'
): Promise<boolean> {
  if (intent.status !== 'succeeded') return false;

  const claimed = await store()
    .claim(`o:claimed:${intent.id}`, CLAIM_TTL)
    .catch((err) => {
      // Storage down: better to risk a double count than to lose the sale.
      console.error('[orders] claim failed, recording anyway:', err instanceof Error ? err.message : err);
      return true;
    });
  if (!claimed) return false;

  // The country Stripe verified on the shipping address — not an edge header,
  // which on a webhook would be Stripe's own datacentre.
  const country = intent.shipping?.address?.country ?? null;
  console.info('[orders] %s counted via %s', intent.id, via);

  // The owner's own test orders (excluded countries) stay out of the numbers
  // and out of the public "recent sales" notifications.
  if (!isExcludedCountry(country)) await recordOrderFromIntent(intent).catch(() => {});
  await recordPurchase({ value: intent.amount_received || intent.amount, country }).catch(() => {});
  return true;
}

/**
 * The same once-only guard for the older Checkout Session flow, so a retried
 * checkout.session.* webhook cannot count its sale twice either.
 */
export async function claimOrder(id: string): Promise<boolean> {
  return store()
    .claim(`o:claimed:${id}`, CLAIM_TTL)
    .catch(() => true);
}
