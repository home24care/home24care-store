'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { SIZES, IMAGES_LOCALIZED } from '@/lib/image';
import { site, paymentMethods } from '@/lib/site';
import { track } from '@/lib/analytics/client';
import { LockIcon, TruckIcon, ReturnIcon, ShieldIcon, ChevronIcon } from './icons';

/**
 * Checkout, with Stripe's payment form embedded in our own page.
 *
 * loadStripe is called once at module scope, not per render: it injects
 * Stripe.js into the document, and calling it inside the component would
 * re-request the script on every re-render.
 *
 * The publishable key is meant to be public — it can only create payment
 * attempts against this account, never read from it. The secret key never
 * leaves the server.
 */
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutClient() {
  const { lines, subtotal, hydrated } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  /*
    The cart is read from localStorage on mount, so `lines` is empty on the
    first render even when the cart is full. Creating the session before
    hydration finishes would ask Stripe for an empty order.
  */
  const cartKey = useMemo(
    () => lines.map((l) => `${l.slug}:${l.quantity}`).join('|'),
    [lines]
  );

  const createSession = useCallback(async () => {
    if (!hydrated || lines.length === 0) return;
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'We could not start checkout. Please try again.');
        return;
      }
      setClientSecret(data.clientSecret);
      track('checkout_started', { value: subtotal, quantity: lines.length });
    } catch {
      setError('We could not reach the payment service. Please try again.');
    }
  }, [hydrated, lines, subtotal]);

  useEffect(() => {
    // Only ever create one session per cart state.
    if (clientSecret) return;
    void createSession();
    // cartKey, not `lines`: a new array identity each render would loop.
  }, [cartKey, clientSecret, createSession]);

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-[28px] tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Add something to it and checkout will be waiting here.
        </p>
        <Link href="/collections" className="btn-accent mt-8 inline-flex px-7 py-3.5 text-[15px]">
          Browse the range
        </Link>
      </div>
    );
  }

  const summary = (
    <>
      <ul className="divide-y divide-ink/10">
        {lines.map((line) => (
          <li key={line.slug} className="flex gap-4 py-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-white">
              {line.image ? (
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes={SIZES.card}
                  unoptimized={IMAGES_LOCALIZED}
                  quality={75}
                  className="object-cover"
                />
              ) : null}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white">
                {line.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium leading-snug text-ink line-clamp-2">
                {line.title}
              </span>
            </span>
            <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
              {formatPrice(line.price * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2.5 border-t border-ink/10 pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Shipping</dt>
          <dd className="font-semibold text-moss-700">Free</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
          <dt className="text-[15px] font-semibold text-ink">Total</dt>
          <dd className="text-[20px] font-bold tabular-nums text-ink">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <div className="min-h-screen bg-sand">
      {/* A deliberately stripped header: no nav, no search, no cart icon.
          Every exit from a checkout is a lost order, so the only links out are
          back to the cart and the logo. */}
      <header className="border-b border-ink/10 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="font-display text-[19px] tracking-tight text-ink">
            {site.name}
          </Link>
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
            <LockIcon className="h-4 w-4 text-moss-700" />
            Secure checkout
          </span>
        </div>
      </header>

      {/* Mobile: the summary collapses, because a phone should open on the
          payment form rather than a list the shopper has already seen. */}
      <div className="border-b border-ink/10 bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          className="container-page flex w-full items-center justify-between py-3.5 text-[14px]"
        >
          <span className="flex items-center gap-1.5 font-medium text-moss-700">
            {summaryOpen ? 'Hide' : 'Show'} order summary
            <ChevronIcon
              className={`h-4 w-4 transition-transform ${summaryOpen ? '-rotate-90' : 'rotate-90'}`}
            />
          </span>
          <span className="font-bold tabular-nums text-ink">{formatPrice(subtotal)}</span>
        </button>
        {summaryOpen ? <div className="container-page pb-5">{summary}</div> : null}
      </div>

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1fr_400px] lg:gap-14 lg:py-12">
        <main className="min-w-0 order-2 lg:order-1">
          {!publishableKey ? (
            <p className="rounded-2xl border border-clay-300 bg-clay-50 p-5 text-[14.5px] text-ink">
              Card payments are not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </p>
          ) : error ? (
            <div className="rounded-2xl border border-clay-300 bg-clay-50 p-5">
              <p className="text-[14.5px] text-ink">{error}</p>
              <button
                type="button"
                onClick={() => void createSession()}
                className="mt-4 rounded-full bg-moss-800 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-moss-900"
              >
                Try again
              </button>
            </div>
          ) : clientSecret ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout className="min-h-[520px]" />
            </EmbeddedCheckoutProvider>
          ) : (
            /* A skeleton rather than a spinner: it holds the height the form
               will take, so the page does not jump when Stripe mounts. */
            <div className="min-h-[520px] animate-pulse space-y-4" aria-label="Loading payment form">
              <div className="h-11 rounded-xl bg-ink/5" />
              <div className="h-11 rounded-xl bg-ink/5" />
              <div className="h-11 w-2/3 rounded-xl bg-ink/5" />
              <div className="h-32 rounded-xl bg-ink/5" />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-6">
            {paymentMethods.map((mark) => (
              <span key={mark.name} className="relative h-6 w-10">
                <Image
                  src={mark.mark}
                  alt={mark.name}
                  fill
                  sizes="40px"
                  className="object-contain"
                  style={{ transform: `scale(${mark.scale})` }}
                />
              </span>
            ))}
          </div>
        </main>

        <aside className="order-1 min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-8">
            <div className="hidden rounded-2xl border border-ink/10 bg-white p-6 lg:block">
              <h2 className="text-[15px] font-semibold text-ink">
                Order summary
                <span className="ml-2 font-normal text-ink-muted">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              </h2>
              <div className="mt-4">{summary}</div>
            </div>

            {/* The reassurances that matter at the moment of payment. Every
                figure comes from site.ts, so they cannot drift away from the
                policy pages that have to honour them. */}
            <ul className="mt-5 space-y-3 rounded-2xl border border-ink/10 bg-white p-5 text-[13.5px] text-ink-soft">
              <li className="flex gap-3">
                <TruckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-700" />
                <span>
                  <strong className="font-semibold text-ink">Free standard shipping</strong> — ships
                  in {site.shipping.handlingTime}.
                </span>
              </li>
              <li className="flex gap-3">
                <ReturnIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-700" />
                <span>
                  <strong className="font-semibold text-ink">
                    {site.returns.windowDays}-day returns
                  </strong>{' '}
                  {site.returns.restockingFee ? '' : '— no restocking fee'}.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-700" />
                <span>
                  <strong className="font-semibold text-ink">{site.warranty.label}</strong> on
                  everything we sell.
                </span>
              </li>
              <li className="flex gap-3">
                <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-700" />
                <span>
                  Card details go straight to Stripe over an encrypted connection. We never see or
                  store them.
                </span>
              </li>
            </ul>

            <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-ink-muted">
              Questions before you pay?{' '}
              <a href={`tel:${site.contact.phoneHref}`} className="font-medium text-moss-700 hover:underline">
                {site.contact.phone}
              </a>{' '}
              · {site.contact.hours}
            </p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-ink/10 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-[12.5px] text-ink-muted">
          <Link href="/cart" className="font-medium text-moss-700 hover:underline">
            ← Return to cart
          </Link>
          <span className="flex gap-4">
            <Link href="/policies/returns" className="hover:text-ink">Returns</Link>
            <Link href="/policies/shipping" className="hover:text-ink">Shipping</Link>
            <Link href="/policies/privacy" className="hover:text-ink">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
