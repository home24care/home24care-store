import type Stripe from 'stripe';
import { store } from '@/lib/analytics/store';
import { recordPurchase } from '@/lib/analytics/ingest';
import { isExcludedCountry } from '@/lib/analytics/types';
import { recordOrder, recordOrderFromIntent } from '@/lib/orders';
import { site } from '@/lib/site';

/** Long enough to outlive every Stripe retry and any reload of an old thank-you page. */
const CLAIM_TTL = 60 * 60 * 24 * 400;

/**
 * True for a payment this shop created. The Stripe account is shared with
 * another storefront, whose payments reach the same webhook; /api/checkout
 * stamps `store` on every PaymentIntent and Checkout Session it creates.
 */
export const isOurs = (metadata: Stripe.Metadata | null | undefined): boolean =>
  metadata?.store === site.name;

/**
 * Count a payment once, whichever caller sees it first. The key is the
 * PaymentIntent id: a Checkout Session's payment fires payment_intent.succeeded
 * as well as checkout.session.completed, and the thank-you page sees it too.
 */
function claim(id: string): Promise<boolean> {
  return store()
    .claim(`o:claimed:${id}`, CLAIM_TTL)
    .catch((err) => {
      // Storage down: better to risk a double count than to lose the sale.
      console.error('[orders] claim failed, recording anyway:', err instanceof Error ? err.message : err);
      return true;
    });
}

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
  if (intent.status !== 'succeeded' || !isOurs(intent.metadata)) return false;
  if (!(await claim(intent.id))) return false;

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
 * The same for a Checkout Session — /checkout's form, or the hosted page it
 * falls back to. Claimed under the session's PaymentIntent, so however many of
 * the webhook's events and the thank-you page see this payment, it counts once.
 */
export async function recordPaidSession(
  session: Stripe.Checkout.Session,
  via: 'webhook' | 'thank-you'
): Promise<boolean> {
  if (session.payment_status !== 'paid' || !isOurs(session.metadata)) return false;
  const intentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!(await claim(intentId ?? session.id))) return false;

  const country =
    session.collected_information?.shipping_details?.address?.country ??
    session.customer_details?.address?.country ??
    null;
  console.info('[orders] %s counted via %s', session.id, via);

  if (!isExcludedCountry(country)) await recordOrder(session).catch(() => {});
  await recordPurchase({ value: session.amount_total ?? 0, country }).catch(() => {});
  return true;
}
