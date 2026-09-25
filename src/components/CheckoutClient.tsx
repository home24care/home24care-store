'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { SIZES, IMAGES_LOCALIZED } from '@/lib/image';
import { site, paymentMethods } from '@/lib/site';
import { track } from '@/lib/analytics/client';
import { LockIcon, TruckIcon, ReturnIcon, ShieldIcon, ChevronIcon } from './icons';
import Logo from './Logo';

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

/**
 * Stripe renders its Elements in an iframe, so site CSS cannot reach them.
 * The appearance API is the only way to make the card fields look like the
 * rest of the page; these values mirror the storefront's inputs.
 */
const elementsOptions = (amount: number): StripeElementsOptions => ({
  mode: 'payment',
  amount,
  currency: 'usd',
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&display=swap' }],
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#4a8159',
      colorText: '#1b1f1c',
      colorTextSecondary: '#454b47',
      colorDanger: '#a1421f',
      fontFamily: 'Karla, ui-sans-serif, system-ui, sans-serif',
      borderRadius: '6px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': { borderColor: 'rgba(27,31,28,0.16)', boxShadow: 'none', padding: '12px' },
      '.Input:focus': { borderColor: '#79b38a', boxShadow: '0 0 0 3px rgba(121,179,138,0.25)' },
      '.Label': { fontWeight: '500' },
    },
  },
});

