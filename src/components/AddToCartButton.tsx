'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { CheckIcon, MinusIcon, PlusIcon } from './icons';

export default function AddToCartButton({
  product,
  variant = 'card',
  showQuantity = false,
}: {
  product: Product;
  variant?: 'card' | 'primary';
  showQuantity?: boolean;
}) {
  const { add } = useCart();
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
    <div className={showQuantity ? 'flex flex-col gap-3 sm:flex-row' : ''}>
      {showQuantity && (
        <div className="flex items-center justify-between rounded-full border border-ink/20 px-1 sm:w-36">
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
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
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
            ? 'btn-accent flex-1 py-3.5 text-[15px]'
            : 'btn-outline w-full py-2.5 text-[13px] hover:border-moss-600 hover:bg-moss-600 hover:text-white'
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
    </div>
  );
}
