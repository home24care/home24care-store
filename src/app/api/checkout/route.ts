import { NextResponse } from 'next/server';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { getProduct } from '@/lib/catalog';
import { site } from '@/lib/site';

export const runtime = 'nodejs';

type IncomingLine = { slug: unknown; quantity: unknown };

const MAX_LINES = 40;
const MAX_QUANTITY = 10;

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet. Set STRIPE_SECRET_KEY to enable checkout.' },
      { status: 503 }
    );
  }

  let body: { lines?: IncomingLine[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const incoming = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  /*
    Never trust prices from the client. Every line is re-resolved against the
    server-side catalogue and the total is computed here, so a tampered cart
    cannot change what is charged.
  */
  let amount = 0;
  const metaSkus: string[] = [];

  for (const raw of incoming) {
    if (typeof raw?.slug !== 'string') {
      return NextResponse.json({ error: 'Invalid cart line.' }, { status: 400 });
    }
    const product = getProduct(raw.slug);
    if (!product) {
      return NextResponse.json(
        { error: `We can no longer find "${raw.slug}". Please remove it and try again.` },
        { status: 400 }
      );
    }
    if (!product.available) {
      return NextResponse.json({ error: `${product.title} is out of stock.` }, { status: 409 });
    }

    const quantity = Math.min(
      Math.max(Math.floor(Number(raw.quantity) || 1), 1),
      product.purchaseLimit ?? MAX_QUANTITY
    );
    amount += product.price * quantity;
    metaSkus.push(`${product.sku}x${quantity}`);
  }

  if (amount < 50) {
    return NextResponse.json({ error: 'Order total is too small to process.' }, { status: 400 });
  }

  try {
    /*
      A PaymentIntent, not a Checkout Session. The integrated checkout renders
      Stripe's Payment Element inside our own form, alongside our own address
      fields, shipping selector and submit button -- and the Payment Element is
      driven by an intent. A Session would put all of that inside an iframe we
      cannot place our own fields around.

      automatic_payment_methods lets Stripe offer whatever the account has
      enabled and the buyer's country supports, instead of hardcoding a list
      that silently goes stale.
    */
    const intent = await stripe().paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      // Shipping is free on every order, so the charged amount is the cart
      // total; the selector on the page exists to state that, not to alter it.
      metadata: {
        store: site.name,
        skus: metaSkus.join(',').slice(0, 500),
      },
    });

    if (!intent.client_secret) {
      return NextResponse.json(
        { error: 'Stripe did not return a client secret.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amount,
      currency: 'usd',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start checkout.';
    console.error('[checkout] Stripe payment intent failed:', message);
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again.' },
      { status: 502 }
    );
  }
}
