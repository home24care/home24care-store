import { NextResponse } from 'next/server';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { getProduct } from '@/lib/catalog';
import { site } from '@/lib/site';
import { absoluteImage, feedImage } from '@/lib/image';

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

  // Never trust prices from the client. Re-resolve every line against the
  // server-side catalog and build the Stripe line items from that.
  const lineItems = [];
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
      return NextResponse.json(
        { error: `${product.title} is out of stock.` },
        { status: 409 }
      );
    }

    const quantity = Math.min(
      Math.max(Math.floor(Number(raw.quantity) || 1), 1),
      MAX_QUANTITY
    );

    lineItems.push({
      quantity,
      price_data: {
        currency: product.currency.toLowerCase(),
        unit_amount: product.price,
        product_data: {
          name: product.title,
          description: product.excerpt.slice(0, 300) || product.productType,
          // Localized catalog paths are root-relative; Stripe needs
          // absolute URLs or it silently drops the images. JPEG rather than
          // the WebP the storefront renders, for the same reason the feed
          // uses it: the consumer here is someone else's image pipeline, not
          // a browser we control.
          images: product.images
            .slice(0, 4)
            .map((i) =>
              absoluteImage(feedImage(i.full), process.env.NEXT_PUBLIC_SITE_URL || site.url)
            ),
          metadata: { sku: product.sku, slug: product.slug },
        },
      },
    });
    metaSkus.push(`${product.sku}x${quantity}`);
  }

  // Never build the post-payment redirect from a raw Origin header — an
  // attacker who can set it could point success_url at a site of their
  // choosing. Accept the header only when it matches somewhere we own.
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || site.url).replace(/\/+$/, '');
  const allowed = new Set(
    [configured, site.url, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`]
      .filter(Boolean)
      .map((u) => (u as string).replace(/\/+$/, ''))
  );
  const requested = request.headers.get('origin')?.replace(/\/+$/, '');
  const origin = requested && allowed.has(requested) ? requested : configured;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      // Merchant Center requires the shipping cost shown on-site to match
      // checkout. Free standard shipping is stated in the shipping policy.
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free standard shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      billing_address_collection: 'required',
      automatic_tax: { enabled: false },
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?canceled=1`,
      metadata: {
        store: site.name,
        skus: metaSkus.join(',').slice(0, 500),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to start checkout.';
    console.error('[checkout] Stripe session creation failed:', message);
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again.' },
      { status: 502 }
    );
  }
}
