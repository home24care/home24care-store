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
import { firstNameOf, recordSale } from '@/lib/sales-proof/store';
import { getProductBySku } from '@/lib/catalog';

/**
 * Warm-instance duplicate suppression — NOT real idempotency.
 *
 * Read this before you wire up a database.
 *
 * Stripe delivers webhooks at least once, so the same `event.id` can arrive
 * more than twice. On a long-lived server this Set would cover that. On
 * Vercel it mostly does not: each function invocation may be a fresh process,
 * so a retry usually lands somewhere the Set is empty and the handler runs
 * again. It also does not survive a deploy, and it grows without bound on an
 * instance that stays warm.
 *
 * It is kept only because it costs nothing and does help when a retry happens
 * to hit a warm instance. Treat every handler below as "may run more than
 * once per event" and make the real work idempotent at the data layer:
 * insert `event.id` as a PRIMARY KEY in the same transaction as the order
 * write, and let the unique-violation tell you it is a duplicate.
 */
const processedEvents = new Set<string>();
const MAX_TRACKED_EVENTS = 5_000;

const seen = (eventId: string) => {
  if (processedEvents.has(eventId)) return true;
  // Bound the set so a warm instance cannot leak memory indefinitely.
  if (processedEvents.size >= MAX_TRACKED_EVENTS) {
    processedEvents.delete(processedEvents.values().next().value as string);
  }
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
  /*
    Narrowed to what we actually read. A Checkout Session and a PaymentIntent
    describe shipping with different Stripe types, and orders now arrive as
    both, so the record keeps the shape it uses rather than either SDK type.
  */
  shipping: { address?: { state?: string | null } | null; name?: string | null } | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
};

/**
 * Order from a PaymentIntent.
 *
 * The integrated checkout confirms a PaymentIntent directly -- there is no
 * Checkout Session -- so `payment_intent.succeeded` is the event that means a
 * sale. The SKUs ride in metadata, set when the intent was created from the
 * server-side catalogue, because a PaymentIntent has no line items of its own.
 */
export async function recordOrderFromIntent(intent: Stripe.PaymentIntent) {
  const record: OrderRecord = {
    sessionId: intent.id,
    paymentIntentId: intent.id,
    email: intent.receipt_email ?? intent.metadata?.email ?? null,
    name: intent.shipping?.name ?? null,
    phone: intent.shipping?.phone ?? null,
    amountTotal: intent.amount_received || intent.amount,
    currency: intent.currency,
    skus: intent.metadata?.skus ?? '',
    shipping: intent.shipping
      ? { address: { state: intent.shipping.address?.state ?? null }, name: intent.shipping.name }
      : null,
    status: intent.status === 'succeeded' ? 'paid' : 'pending',
  };
  return persistOrder(record);
}

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

  return persistOrder(record);
}

async function persistOrder(record: OrderRecord) {
  console.info('[orders] recorded %s (%s)', record.sessionId, record.status);

  /*
    Feed the storefront's sales notifications, but only from a genuinely paid
    order. A notification for a pending or failed payment would be claiming a
    sale that has not happened.

    Only the first name, the region and the product title are passed on. The
    record above also holds an email, a phone number and a full shipping
    address, and none of that belongs behind a public endpoint.
  */
  if (record.status === 'paid') {
    const firstSku = record.skus.split(',')[0]?.split('x')[0]?.trim();
    const product = firstSku ? getProductBySku(firstSku) : undefined;
    if (product) {
      await recordSale({
        firstName: firstNameOf(record.name),
        region: record.shipping?.address?.state ?? null,
        product: product.title,
        ts: Date.now(),
      }).catch(() => {});
    }
  }

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
