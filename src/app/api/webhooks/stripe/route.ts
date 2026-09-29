import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, stripeConfigured, webhookSecretConfigured } from '@/lib/stripe';
import { recordOrder, markOrderPaid, markOrderFailed, markOrderRefunded } from '@/lib/orders';
import { recordPaidIntent, recordPaidSession, isOurs } from '@/lib/record-payment';

export const runtime = 'nodejs';
// The signature is computed over the exact bytes Stripe sent, so this route
// must never be cached or transformed.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeConfigured() || !webhookSecretConfigured() || !secret) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  // Read the raw body — parsing it first would break signature verification.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[stripe-webhook] signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      /*
        A sale arrives here two ways, and each is counted once between the
        events below and the thank-you page (see record-payment.ts):
        - /checkout runs on a Checkout Session, which fires both
          checkout.session.completed and payment_intent.succeeded;
        - the product-page wallet buttons confirm a bare PaymentIntent, which
          fires payment_intent.succeeded alone.
        The Stripe account is shared with another storefront, so anything
        without this shop's `store` metadata is acknowledged and left alone.
      */
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        if (!isOurs(intent.metadata)) break;
        await recordPaidIntent(intent, 'webhook');
        await markOrderPaid(intent.id, event.id);
        break;
      }

      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!isOurs(session.metadata)) break;
        // A delayed payment method completes the session unpaid; it is counted
        // when async_payment_succeeded sees it paid.
        if (session.payment_status === 'paid') {
          await recordPaidSession(session, 'webhook');
          await markOrderPaid(session.id, event.id);
        } else {
          await recordOrder(session);
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!isOurs(session.metadata)) break;
        await markOrderFailed(session.id, event.id);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!isOurs(session.metadata)) break;
        await markOrderFailed(session.id, event.id, 'expired');
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await markOrderRefunded(charge.payment_intent as string, event.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.warn(
          '[stripe-webhook] payment failed for intent %s: %s',
          intent.id,
          intent.last_payment_error?.message ?? 'no reason given'
        );
        break;
      }

      default:
        // Unhandled types are acknowledged so Stripe stops retrying them.
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[stripe-webhook] handler failed for %s: %s', event.type, message);
    // A non-2xx tells Stripe to retry with backoff, which is what we want for
    // transient failures in our own fulfilment code.
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
