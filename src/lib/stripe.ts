import Stripe from 'stripe';

let client: Stripe | null = null;

/**
 * Lazily construct the Stripe client so that builds and non-commerce routes
 * do not fail when the secret key is absent (e.g. preview deploys).
 */
export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and add your key.'
    );
  }

  client = new Stripe(key, {
    // Pinning the version keeps webhook payload shapes stable across deploys.
    apiVersion: '2025-08-27.basil',
    // Must fail inside the function budget (10s on Hobby) so our 502 handler
    // runs instead of the platform killing the invocation at the limit.
    timeout: 8000,
    maxNetworkRetries: 1,
    typescript: true,
    appInfo: { name: 'TOPPSUEFA Storefront', version: '1.0.0' },
  });
  return client;
}

/**
 * The API version Checkout Sessions are created with — newer than the
 * client's pinned basil version, on purpose.
 *
 * The checkout page mounts those sessions with Stripe.js "dahlia"
 * (@stripe/stripe-js 9), and Stripe requires the session to be created on an
 * API version at least as new as the Stripe.js release reading it. Dahlia also
 * renamed ui_mode "custom" to "elements" (and hosted to hosted_page), so the
 * route sends the dahlia names under this version only. Everything else —
 * PaymentIntents, the webhook, the thank-you page's retrieve — stays on the
 * pinned version: Stripe renders an object in whichever version reads it.
 */
export const CHECKOUT_SESSION_API_VERSION = '2026-08-26.dahlia';

/**
 * A key is "configured" only if it looks like a real one.
 *
 * Presence alone is not enough: Vercel auto-detects `.env.example` on import
 * and will happily save `sk_test_replace_me` as a Production variable. That is
 * truthy, so a presence check lets the placeholder through and the shopper
 * gets an opaque 502 from Stripe instead of the honest "payments are not
 * configured yet" 503.
 */
export const isPlaceholder = (value?: string) =>
  !value || /replace_me|your_key_here|xxx/i.test(value);

export const stripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key) && !isPlaceholder(key) && /^sk_(test|live)_/.test(key!);
};

export const webhookSecretConfigured = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  return Boolean(secret) && !isPlaceholder(secret) && secret!.startsWith('whsec_');
};
