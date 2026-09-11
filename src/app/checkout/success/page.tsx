import type { Metadata } from 'next';
import Link from 'next/link';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { CheckIcon, TruckIcon, MailIcon, PhoneIcon } from '@/components/icons';
import PurchaseConversion from '@/components/PurchaseConversion';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Thank you for your order.',
  robots: { index: false, follow: false },
};

// The session id is unique per order, so this page can never be cached.
export const dynamic = 'force-dynamic';

type Summary = {
  email: string | null;
  total: number | null;
  reference: string;
  // The full session id, for the conversion's transaction_id. Distinct from
  // `reference`, which is the short form shown to the customer.
  sessionId: string;
  currency: string;
  items: { name: string; quantity: number; amount: number }[];
};

async function loadSummary(sessionId?: string): Promise<Summary | null> {
  if (!sessionId || !stripeConfigured()) return null;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    return {
      email: session.customer_details?.email ?? null,
      total: session.amount_total,
      // Show a short human reference rather than the full session id.
      reference: session.id.slice(-12).toUpperCase(),
      sessionId: session.id,
      currency: (session.currency ?? 'usd').toUpperCase(),
      items: (session.line_items?.data ?? []).map((li) => ({
        name: li.description ?? 'Item',
        quantity: li.quantity ?? 1,
        amount: li.amount_total ?? 0,
      })),
    };
  } catch {
    // A stale or tampered session id should not break the thank-you page.
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const summary = await loadSummary(session_id);

  return (
    <div className="container-page py-16">
      {/*
        Reported from the Stripe session rather than from the cart, so the
        figure is the one actually charged — after any tax or shipping Stripe
        applied, and immune to a browser that tampered with the cart. No
        session means no confirmed order, so nothing is reported.
      */}
      {summary && summary.total !== null && (
        <PurchaseConversion
          transactionId={summary.sessionId}
          value={summary.total / 100}
          currency={summary.currency}
          items={summary.items}
        />
      )}
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss-100 text-moss-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-[34px] leading-tight tracking-tight sm:text-[42px]">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
          {summary?.email ? (
            <>
              A confirmation is on its way to{' '}
              <strong className="font-semibold text-ink">{summary.email}</strong>.
            </>
          ) : (
            'A confirmation email is on its way to the address you entered at checkout.'
          )}{' '}
          You will receive a second email with tracking as soon as your order ships.
        </p>

        {summary && (
          <div className="mt-8 rounded-2xl border border-ink/10 bg-sand p-6 text-left">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/10 pb-3">
              <h2 className="font-display text-[20px] tracking-tight">Order summary</h2>
              <p className="text-[13px] text-ink-muted">
                Reference <span className="font-semibold text-ink">{summary.reference}</span>
              </p>
            </div>

            <ul className="divide-y divide-ink/10">
              {summary.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4 py-3 text-[14.5px]">
                  <span className="min-w-0">
                    {item.name}
                    <span className="text-ink-muted"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatPrice(item.amount)}
                  </span>
                </li>
              ))}
            </ul>

            {summary.total !== null && (
              <div className="flex justify-between border-t border-ink/15 pt-3 text-[17px]">
                <span className="font-semibold">Total paid</span>
                <span className="font-bold tabular-nums">{formatPrice(summary.total)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {[
            [TruckIcon, 'Ships fast', `Leaves our warehouse in ${site.shipping.handlingTime}.`],
            [MailIcon, 'Tracking email', 'Allow up to 48 hours for the carrier to update.'],
            [PhoneIcon, 'Need to change it?', `Call ${site.contact.phone} right away.`],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof TruckIcon;
            return (
              <div key={title as string} className="rounded-xl border border-ink/10 p-4">
                <I className="h-5 w-5 text-moss-600" />
                <p className="mt-2 text-[14px] font-semibold">{title as string}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{body as string}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/collections" className="btn-primary px-7 py-3.5">
            Continue shopping
          </Link>
          <Link href="/order-status" className="btn-outline px-7 py-3.5">
            Track your order
          </Link>
        </div>

        <p className="mt-8 text-[13.5px] text-ink-muted">
          Questions about this order? Email{' '}
          <a href={`mailto:${site.contact.email}`} className="font-semibold text-moss-700 underline underline-offset-2">
            {site.contact.email}
          </a>{' '}
          or call{' '}
          <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-700 underline underline-offset-2">
            {site.contact.phone}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
