'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { CheckIcon, MinusIcon, PlusIcon } from './icons';

export default function AddToCartButton({
  product,
  variant = 'card',
  showQuantity = false,
  buyNow = false,
}: {
  product: Product;
  variant?: 'card' | 'primary';
  showQuantity?: boolean;
  /** Adds a "Buy now" button that goes straight to checkout. */
  buyNow?: boolean;
}) {
  const { add, close } = useCart();
  const router = useRouter();
  const max = product.purchaseLimit ?? 10;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  if (!product.available) {
    return (
      <button type="button" disabled className={variant === 'primary' ? 'btn-outline w-full py-3.5' : 'btn-outline w-full py-2.5 text-[13px]'}>
        Sold out
      </button>
    );
  }

  const onAdd = () => {
    add(product, quantity);
    setAdded(true);
  };

  return (
    <div className={showQuantity ? 'flex flex-wrap gap-3' : ''}>
      {showQuantity && (
        <div className="flex w-32 items-center justify-between rounded border border-ink/20 px-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="rounded-full p-2.5 text-ink-soft hover:text-ink"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="text-[15px] font-semibold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            className="rounded-full p-2.5 text-ink-soft hover:text-ink"
            aria-label="Increase quantity"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className={
          variant === 'primary'
            ? 'btn-primary min-w-[150px] flex-1 py-3.5'
            : 'btn-outline w-full py-2.5 text-[12px] hover:border-moss-400 hover:bg-moss-400 hover:text-white'
        }
      >
        {added ? (
          <>
            <CheckIcon className="h-4 w-4" /> Added
          </>
        ) : (
          `Add to cart${product.preorder ? ' · Pre-order' : ''}`
        )}
      </button>

      {buyNow && (
        <button
          type="button"
          onClick={() => {
            add(product, quantity);
            close();
            router.push('/checkout');
          }}
          className="btn-accent min-w-[150px] flex-1 py-3.5"
        >
          Buy now
        </button>
      )}
    </div>
  );
}
