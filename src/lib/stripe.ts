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
    typescript: true,
    appInfo: { name: 'Home24Care Storefront', version: '1.0.0' },
  });
  return client;
}

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
