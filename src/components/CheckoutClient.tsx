'use client';

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout';
import CheckoutForm from './CheckoutForm';
import CheckoutIntentForm from './CheckoutIntentForm';
import { STRIPE_APPEARANCE, STRIPE_FONTS } from './CheckoutParts';
import PaymentMarks from './PaymentMarks';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { IMAGES_LOCALIZED } from '@/lib/image';
import { site } from '@/lib/site';
import { track } from '@/lib/analytics/client';
import { LockIcon, TruckIcon, ReturnIcon, ShieldIcon, ChevronIcon } from './icons';
import Logo from './Logo';

/*
  THE CHECKOUT PAGE — split screen, our sections, Stripe's fields.

  The layout: the form on white to the left, the order summary on sand in a
  panel that runs to the right edge of the window; on a phone the summary
  folds into a "Show order summary" bar. Wallet buttons sit above everything.

  The payment runs on a Checkout Session in "elements" mode: Stripe's address,
  wallet and payment Elements inside our own sections (CheckoutForm). If that
  session cannot be created or loaded, the page switches to the PaymentIntent
  form the store used before (CheckoutIntentForm), and if Stripe.js cannot
  load at all it offers Stripe's hosted page. Card details never reach this
  site on any of the three.

  The cart is frozen into the session on arrival and never re-read, because
  a session re-created under a form someone is typing into would lose it. The
  summary reads the live cart on purpose: if a second tab changes it, the
  shopper should see that.
*/

/*
  Called once at module scope: loadStripe injects Stripe.js, and calling it per
  render would re-request the script. It rejects when js.stripe.com cannot
  load — an ad blocker, a corporate proxy — so it resolves to null instead,
  which the page notices rather than leaving a blank column.

  The publishable key is public by design: it can start payments against this
  account, never read from it. The secret key never leaves the server.
*/
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey).catch(() => null) : null;

type Line = { slug: string; quantity: number };

/** The session's client secret, created from the server-side catalogue. */
function requestSession(lines: Line[]): Promise<string> {
  return fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'elements', lines }),
  }).then(async (res) => {
    const data = (await res.json().catch(() => ({}))) as { clientSecret?: string; error?: string; detail?: string };
    if (!res.ok || !data.clientSecret) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
    return data.clientSecret;
  });
}

