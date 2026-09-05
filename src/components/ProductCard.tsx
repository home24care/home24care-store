import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { discountPct } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import AddToCartButton from './AddToCartButton';
import CardImages from './CardImages';

export default function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: Product;
  priority?: boolean;
  compact?: boolean;
}) {
  const off = discountPct(product);
  const hover = product.images[1];

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-sand"
      >
        <CardImages
          primary={product.images[0].card}
          primaryAlt={product.images[0].alt || product.title}
          hover={hover?.card}
          priority={priority}
        />

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {off > 0 && (
            <span className="rounded-full bg-clay-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Save {off}%
            </span>
          )}
          {product.badges.slice(0, 1).map((b) => (
            <span
              key={b}
              className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-moss-800"
            >
              {b}
            </span>
          ))}
          {!product.available && (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {product.brand}
        </p>
        <h3 className="mt-1 text-[14.5px] font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="line-clamp-2 hover:text-moss-700">
            {product.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[16px] font-bold tabular-nums">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-[13px] text-ink-muted line-through tabular-nums">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {!compact && (
          <>
            <p className="mt-1 text-[12.5px] text-moss-700">Free shipping</p>
            <div className="mt-3">
              <AddToCartButton product={product} variant="card" />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
