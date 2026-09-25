'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  AddressElement,
  ExpressCheckoutElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

/**
 * The form body: our fields and our submit button, with Stripe's Elements
 * mounted inside it.
 *
 * This is the "integrated" shape rather than Stripe's embedded Checkout. The
 * embedded version renders contact, address, shipping and payment as one
 * iframe, which cannot have our own shipping selector or terms checkbox placed
 * between its sections. Here Stripe owns only the two parts that must be
 * PCI-scoped -- the address fields and the payment methods -- and everything
 * around them is ours.
 */
export default function CheckoutForm({
  amount,
  lines,
  onProcessing,
}: {
  amount: number;
  lines: { slug: string; quantity: number }[];
  onProcessing: (busy: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hasExpress, setHasExpress] = useState(false);
  const termsRef = useRef<HTMLInputElement>(null);

  /*
    The wallet buttons sit above the terms checkbox, so a shopper who taps
    Apple Pay first would otherwise get an error about a control they cannot
    see. Bring it into view and focus it instead of only complaining.
  */
  const demandTerms = () => {
    setError('Please accept the terms before placing your order.');
    termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    termsRef.current?.focus();
  };

  /**
   * Create the intent and confirm. Shared by the card form and the wallet
   * buttons, so a change to how orders are priced or confirmed cannot apply
   * to one path and not the other.
   */
  const confirm = async (): Promise<string | null> => {
    if (!stripe || !elements) return 'Payment is still loading. Please try again.';

    const { error: submitError } = await elements.submit();
    if (submitError) return submitError.message ?? 'Please check the highlighted fields.';

    let clientSecret: string;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        return data.error || 'We could not start the payment. Please try again.';
      }
      clientSecret = data.clientSecret;
    } catch {
      return 'We could not reach the payment service. Please try again.';
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/checkout/success` },
    });

    // confirmPayment only returns when it could NOT redirect, so reaching
    // here always means a failure.
    return (
      confirmError?.message ??
      'We could not complete the payment. Your card has not been charged.'
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || busy) return;

    if (!accepted) {
      demandTerms();
      return;
    }

    setBusy(true);
    onProcessing(true);
    setError(null);

    setError(await confirm());
    setBusy(false);
    onProcessing(false);
  };

  return (
    <form onSubmit={submit} noValidate>
      {/*
        Wallet buttons first. Apple Pay and Google Pay already hold the card,
        name and shipping address, so a shopper who has one never types any of
        it -- which is most of the abandonment on a phone.

        `hasExpress` is set from onReady: the element reports which wallets the
        device can actually offer, and on a browser with none it renders
        nothing. Without that flag the "or pay by card" divider would sit above
        an empty space on most desktops.
      */}
      <div className={hasExpress ? 'mb-7' : ''}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            layout: { maxColumns: 2, maxRows: 2 },
          }}
          onReady={({ availablePaymentMethods }) =>
            setHasExpress(Boolean(availablePaymentMethods))
          }
          onConfirm={async () => {
            if (!accepted) {
              demandTerms();
              return;
            }
            setBusy(true);
            onProcessing(true);
            setError(await confirm());
            setBusy(false);
            onProcessing(false);
          }}
        />
        {hasExpress ? (
          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
              or pay by card
            </span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>
        ) : null}
      </div>

      <section>
        <h2 className="font-display text-[17px] uppercase tracking-[0.03em] text-ink">Contact</h2>
        <div className="mt-3">
          <LinkAuthenticationElement />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[17px] uppercase tracking-[0.03em] text-ink">Shipping address</h2>
        <div className="mt-3">
          <AddressElement
            options={{
              mode: 'shipping',
              // The storefront ships within the United States only, and the
              // shipping policy says so; offering other countries here would
              // take payment for an order that cannot be fulfilled.
              allowedCountries: ['US'],
              fields: { phone: 'always' },
              validation: { phone: { required: 'never' } },
            }}
          />
        </div>
        <p className="mt-2 text-[12.5px] text-ink-muted">
          We currently deliver within the {site.address.countryName} only.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[17px] uppercase tracking-[0.03em] text-ink">Shipping method</h2>
        {/* One option, priced at zero. It is shown rather than hidden because a
            checkout that never mentions shipping reads as though a cost is
            about to appear. */}
        <div className="mt-3 flex items-center justify-between rounded-md border-2 border-moss-400 bg-moss-50 px-4 py-3.5">
          <span>
            <span className="block text-[14.5px] font-semibold text-ink">
              Free shipping — packed seal-safe
            </span>
            <span className="block text-[13px] text-ink-soft">
              Ships in {site.shipping.handlingTime.replace(' (Mon–Fri)', '')}, delivered in{' '}
              {site.shipping.transitTime}
            </span>
          </span>
          <span className="text-[14.5px] font-semibold text-moss-500">Free</span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[17px] uppercase tracking-[0.03em] text-ink">Payment</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          All transactions are secure and encrypted.
        </p>
        <div className="mt-3">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
      </section>

      <label className="mt-7 flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-ink-soft">
        <input
          ref={termsRef}
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/30 text-moss-500 focus:ring-moss-400"
        />
        <span>
          I have read and accept the{' '}
          <Link href="/policies/terms" className="font-medium text-moss-500 underline">
            Terms
          </Link>
          , the{' '}
          <Link href="/policies/privacy" className="font-medium text-moss-500 underline">
            Privacy Policy
          </Link>{' '}
          and the{' '}
          <Link href="/policies/returns" className="font-medium text-moss-500 underline">
            Return Policy
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-md border border-clay-300 bg-clay-50 px-4 py-3 text-[14px] text-ink"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || busy}
        className="btn-primary mt-6 w-full py-4 text-[14px]"
      >
        {busy ? 'Processing…' : `Place order · ${formatPrice(amount)}`}
      </button>

      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-muted">
        No hidden costs. The amount above is what you pay, shipping is free, and every box
        ships factory sealed.
      </p>
    </form>
  );
}
