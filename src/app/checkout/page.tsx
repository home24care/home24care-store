import type { Metadata } from 'next';
import CheckoutClient from '@/components/CheckoutClient';

/**
 * Checkout lives on our own domain with Stripe's form embedded in it, rather
 * than redirecting to a Stripe-hosted page. The cart is client state, so the
 * page itself is a thin shell around the client component.
 */
export const metadata: Metadata = {
  title: 'Secure checkout',
  // A checkout page has nothing to offer a search engine and should never be
  // indexed: it is per-shopper, empty to a crawler, and thin content.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
