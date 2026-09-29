import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, stripeConfigured, CHECKOUT_SESSION_API_VERSION } from '@/lib/stripe';
import { getProduct, type Product } from '@/lib/catalog';
import { feedImage } from '@/lib/image';
import { site } from '@/lib/site';

export const runtime = 'nodejs';

type IncomingLine = { slug: unknown; quantity: unknown };

/**
 * What the caller wants back:
 *   intent    (the default) a PaymentIntent client secret. Used by the
 *             product-page wallet buttons, and by /checkout as its fallback.
 *   elements  a Checkout Session for /checkout's own form: Stripe's address,
 *             payment and wallet Elements inside our page.
 *   hosted    a Checkout Session on checkout.stripe.com, for a browser where
 *             Stripe.js cannot load at all.
 */
type Mode = 'intent' | 'elements' | 'hosted';

const MAX_LINES = 40;
const MAX_QUANTITY = 10;

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet. Set STRIPE_SECRET_KEY to enable checkout.' },
      { status: 503 }
    );
  }

  let body: { lines?: IncomingLine[]; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const mode: Mode = body.mode === 'elements' || body.mode === 'hosted' ? body.mode : 'intent';

  const incoming = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  /*
    Never trust prices from the client. Every line is re-resolved against the
    server-side catalogue and the total is computed here, so a tampered cart
    cannot change what is charged.
  */
  const resolved: { product: Product; quantity: number }[] = [];
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
    resolved.push({ product, quantity });
    amount += product.price * quantity;
    metaSkus.push(`${product.sku}x${quantity}`);
  }

  if (amount < 50) {
    return NextResponse.json({ error: 'Order total is too small to process.' }, { status: 400 });
  }

  /*
    `store` marks every payment as this shop's. The Stripe account is shared
    with another storefront, so the webhook, the thank-you page and the admin
    panel all skip anything without it.
  */
  const metadata = { store: site.name, skus: metaSkus.join(',').slice(0, 500) };

  if (mode !== 'intent') {
    return createSession(request, mode, resolved, metadata);
  }

  try {
    /*
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
      metadata,
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

/**
 * A Checkout Session: what /checkout's form runs on ("elements"), or the
 * Stripe-hosted page it can fall back to ("hosted"). Both modes create the
 * same session; only where it is drawn and where it returns to differ.
 */
async function createSession(
  request: Request,
  mode: Exclude<Mode, 'intent'>,
  resolved: { product: Product; quantity: number }[],
  metadata: { store: string; skus: string }
) {
  const origin = new URL(request.url).origin;
  // {CHECKOUT_SESSION_ID} is filled in by Stripe; the thank-you page looks the
  // real order up by it, server-side.
  const success = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    ...(mode === 'hosted' ? { success_url: success, cancel_url: `${origin}/cart` } : { return_url: success }),
    line_items: resolved.map(({ product, quantity }) => {
      // Absolute, and the JPEG copy: Stripe drops a relative image URL without
      // a word, and several of its surfaces will not render WebP.
      const image = product.images[0]?.full ? feedImage(product.images[0].full) : null;
      return {
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: product.price,
          product_data: {
            name: product.title,
            ...(image ? { images: [/^https?:\/\//.test(image) ? image : `${site.url}${image}`] } : {}),
            metadata: { sku: product.sku },
          },
        },
      };
    }),
    /*
      Free shipping is stated as a zero-cost option rather than left out, so
      the wallets and the receipt say it too. 2–4 business days is handling
      plus transit, the same estimate the product-page wallets quote.
    */
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'usd' },
          display_name: 'Free shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 2 },
            maximum: { unit: 'business_day', value: 4 },
          },
        },
      },
    ],
    // The shipping policy covers the United States only.
    shipping_address_collection: { allowed_countries: ['US'] },
    billing_address_collection: 'auto',
    // The carrier's number for a signature delivery; the form asks for it.
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: false },
    metadata,
    // The PaymentIntent gets the same, so the admin panel's order list and
    // payment_intent.succeeded read the SKUs and the store from it too.
    payment_intent_data: { metadata },
  };

  /*
    Fields the pinned SDK types predate:
    - ui_mode under its dahlia name (see CHECKOUT_SESSION_API_VERSION).
    - Managed Payments off. This Stripe account has it on by default, which
      makes Stripe the merchant of record for digital goods and rejects every
      session without automatic tax. TOPPSUEFA sells physical boxes as its own
      merchant, so it is turned off per session.
  */
  const dahlia = {
    ui_mode: mode === 'hosted' ? 'hosted_page' : 'elements',
    managed_payments: { enabled: false },
  };

  try {
    const session = await stripe().checkout.sessions.create(
      { ...params, ...(dahlia as object) },
      { apiVersion: CHECKOUT_SESSION_API_VERSION }
    );

    if (mode === 'hosted') {
      if (!session.url) {
        return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
      }
      return NextResponse.json({ url: session.url, id: session.id });
    }
    if (!session.client_secret) {
      return NextResponse.json({ error: 'Stripe did not return a client secret.' }, { status: 502 });
    }
    return NextResponse.json({
      clientSecret: session.client_secret,
      id: session.id,
      // What the session charges, line by line, so the page can correct a
      // cart that still holds an older price or a quantity over the limit.
      lines: resolved.map(({ product, quantity }) => ({ slug: product.slug, price: product.price, quantity })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe error';
    console.error('[checkout] Stripe session (%s) failed: %s', mode, message);
    // `detail` carries Stripe's own reason; the page falls back to the
    // PaymentIntent form either way, so nothing here is shown as a dead end.
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again.', detail: message },
      { status: 502 }
    );
  }
}