export default function CheckoutClient() {
  const { lines, subtotal, hydrated } = useCart();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  /*
    The cart is read from localStorage on mount, so `lines` is empty on the
    first render even when the cart is full. Creating the session before
    hydration finishes would ask Stripe for an empty order.
  */
  const cartKey = useMemo(
    () => lines.map((l) => `${l.slug}:${l.quantity}`).join('|'),
    [lines]
  );



  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-[28px] uppercase tracking-[0.02em] text-ink">Your cart is empty</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Add a box to your cart and checkout will be waiting here.
        </p>
        <Link href="/collections" className="btn-primary mt-8 inline-flex px-7 py-3.5">
          Shop hobby boxes
        </Link>
      </div>
    );
  }

  const summary = (
    <>
      <ul className="divide-y divide-ink/10">
        {lines.map((line) => (
          <li key={line.slug} className="flex gap-4 py-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-white">
              {line.image ? (
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes={SIZES.card}
                  unoptimized={IMAGES_LOCALIZED}
                  quality={75}
                  className="object-contain p-1"
                />
              ) : null}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white">
                {line.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[14px] leading-snug text-ink line-clamp-2">
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
          <dd className="font-semibold text-moss-500">Free</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
          <dt className="text-[15px] font-semibold text-ink">Total</dt>
          <dd className="text-[20px] font-bold tabular-nums text-ink">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-sand">
      {/* A deliberately stripped header: no nav, no search, no cart icon.
          Every exit from a checkout is a lost order, so the only links out are
          back to the cart and the logo. */}
      <header className="border-b border-ink/10 bg-white">
        <div className="h-1.5 bg-moss-400" aria-hidden="true" />
        <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label={`${site.name} home`}>
            <Logo size="sm" />
          </Link>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            <LockIcon className="h-4 w-4 text-moss-500" />
            Secure checkout
          </span>
        </div>
        {/* Where the shopper is in the purchase. */}
        <ol className="mx-auto flex w-full max-w-[1000px] items-center gap-2 px-4 pb-4 text-[11.5px] font-semibold uppercase tracking-[0.1em] sm:px-6">
          <li>
            <Link href="/cart" className="text-ink-muted hover:text-moss-500">Shopping cart</Link>
          </li>
          <li aria-hidden="true" className="text-ink/30">→</li>
          <li className="text-ink" aria-current="step">Checkout</li>
          <li aria-hidden="true" className="text-ink/30">→</li>
          <li className="text-ink-muted">Order complete</li>
        </ol>
      </header>

      {/* Mobile: the summary collapses, because a phone should open on the
          payment form rather than a list the shopper has already seen. */}
      <div className="border-b border-ink/10 bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 flex w-full items-center justify-between py-3.5 text-[14px]"
        >
          <span className="flex items-center gap-1.5 font-medium text-moss-500">
            {summaryOpen ? 'Hide' : 'Show'} order summary
            <ChevronIcon
              className={`h-4 w-4 transition-transform ${summaryOpen ? '-rotate-90' : 'rotate-90'}`}
            />
          </span>
          <span className="font-bold tabular-nums text-ink">{formatPrice(subtotal)}</span>
        </button>
        {summaryOpen ? <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 pb-5">{summary}</div> : null}
      </div>

      <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 grid gap-10 py-8 lg:grid-cols-[minmax(0,560px)_400px] lg:justify-center lg:gap-10 lg:py-12">
        <main className="min-w-0">
          {!publishableKey ? (
            <p className="rounded-md border border-clay-300 bg-clay-50 p-5 text-[14.5px] text-ink">
              Card payments are not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </p>
          ) : hydrated && lines.length > 0 ? (
            <Elements stripe={stripePromise} options={elementsOptions(subtotal)}>
              <CheckoutForm
                amount={subtotal}
                lines={lines.map((l) => ({ slug: l.slug, quantity: l.quantity }))}
                onProcessing={setProcessing}
              />
            </Elements>
          ) : (
            /* A skeleton rather than a spinner: it holds the height the form
               will take, so the page does not jump when Stripe mounts. */
            <div className="min-h-[520px] animate-pulse space-y-4" aria-label="Loading payment form">
              <div className="h-11 rounded-md bg-ink/5" />
              <div className="h-11 rounded-md bg-ink/5" />
              <div className="h-11 w-2/3 rounded-md bg-ink/5" />
              <div className="h-32 rounded-md bg-ink/5" />
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

        <aside className="relative min-w-0 lg:before:absolute lg:before:bottom-0 lg:before:left-0 lg:before:top-[-3rem] lg:before:-z-10 lg:before:w-screen lg:before:bg-white lg:before:content-['']">
          <div className="lg:sticky lg:top-8">
            <div className="hidden rounded-md border border-ink/10 bg-white p-6 lg:block">
              <h2 className="font-display text-[17px] uppercase tracking-[0.03em] text-ink">
                Your order
                <span className="ml-2 font-normal text-ink-muted">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              </h2>
              <div className="mt-4">{summary}</div>
            </div>

            {/* The reassurances that matter at the moment of payment. Every
                figure comes from site.ts, so they cannot drift away from the
                policy pages that have to honour them. */}
            <ul className="mt-5 space-y-3 rounded-md border border-ink/10 bg-white p-5 text-[13.5px] text-ink-soft">
              <li className="flex gap-3">
                <TruckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
                <span>
                  <strong className="font-semibold text-ink">Free shipping, packed seal-safe</strong> —
                  ships in {site.shipping.handlingTime}.
                </span>
              </li>
              <li className="flex gap-3">
                <ReturnIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
                <span>
                  <strong className="font-semibold text-ink">
                    {site.returns.windowDays}-day returns
                  </strong>{' '}
                  on unopened product{site.returns.restockingFee ? '' : ' — no restocking fee'}.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
                <span>
                  <strong className="font-semibold text-ink">{site.warranty.label}</strong> — every
                  box genuine and factory sealed.
                </span>
              </li>
              <li className="flex gap-3">
                <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
                <span>
                  Card details go straight to Stripe over an encrypted connection. We never see or
                  store them.
                </span>
              </li>
            </ul>

            <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-ink-muted">
              Questions before you pay?{' '}
              <a href={`tel:${site.contact.phoneHref}`} className="font-medium text-moss-500 hover:underline">
                {site.contact.phone}
              </a>{' '}
              · {site.contact.hours}
            </p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 py-5 text-[12.5px] text-ink-muted">
          <Link href="/cart" className="font-medium text-moss-500 hover:underline">
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
