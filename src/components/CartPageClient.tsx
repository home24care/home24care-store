'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import PaymentMarks from './PaymentMarks';
import { MinusIcon, PlusIcon, TrashIcon, LockIcon, TruckIcon, ReturnIcon, ShieldIcon, CartIcon } from './icons';
import { IMAGES_LOCALIZED } from '@/lib/image';

export default function CartPageClient() {
  const { lines, subtotal, setQuantity, remove, hydrated } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const canceled = params.get('canceled') === '1';

  useEffect(() => {
    if (canceled) setError('Checkout was canceled. Your cart has been kept intact.');
  }, [canceled]);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout is unavailable right now.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  // Avoid rendering an "empty cart" flash before localStorage is read.
  if (!hydrated) {
    return <div className="py-24 text-center text-ink-muted">Loading your cart…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-moss-50 text-moss-500">
          <CartIcon className="h-9 w-9" />
        </span>
        <div>
          <h1 className="font-display text-[30px] tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            Free standard shipping applies to every order, with no minimum.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-clay-50 px-4 py-2 text-[13.5px] text-clay-800">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/collections" className="btn-primary">
            Browse collections
          </Link>
          <Link href="/collections/best-sellers" className="btn-outline">
            See best sellers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 pb-16 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
      <div>
        <h1 className="font-display text-[32px] tracking-tight sm:text-[40px]">Your cart</h1>
        <p className="mt-2 text-[14.5px] text-ink-soft">
          {lines.length} {lines.length === 1 ? 'item' : 'items'} · Free standard shipping applied
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-clay-50 px-4 py-3 text-[14px] text-clay-800">
            {error}
          </p>
        )}

        <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
          {lines.map((line) => (
            <li key={line.slug} className="flex gap-4 py-5 sm:gap-6">
              <Link
                href={`/products/${line.slug}`}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-32 sm:w-32"
              >
                {line.image && (
                  <Image
                    src={line.image}
                    alt={line.title}
                    fill
                    sizes="(min-width: 640px) 128px, 112px"
                    quality={75}
                    unoptimized={IMAGES_LOCALIZED}
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/products/${line.slug}`}
                  className="text-[15.5px] font-semibold leading-snug hover:text-moss-700"
                >
                  {line.title}
                </Link>
                <p className="mt-1 text-[13px] text-ink-muted">SKU {line.sku}</p>
                <p className="mt-1 text-[13px] font-medium text-moss-700">Free shipping</p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-ink/20">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.slug, line.quantity - 1)}
                      className="p-2 text-ink-soft hover:text-ink"
                      aria-label={`Decrease quantity of ${line.title}`}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="min-w-[30px] text-center text-[15px] font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.slug, line.quantity + 1)}
                      disabled={line.quantity >= line.maxQuantity}
                      className="p-2 text-ink-soft hover:text-ink disabled:opacity-40"
                      aria-label={`Increase quantity of ${line.title}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[16px] font-bold tabular-nums">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(line.slug)}
                      className="flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-clay-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link href="/collections" className="mt-6 inline-block text-[14px] font-semibold text-moss-700 underline underline-offset-2">
          ← Continue shopping
        </Link>
      </div>

      {/* -------------------------------------------------------- Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-ink/10 bg-sand p-6 shadow-card">
          <h2 className="font-display text-[22px] tracking-tight">Order summary</h2>

          <dl className="mt-4 space-y-2.5 text-[14.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Standard shipping</dt>
              <dd className="font-semibold text-moss-700">Free</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Estimated tax</dt>
              <dd className="text-ink-muted">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-ink/15 pt-3 text-[18px]">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={checkout}
            disabled={busy}
            className="btn-accent mt-5 w-full py-4 text-[15.5px]"
          >
            {busy ? 'Redirecting to secure checkout…' : 'Proceed to secure checkout'}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-muted">
            <LockIcon className="h-3.5 w-3.5" />
            Encrypted payment · We never store your card details
          </p>

          <PaymentMarks className="mt-4 justify-center" />

          <ul className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-[13.5px] text-ink-soft">
            {[
              [TruckIcon, `Ships in ${site.shipping.handlingTime}, arrives in ${site.shipping.transitTime}`],
              [ReturnIcon, `${site.returns.windowDays}-day returns, no restocking fees`],
              [ShieldIcon, site.warranty.label],
            ].map(([Icon, text]) => {
              const I = Icon as typeof TruckIcon;
              return (
                <li key={text as string} className="flex gap-2.5">
                  <I className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-4 px-2 text-[12.5px] leading-relaxed text-ink-muted">
          By placing an order you agree to our{' '}
          <Link href="/policies/terms" className="underline underline-offset-2 hover:text-moss-700">
            Terms of Service
          </Link>
          ,{' '}
          <Link href="/policies/returns" className="underline underline-offset-2 hover:text-moss-700">
            Refunds &amp; Returns Policy
          </Link>{' '}
          and{' '}
          <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-moss-700">
            Privacy Policy
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
