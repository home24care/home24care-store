'use client';

import { useEffect, useRef, useState } from 'react';
import type { StripeCheckoutExpressCheckoutElementOptions } from '@stripe/stripe-js';
import {
  ExpressCheckoutElement,
  PaymentElement,
  ShippingAddressElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import { formatPrice } from '@/lib/format';
import {
  FIELD,
  FormError,
  HELPER,
  LABEL,
  OrDivider,
  PlaceOrder,
  PolicyLinks,
  Section,
  ShippingMethod,
  TermsCheckbox,
} from './CheckoutParts';

/*
  THE FORM BODY — our sections, Stripe's fields inside them.

  Runs on a Checkout Session in "elements" mode, rendered inside
  CheckoutElementsProvider (see CheckoutClient). Stripe draws the wallet
  buttons, the shipping address and the payment methods — card, Link and
  whatever else the account has on — and keeps the session's total. Contact
  email and phone are our own inputs: they go to Stripe in confirm(), never to
  our server.

  If Stripe cannot load the session or its fields, `onFailure` hands the page
  over to the PaymentIntent form, so a shopper is never left without a way to
  pay. (A session that cannot be created never reaches this component.)
*/

// Stripe's type marks every key required; these are the ones we set.
const EXPRESS_OPTIONS = {
  buttonHeight: 48,
  layout: { maxColumns: 2, maxRows: 2 },
} as StripeCheckoutExpressCheckoutElementOptions;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutForm({
  amount,
  onFailure,
}: {
  /** The cart total, shown on the button until the session's own arrives. */
  amount: number;
  onFailure: (reason: string) => void;
}) {
  const result = useCheckoutElements();
  const checkout = result.type === 'success' ? result.checkout : null;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExpress, setHasExpress] = useState(false);
  const termsRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const failed = result.type === 'error' ? result.error.message : null;
  useEffect(() => {
    if (failed) onFailure(failed);
  }, [failed, onFailure]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!checkout || busy) return;
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address for your order confirmation.');
      emailRef.current?.focus();
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a phone number the carrier can reach you on.');
      phoneRef.current?.focus();
      return;
    }
    if (!accepted) {
      setError('Please accept the terms before placing your order.');
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      termsRef.current?.focus();
      return;
    }

    setBusy(true);
    /*
      confirm() validates the address and payment fields itself, highlights
      whatever is missing, and on success redirects to the thank-you page —
      so returning here means something needs the shopper.
    */
    const outcome = await checkout.confirm({ email: email.trim(), phoneNumber: phone.trim() });
    if (outcome.type === 'error') setError(outcome.error.message);
    setBusy(false);
  };

  // Stripe asks that the total shown be the session's own, so it tracks any
  // change Stripe makes; the cart's figure stands in while it loads.
  const total = checkout ? checkout.total.total.amount : formatPrice(amount);

  return (
    <form onSubmit={submit} noValidate className="min-w-0">
      {/*
        Wallets above everything. Apple Pay and Google Pay already hold the
        card, email, phone and address, so a shopper with one types nothing.
        onReady says whether this device has a wallet at all; without it the
        "or" rule would sit under an empty space on most desktops.
      */}
      <section aria-label="Express checkout" className={hasExpress ? 'mb-8' : ''}>
        {hasExpress ? (
          <p className="mb-3 text-center text-[13.5px] text-ink-muted">Express checkout</p>
        ) : null}
        <ExpressCheckoutElement
          options={EXPRESS_OPTIONS}
          onReady={({ availablePaymentMethods }) => setHasExpress(Boolean(availablePaymentMethods))}
          onConfirm={async (event) => {
            if (!checkout) {
              event.paymentFailed({ reason: 'fail' });
              return;
            }
            setError(null);
            const outcome = await checkout.confirm({ expressCheckoutConfirmEvent: event });
            if (outcome.type === 'error') setError(outcome.error.message);
          }}
        />
        {hasExpress ? (
          <>
            {/* The wallet sheet opens straight from its button — there is no
                step in between for the checkbox below — so the terms are
                stated where the wallets are. */}
            <p className="mt-2.5 text-center text-[12px] leading-relaxed text-ink-muted">
              Paying with a wallet means you accept the <PolicyLinks />.
            </p>
            <OrDivider />
          </>
        ) : null}
      </section>

      <Section id="co-contact" title="Contact" className="">
        <label htmlFor="co-email" className={LABEL}>
          Email
        </label>
        <input
          ref={emailRef}
          id="co-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
        />
        <p className={HELPER}>Your order confirmation and tracking go here.</p>
      </Section>

      <Section id="co-delivery" title="Delivery">
        {/* The session only allows US addresses, matching the shipping policy.
            Name split, and nothing more: Stripe.js rejects `fields` here at
            runtime although its types list it, and the phone is our own
            input below. */}
        <ShippingAddressElement
          options={{ display: { name: 'split' } }}
          onLoadError={({ error: e }) => onFailure(e.message ?? 'The address form could not load.')}
        />
        <div className="mt-3">
          <label htmlFor="co-phone" className={LABEL}>
            Phone
          </label>
          <input
            ref={phoneRef}
            id="co-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={FIELD}
          />
          <p className={HELPER}>For the carrier, in case they need to reach you about the delivery.</p>
        </div>
      </Section>

      <Section id="co-shipping" title="Shipping method">
        <ShippingMethod />
      </Section>

      <Section id="co-payment" title="Payment" note="All transactions are secure and encrypted.">
        <PaymentElement
          options={{ layout: 'tabs' }}
          onLoadError={({ error: e }) => onFailure(e.message ?? 'The payment form could not load.')}
        />
      </Section>

      <TermsCheckbox
        ref={termsRef}
        checked={accepted}
        onChange={(v) => {
          setAccepted(v);
          if (v) setError(null);
        }}
      />

      <FormError message={error} />
      <PlaceOrder busy={busy} disabled={!checkout} total={total} />
    </form>
  );
}
