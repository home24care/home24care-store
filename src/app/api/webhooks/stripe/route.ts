import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, stripeConfigured, webhookSecretConfigured } from '@/lib/stripe';
import { recordOrder, markOrderPaid, markOrderFailed, markOrderRefunded } from '@/lib/orders';

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Card payments can complete asynchronously; only treat the order as
        // paid once payment_status says so.
        await recordOrder(session);
        if (session.payment_status === 'paid') {
          await markOrderPaid(session.id, event.id);
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await markOrderPaid(session.id, event.id);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await markOrderFailed(session.id, event.id);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
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