export default function CheckoutClient() {
  const { lines, subtotal, hydrated } = useCart();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [flow, setFlow] = useState<'session' | 'intent'>('session');
  const [secret, setSecret] = useState<string | null>(null);
  const [stripeBlocked, setStripeBlocked] = useState(false);
  const started = useRef(false);

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const cartLines = useMemo(() => lines.map((l) => ({ slug: l.slug, quantity: l.quantity })), [lines]);

  const fallBack = useCallback((reason: string) => {
    console.warn('[checkout] switching to the PaymentIntent form:', reason);
    setFlow('intent');
  }, []);

  /*
    On arrival, once the cart has loaded from storage: count the checkout, and
    freeze the cart into its session. The ref keeps both to once per visit.
    The session is awaited here rather than handed to Stripe as a promise, so
    a failure switches forms directly instead of surfacing inside Stripe.js.
  */
  useEffect(() => {
    if (!hydrated || cartLines.length === 0 || started.current) return;
    started.current = true;
    track('checkout_started', { value: subtotal, quantity: itemCount });
    requestSession(cartLines).then(setSecret, (err: Error) => fallBack(err.message));
  }, [hydrated, cartLines, subtotal, itemCount, fallBack]);

  useEffect(() => {
    stripePromise?.then((stripe) => {
      if (!stripe) setStripeBlocked(true);
    });
  }, []);

  // Stable, because the provider initialises once and warns on a change.
  const sessionOptions = useMemo(
    () =>
      secret
        ? { clientSecret: secret, elementsOptions: { appearance: STRIPE_APPEARANCE, fonts: STRIPE_FONTS } }
        : null,
    [secret]
  );

  if (hydrated && lines.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <CheckoutHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-[28px] text-ink">Your cart is empty</h1>
          <p className="mt-3 text-[15px] text-ink-soft">
            Add a box to your cart and checkout will be waiting here.
          </p>
          <Link href="/collections" className="btn-primary mt-8 inline-flex px-7 py-3.5">
            Shop hobby boxes
          </Link>
        </div>
      </div>
    );
  }

  let form: React.ReactNode;
  if (!publishableKey) {
    form = (
      <p className="rounded-md border border-clay-300 bg-clay-50 p-5 text-[14.5px] text-ink">
        Card payments are not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  } else if (stripeBlocked) {
    form = <StripeBlocked lines={cartLines} />;
  } else if (flow === 'intent' && hydrated) {
    form = (
      <Elements
        stripe={stripePromise}
        options={{
          mode: 'payment',
          amount: subtotal,
          currency: 'usd',
          appearance: STRIPE_APPEARANCE,
          fonts: STRIPE_FONTS,
        }}
      >
        <CheckoutIntentForm amount={subtotal} lines={cartLines} />
      </Elements>
    );
  } else if (sessionOptions) {
    form = (
      <SessionBoundary onError={fallBack}>
        <CheckoutElementsProvider stripe={stripePromise} options={sessionOptions}>
          <CheckoutForm amount={subtotal} onFailure={fallBack} />
        </CheckoutElementsProvider>
      </SessionBoundary>
    );
  } else {
    form = <FormSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <CheckoutHeader />

      {/* Phone: the summary folds into a bar, so the page opens on the form
          rather than a list the shopper has just seen in the cart. */}
      <div className="border-b border-ink/10 bg-sand lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          aria-controls="mobile-summary"
          className="mx-auto flex w-full max-w-[36rem] items-center justify-between gap-4 px-4 py-4 text-[14px] sm:px-6"
        >
          <span className="flex items-center gap-1.5 font-medium text-moss-600">
            {summaryOpen ? 'Hide' : 'Show'} order summary
            <ChevronIcon className={`h-4 w-4 transition-transform ${summaryOpen ? '-rotate-90' : 'rotate-90'}`} />
          </span>
          <span className="text-[16px] font-semibold tabular-nums text-ink">
            {hydrated ? formatPrice(subtotal) : ''}
          </span>
        </button>
        {summaryOpen ? (
          <div id="mobile-summary" className="mx-auto w-full max-w-[36rem] px-4 pb-6 sm:px-6">
            <OrderSummary />
          </div>
        ) : null}
      </div>

      {/* The split: white under the form, sand under the summary, meeting at
          exactly half the window so the panel reaches the edge at any width
          (.checkout-split in globals.css). */}
      <div className="checkout-split flex-1">
        <div className="mx-auto grid w-full max-w-[72rem] lg:grid-cols-2">
          <main className="min-w-0 px-4 py-8 sm:px-6 lg:py-12 lg:pl-8 lg:pr-12 xl:pl-0">
            <div className="mx-auto w-full max-w-[36rem] lg:ml-auto lg:mr-0">
              {/* The header and trail already say where the shopper is;
                  screen readers still get a page title. */}
              <h1 className="sr-only">Checkout</h1>
              {form}

              {/* Phones get the reassurances under the form, where the
                  hesitation happens; on desktop the summary panel has them. */}
              <div className="lg:hidden">
                <Reassurance />
              </div>

              <nav
                aria-label="Checkout policies"
                className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-5 text-[13px]"
              >
                <Link href="/cart" className="mr-auto font-medium text-moss-600 underline-offset-4 hover:underline">
                  ← Return to cart
                </Link>
                <Link href="/policies/shipping" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">Shipping</Link>
                <Link href="/policies/returns" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">Returns</Link>
                <Link href="/policies/privacy" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">Privacy</Link>
                <Link href="/policies/terms" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">Terms</Link>
              </nav>
            </div>
          </main>

          <aside className="hidden min-w-0 px-8 py-12 lg:block lg:pl-12 xl:pr-0">
            <div className="sticky top-8 w-full max-w-[26rem]">
              <OrderSummary heading />
              <Reassurance />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Stripe.js throws, rather than reports, when it rejects an Element's options
 * — and an uncaught throw there would blank the whole page. This catches
 * anything thrown inside the session form and hands over to the fallback.
 */
class SessionBoundary extends Component<{ onError: (reason: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : String(error));
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/*
  A deliberately stripped header: no nav, no search, no cart icon. Every exit
  from a checkout is a lost order, so the logo and the trail back to the cart
  are the only ways out.
*/
function CheckoutHeader() {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="h-1 bg-moss-400" aria-hidden="true" />
      <div className="mx-auto flex w-full min-w-0 max-w-[72rem] items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8 xl:px-0">
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
          <Logo size="sm" />
        </Link>
        <p className="flex min-w-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          <LockIcon className="h-4 w-4 shrink-0 text-moss-500" />
          {/* Beside the logo on a phone there is room for one word. */}
          <span className="sm:hidden">Secure</span>
          <span className="hidden sm:inline">Secure checkout</span>
        </p>
      </div>
      <ol className="mx-auto flex w-full max-w-[72rem] items-center gap-2 px-4 pb-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] sm:px-6 lg:px-8 xl:px-0">
        <li>
          <Link href="/cart" className="text-ink-muted hover:text-moss-600">Cart</Link>
        </li>
        <li aria-hidden="true" className="text-ink/30">→</li>
        <li className="text-ink" aria-current="step">Checkout</li>
        <li aria-hidden="true" className="text-ink/30">→</li>
        <li className="text-ink-muted">Order complete</li>
      </ol>
    </header>
  );
}

/** Thumbnail with a quantity badge, title, SKU and line price; then the totals. */
function OrderSummary({ heading = false }: { heading?: boolean }) {
  const { lines, subtotal, hydrated } = useCart();
  if (!hydrated || lines.length === 0) return null;

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const items = `${count} ${count === 1 ? 'item' : 'items'}`;

  return (
    <section aria-label={heading ? undefined : 'Order summary'} aria-labelledby={heading ? 'order-summary' : undefined} className="min-w-0">
      {heading ? (
        <h2 id="order-summary" className="font-display text-[19px] font-semibold text-ink">
          Your order <span className="font-sans text-[15px] font-normal text-ink-muted">({items})</span>
        </h2>
      ) : null}

      <ul role="list" className={`min-w-0 ${heading ? 'mt-4' : ''}`}>
        {lines.map((line) => (
          <li key={line.slug} className="flex min-w-0 items-center gap-4 py-2.5">
            <span className="relative h-16 w-16 shrink-0 rounded-md border border-ink/10 bg-white">
              {line.image ? (
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes="64px"
                  unoptimized={IMAGES_LOCALIZED}
                  className="rounded-md object-contain p-1"
                />
              ) : null}
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold tabular-nums text-white">
                {line.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium leading-snug text-ink line-clamp-2">{line.title}</span>
              <span className="mt-0.5 block text-[12px] text-ink-muted">{line.sku}</span>
            </span>
            <span className="shrink-0 text-[14px] font-medium tabular-nums text-ink">
              {formatPrice(line.price * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid gap-2.5 text-[14px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-soft">Subtotal · {items}</dt>
          <dd className="font-medium tabular-nums text-ink">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-soft">Shipping</dt>
          <dd className="font-medium text-ink">Free</dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <dt className="font-display text-[18px] font-semibold text-ink">Total</dt>
          <dd className="flex items-baseline gap-2">
            <span className="text-[12px] text-ink-muted">USD</span>
            <span className="text-[22px] font-semibold tabular-nums text-ink">{formatPrice(subtotal)}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/*
  The reassurances that matter at the moment of payment. Every figure comes
  from site.ts, so they cannot drift from the policy pages that honour them.
*/
function Reassurance() {
  return (
    <>
      <ul role="list" className="mt-8 grid gap-3.5 rounded-md border border-ink/10 bg-white p-5 text-[13.5px] leading-relaxed text-ink-soft">
        <li className="flex gap-3">
          <TruckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
          <span>
            <strong className="font-semibold text-ink">Free shipping, packed seal-safe</strong> — dispatched in{' '}
            {site.shipping.handlingTime}.
          </span>
        </li>
        <li className="flex gap-3">
          <ReturnIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
          <span>
            <strong className="font-semibold text-ink">{site.returns.windowDays}-day returns</strong> on unopened
            product{site.returns.restockingFee ? '' : ' — no restocking fee'}.
          </span>
        </li>
        <li className="flex gap-3">
          <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
          <span>
            <strong className="font-semibold text-ink">{site.warranty.label}</strong> — every box genuine and
            sealed as described.
          </span>
        </li>
        <li className="flex gap-3">
          <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moss-500" />
          <span>Card details go straight to Stripe over an encrypted connection. We never see or store them.</span>
        </li>
      </ul>

      <PaymentMarks className="mt-5" size="small" />

      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-muted">
        Questions before you pay?{' '}
        <a href={`tel:${site.contact.phoneHref}`} className="font-medium text-moss-600 hover:underline">
          {site.contact.phone}
        </a>{' '}
        · {site.contact.hours}
      </p>
    </>
  );
}

/**
 * Stripe.js could not load, so no on-page form can work. Stripe's hosted page
 * needs no script of ours, and takes the same order through the same route.
 */
function StripeBlocked({ lines }: { lines: Line[] }) {
  const [redirecting, setRedirecting] = useState(false);
  const [failed, setFailed] = useState(false);

  const payOnStripe = async () => {
    setRedirecting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'hosted', lines }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Falls through to the phone number below.
    }
    setFailed(true);
    setRedirecting(false);
  };

  return (
    <div role="alert" className="rounded-md border border-clay-300 bg-clay-50 p-5 text-[14.5px] text-ink">
      <p className="font-semibold">The secure payment form could not load in this browser.</p>
      <p className="mt-1 text-ink-soft">
        An ad blocker or privacy extension is the usual cause. Nothing has been charged.
      </p>
      {failed ? (
        <p className="mt-3">
          Stripe&rsquo;s page could not be opened either. Call{' '}
          <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-600 underline">
            {site.contact.phone}
          </a>{' '}
          and we will take the order directly.
        </p>
      ) : (
        <button type="button" onClick={payOnStripe} disabled={redirecting} className="btn-primary mt-4 px-6 py-3">
          {redirecting ? 'Opening Stripe…' : 'Pay on Stripe’s secure page instead'}
        </button>
      )}
    </div>
  );
}

/** Holds roughly the form's height, so the page does not jump when Stripe mounts. */
function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading the payment form">
      <div className="h-12 rounded-md bg-ink/5" />
      <div className="h-5 w-24 rounded bg-ink/5" />
      <div className="h-12 rounded-md bg-ink/5" />
      <div className="h-5 w-24 rounded bg-ink/5" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-md bg-ink/5" />
        <div className="h-12 rounded-md bg-ink/5" />
      </div>
      <div className="h-12 rounded-md bg-ink/5" />
      <div className="h-40 rounded-md bg-ink/5" />
    </div>
  );
}
