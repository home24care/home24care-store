'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AddressElement,
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || busy) return;

    if (!accepted) {
      setError('Please accept the terms before placing your order.');
      return;
    }

    setBusy(true);
    onProcessing(true);
    setError(null);

    /*
      Validate before confirming. Without this, a missing address field is
      reported only after the confirm round-trip, which reads as a payment
      failure rather than a form error.
    */
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Please check the highlighted fields.');
      setBusy(false);
      onProcessing(false);
      return;
    }

    /*
      The intent is created here, after the form validates, rather than when
      the page loaded. Creating it up front made a PaymentIntent for every
      visitor who merely opened checkout, and delayed the form behind a server
      round-trip. The amount is still computed server-side from the catalogue.
    */
    let clientSecret: string;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'We could not start the payment. Please try again.');
        setBusy(false);
        onProcessing(false);
        return;
      }
      clientSecret = data.clientSecret;
    } catch {
      setError('We could not reach the payment service. Please try again.');
      setBusy(false);
      onProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    /*
      confirmPayment only returns when it could NOT redirect. A success takes
      the browser to return_url, so there is no success branch here.
    */
    setError(
      confirmError?.message ??
        'We could not complete the payment. Your card has not been charged.'
    );
    setBusy(false);
    onProcessing(false);
  };

  return (
    <form onSubmit={submit} noValidate>
      <section>
        <h2 className="text-[17px] font-semibold text-ink">Contact</h2>
        <div className="mt-3">
          <LinkAuthenticationElement />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-semibold text-ink">Shipping address</h2>
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
        <h2 className="text-[17px] font-semibold text-ink">Shipping method</h2>
        {/* One option, priced at zero. It is shown rather than hidden because a
            checkout that never mentions shipping reads as though a cost is
            about to appear. */}
        <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-moss-600 bg-moss-50 px-4 py-3.5">
          <span>
            <span className="block text-[14.5px] font-semibold text-ink">
              Free standard shipping
            </span>
            <span className="block text-[13px] text-ink-soft">
              Ships in {site.shipping.handlingTime.replace(' (Mon–Fri)', '')}, delivered in{' '}
              {site.shipping.transitTime}
            </span>
          </span>
          <span className="text-[14.5px] font-semibold text-moss-700">Free</span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-semibold text-ink">Payment</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          All transactions are secure and encrypted.
        </p>
        <div className="mt-3">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
      </section>

      <label className="mt-7 flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/30 text-moss-700 focus:ring-moss-600"
        />
        <span>
          I have read and accept the{' '}
          <Link href="/policies/terms" className="font-medium text-moss-700 underline">
            Terms
          </Link>
          , the{' '}
          <Link href="/policies/privacy" className="font-medium text-moss-700 underline">
            Privacy Policy
          </Link>{' '}
          and the{' '}
          <Link href="/policies/returns" className="font-medium text-moss-700 underline">
            Return Policy
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-clay-300 bg-clay-50 px-4 py-3 text-[14px] text-ink"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || busy}
        className="mt-6 w-full rounded-full bg-moss-800 px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-moss-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Processing…' : `Place order · ${formatPrice(amount)}`}
      </button>

      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-muted">
        No hidden costs. The amount above is what you pay, and shipping is free.
      </p>
    </form>
  );
}
