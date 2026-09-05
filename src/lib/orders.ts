/**
 * Order persistence seam.
 *
 * The storefront intentionally ships without a database. Every function here
 * is idempotent by contract — Stripe delivers webhooks at least once, so the
 * same event id can arrive more than once and must not double-apply.
 *
 * Swap the bodies for real writes (Postgres, Supabase, an ERP call) when you
 * wire up fulfilment; the webhook route needs no changes.
 */
import type Stripe from 'stripe';

/** Event ids already applied, so retries are no-ops within a process. */
const processedEvents = new Set<string>();

const seen = (eventId: string) => {
  if (processedEvents.has(eventId)) return true;
  processedEvents.add(eventId);
  return false;
};

export type OrderRecord = {
  sessionId: string;
  paymentIntentId: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  amountTotal: number | null;
  currency: string | null;
  skus: string;
  shipping: Stripe.Checkout.Session.CollectedInformation.ShippingDetails | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
};

export async function recordOrder(session: Stripe.Checkout.Session) {
  const record: OrderRecord = {
    sessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    email: session.customer_details?.email ?? null,
    name: session.customer_details?.name ?? null,
    phone: session.customer_details?.phone ?? null,
    amountTotal: session.amount_total,
    currency: session.currency,
    skus: session.metadata?.skus ?? '',
    // Moved under collected_information in recent Stripe API versions.
    shipping: session.collected_information?.shipping_details ?? null,
    status: session.payment_status === 'paid' ? 'paid' : 'pending',
  };

  console.info('[orders] recorded %s (%s)', record.sessionId, record.status);
  // TODO: persist `record`, then send the order confirmation email.
  return record;
}

export async function markOrderPaid(sessionId: string, eventId: string) {
  if (seen(eventId)) return;
  console.info('[orders] paid %s', sessionId);
  // TODO: set status = 'paid', decrement stock, trigger fulfilment.
}

export async function markOrderFailed(
  sessionId: string,
  eventId: string,
  reason = 'payment_failed'
) {
  if (seen(eventId)) return;
  console.warn('[orders] failed %s (%s)', sessionId, reason);
  // TODO: set status = 'failed', release any reserved stock.
}

export async function markOrderRefunded(paymentIntentId: string, eventId: string) {
  if (seen(eventId)) return;
  console.info('[orders] refunded %s', paymentIntentId);
  // TODO: set status = 'refunded', notify the customer.
}
