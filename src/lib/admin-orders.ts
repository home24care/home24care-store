import type Stripe from 'stripe';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { isExcludedCountry } from '@/lib/analytics/types';
import { isOurs } from '@/lib/record-payment';

export type AdminOrder = {
  id: string;
  createdAt: number;
  email: string | null;
  name: string | null;
  shipTo: string | null;
  country: string | null;
  amount: number;
  refunded: number;
  status: 'Paid' | 'Partially refunded' | 'Refunded' | 'Disputed';
  skus: string | null;
  /** Shipped to an excluded country (the owner's own test order). */
  excluded: boolean;
};

/**
 * The most recent paid orders, read straight from Stripe.
 *
 * Stripe is the record of money actually taken, so the panel lists what really
 * happened rather than what a browser beacon reported. Read-only: nothing here
 * writes to Stripe. Returns null when Stripe is not configured or unreachable,
 * so the dashboard can say so instead of showing an empty table.
 */
export async function listRecentOrders(limit = 25): Promise<AdminOrder[] | null> {
  if (!stripeConfigured()) return null;
  try {
    const page = await stripe().paymentIntents.list({ limit: 100, expand: ['data.latest_charge'] });
    return page.data
      // The Stripe account is shared with another storefront; only this
      // shop's payments carry its `store` metadata.
      .filter((pi) => pi.status === 'succeeded' && isOurs(pi.metadata))
      .slice(0, limit)
      .map((pi) => {
        const charge = typeof pi.latest_charge === 'object' ? (pi.latest_charge as Stripe.Charge | null) : null;
        const address = pi.shipping?.address ?? charge?.billing_details?.address ?? null;
        const refunded = charge?.amount_refunded ?? 0;
        const status: AdminOrder['status'] = charge?.disputed
          ? 'Disputed'
          : refunded >= pi.amount_received && refunded > 0
            ? 'Refunded'
            : refunded > 0
              ? 'Partially refunded'
              : 'Paid';
        return {
          id: pi.id,
          createdAt: pi.created * 1000,
          email: pi.receipt_email ?? charge?.billing_details?.email ?? null,
          name: pi.shipping?.name ?? charge?.billing_details?.name ?? null,
          shipTo: address ? [address.city, address.state].filter(Boolean).join(', ') || null : null,
          country: address?.country ?? null,
          amount: pi.amount_received,
          refunded,
          status,
          skus: pi.metadata?.skus ?? null,
          excluded: isExcludedCountry(address?.country ?? null),
        };
      });
  } catch (err) {
    console.error('[admin] listing orders from Stripe failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Which kind of Stripe key the server holds, for the health panel. */
export function stripeMode(): { ok: boolean; detail: string } {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  if (!key) return { ok: false, detail: 'STRIPE_SECRET_KEY is not set — checkout cannot take payments.' };
  const mode = /_live_/.test(key) ? 'live' : /_test_/.test(key) ? 'test' : 'unknown';
  const pkMode = /_live_/.test(pk) ? 'live' : /_test_/.test(pk) ? 'test' : pk ? 'unknown' : 'missing';
  if (pkMode !== mode) return { ok: false, detail: `Secret key is ${mode}, publishable key is ${pkMode} — they must match.` };
  return { ok: mode === 'live', detail: mode === 'live' ? 'live mode' : `${mode} mode — no real payments are taken` };
}
