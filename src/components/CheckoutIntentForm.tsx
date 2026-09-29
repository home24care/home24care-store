'use client';

import { useRef, useState } from 'react';
import {
  AddressElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { formatPrice } from '@/lib/format';
import { FormError, PlaceOrder, Section, ShippingMethod, TermsCheckbox } from './CheckoutParts';

/*
  THE FALLBACK FORM — the same sections on a bare PaymentIntent.

  /checkout runs on a Checkout Session (CheckoutForm). This is what it falls
  back to when that session cannot be created or loaded: the integration the
  store took payments with before, so a problem on the session path never
  stops a sale. The intent is created only when the shopper places the order,
  from the server-side catalogue, and returns to the thank-you page with
  `payment_intent`, which that page already handles.

  Wallets appear as tabs inside the Payment Element here rather than as
  buttons above the form: an express button would open its sheet before the
  address and terms below it were filled in.
*/
export default function CheckoutIntentForm({
  amount,
  lines,
}: {
  amount: number;
  lines: { slug: string; quantity: number }[];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const termsRef = useRef<HTMLInputElement>(null);

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
      setError('Please accept the terms before placing your order.');
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      termsRef.current?.focus();
      return;
    }

    setBusy(true);
    setError(null);
    setError(await confirm());
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="min-w-0">
      <Section id="co-contact" title="Contact" className="">
        <LinkAuthenticationElement />
      </Section>

      <Section id="co-delivery" title="Delivery">
        <AddressElement
          options={{
            mode: 'shipping',
            // The shipping policy covers the United States only; offering
            // other countries would take payment for an undeliverable order.
            allowedCountries: ['US'],
            display: { name: 'split' },
            fields: { phone: 'always' },
            validation: { phone: { required: 'always' } },
          }}
        />
      </Section>

      <Section id="co-shipping" title="Shipping method">
        <ShippingMethod />
      </Section>

      <Section id="co-payment" title="Payment" note="All transactions are secure and encrypted.">
        <PaymentElement options={{ layout: 'tabs' }} />
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
      <PlaceOrder busy={busy} disabled={!stripe} total={formatPrice(amount)} />
    </form>
  );
}
