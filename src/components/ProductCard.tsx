import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { discountPct, getCollection } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import AddToCartButton from './AddToCartButton';
import CardImages from './CardImages';

/** Badge colours: gold for scarcity, green for demand, dark for new. */
const BADGE_STYLE: Record<string, string> = {
  'Limited Release': 'bg-clay-400 text-white',
  'High Demand': 'bg-moss-400 text-white',
  'New Release': 'bg-ink text-white',
};

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
  const category = getCollection(product.collection)?.title ?? product.productType;

  return (
    <article className="group relative flex flex-col text-center">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-md bg-white"
      >
        <CardImages
          primary={product.images[0].card}
          primaryAlt={product.images[0].alt || product.title}
          hover={hover?.card}
          priority={priority}
        />

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {!product.available && (
            <span className="rounded-sm bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
          {off > 0 && (
            <span className="rounded-sm bg-clay-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              -{off}%
            </span>
          )}
          {product.available &&
            product.badges.slice(0, 1).map((b) => (
              <span
                key={b}
                className={`rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${BADGE_STYLE[b] ?? 'bg-white text-ink'}`}
              >
                {b}
              </span>
            ))}
        </div>
      </Link>

      <div className="flex flex-1 flex-col items-center pt-3.5">
        <h3 className="font-display text-[14.5px] leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="line-clamp-2 hover:text-moss-500">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 text-[12px] text-ink-muted">{category}</p>

        <div className="mt-1 flex items-baseline gap-2">
          {product.compareAtPrice && (
            <span className="text-[13px] text-ink-muted line-through tabular-nums">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-[15px] font-bold tabular-nums text-moss-500">{formatPrice(product.price)}</span>
        </div>

        {!compact && (
          <div className="mt-3 w-full max-w-[220px] opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
            <AddToCartButton product={product} variant="card" />
          </div>
        )}
      </div>
    </article>
  );
}
