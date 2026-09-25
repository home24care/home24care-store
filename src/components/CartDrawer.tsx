'use client';

import { useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { track } from '@/lib/analytics/client';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon, LockIcon, TruckIcon, CartIcon, ShieldIcon } from './icons';
import PaymentMarks from './PaymentMarks';
import { IMAGES_LOCALIZED } from '@/lib/image';

export default function CartDrawer() {
  const { isOpen, close, lines, subtotal, setQuantity, remove, count } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  /* See CartPageClient: the session is created on /checkout, not here. */
  const checkout = () => {
    setBusy(true);
    close();
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={close} aria-hidden="true" />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-white shadow-lift">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 px-5">
          <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">
            Shopping cart {count > 0 && <span className="text-moss-500">({count})</span>}
          </h2>
          <button type="button" onClick={close} className="btn-ghost" aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-50 text-moss-500">
              <CartIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-[20px] uppercase tracking-[0.03em]">Your cart is empty</p>
              <p className="mt-1 text-sm text-ink-muted">
                Your next grail is waiting. Free U.S. shipping on every box.
              </p>
            </div>
            <Link href="/collections" onClick={close} className="btn-primary">
              Shop hobby boxes
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 bg-moss-400 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
              <span className="flex items-center gap-2">
                <TruckIcon className="h-4 w-4" />
                Free shipping unlocked
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldIcon className="h-4 w-4" />
                Factory sealed
              </span>
            </div>

            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.slug} className="flex gap-3.5 py-4">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={close}
                    className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-md border border-ink/10 bg-white"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        sizes="86px"
                        quality={75}
                        unoptimized={IMAGES_LOCALIZED}
                        className="object-contain p-1.5"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={close}
                      className="line-clamp-2 font-display text-[14.5px] leading-snug hover:text-moss-500"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">SKU {line.sku}</p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded border border-ink/15">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, line.quantity - 1)}
                          className="p-1.5 text-ink-soft hover:text-ink"
                          aria-label={`Decrease quantity of ${line.title}`}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[26px] text-center text-sm font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQuantity}
                          className="p-1.5 text-ink-soft hover:text-ink disabled:opacity-40"
                          aria-label={`Increase quantity of ${line.title}`}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold tabular-nums text-moss-500">
                          {formatPrice(line.price * line.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(line.slug)}
                          className="text-ink-muted hover:text-clay-700"
                          aria-label={`Remove ${line.title}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-ink/10 bg-sand px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="font-semibold text-moss-700">Free</dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
                  <dt className="font-semibold">Estimated total</dt>
                  <dd className="font-bold tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-[12px] text-ink-muted">
                Taxes, if applicable, are calculated at checkout.
              </p>

              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-[13px] text-clay-800">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={checkout}
                disabled={busy}
                className="btn-primary mt-3 w-full py-3.5"
              >
                {busy ? 'Opening secure checkout…' : 'Proceed to checkout'}
              </button>

              <Link href="/cart" onClick={close} className="btn-outline mt-2 w-full py-2.5 text-sm">
                View cart
              </Link>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-muted">
                <LockIcon className="h-3.5 w-3.5" />
                Secure checkout · 100% authentic · {site.returns.windowDays}-day returns
              </p>
              <PaymentMarks size="small" className="mt-3 justify-center" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
