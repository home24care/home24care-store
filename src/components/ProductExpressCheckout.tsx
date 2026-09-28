'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';
import type { Product } from '@/lib/catalog';
import { site } from '@/lib/site';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * One-tap wallet buttons (Apple Pay, Google Pay, Link, Amazon Pay — whatever
 * the Stripe account has enabled and the shopper's device supports) right on
 * the product page, for this product at the chosen quantity.
 *
 * The wallet sheet collects email, phone and the shipping address, so nothing
 * else is needed; the charge is still priced on the server by /api/checkout,
 * exactly as the full checkout is. Renders nothing on a device with no wallet.
 */
export default function ProductExpressCheckout({ product, quantity }: { product: Product; quantity: number }) {
  if (!stripePromise) return null;
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: product.price * quantity,
        currency: 'usd',
        appearance: { theme: 'stripe' },
      }}
    >
      <ExpressButtons product={product} quantity={quantity} />
    </Elements>
  );
}

function ExpressButtons({ product, quantity }: { product: Product; quantity: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = (event: StripeExpressCheckoutElementClickEvent) => {
    setError(null);
    event.resolve({
      emailRequired: true,
      phoneNumberRequired: true,
      shippingAddressRequired: true,
      // The store ships within the United States only.
      allowedShippingCountries: ['US'],
      shippingRates: [
        {
          id: 'free-shipping',
          displayName: 'Free shipping',
          amount: 0,
          deliveryEstimate: {
            minimum: { unit: 'business_day', value: 2 },
            maximum: { unit: 'business_day', value: 4 },
          },
        },
      ],
      lineItems: [
        { name: quantity > 1 ? `${product.title} × ${quantity}` : product.title, amount: product.price * quantity },
      ],
    });
  };

  const onConfirm = async () => {
    if (!stripe || !elements) return;
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Please try again.');
      return;
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: [{ slug: product.slug, quantity }] }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'We could not start the payment. Please try again.');
        return;
      }
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: { return_url: `${window.location.origin}/checkout/success` },
      });
      // confirmPayment only returns when it could not redirect.
      setError(confirmError?.message ?? 'We could not complete the payment. You have not been charged.');
    } catch {
      setError('We could not reach the payment service. Please try again.');
    }
  };

  return (
    <div className={available ? 'mt-3' : ''}>
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          layout: { maxColumns: 2, maxRows: 2, overflow: 'never' },
          buttonType: { applePay: 'buy', googlePay: 'buy' },
        }}
        onReady={({ availablePaymentMethods }) => setAvailable(Boolean(availablePaymentMethods))}
        onClick={onClick}
        onConfirm={onConfirm}
      />
      {available && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
          Express checkout ships free to the {site.address.countryName}. By paying you accept our{' '}
          <Link href="/policies/terms" className="underline">Terms</Link>,{' '}
          <Link href="/policies/privacy" className="underline">Privacy Policy</Link> and{' '}
          <Link href="/policies/returns" className="underline">Return Policy</Link>.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-md border border-clay-300 bg-clay-50 px-3 py-2 text-[13px] text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
