'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'name', label: 'Name: A–Z' },
] as const;

/**
 * Sorts and filters an already server-rendered grid, as pure progressive
 * enhancement.
 *
 * Three constraints had to be satisfied at once, and the obvious solutions
 * each break one of them:
 *
 *  1. Reading `searchParams` in the page component opts the whole route into
 *     dynamic rendering, which silently killed `generateStaticParams` — all 18
 *     collection pages rendered per request while the build summary still
 *     called them SSG.
 *  2. Moving the grid into a client component fixed that but dragged
 *     ProductCard into the browser bundle, taking First Load JS from 114 kB to
 *     258 kB on the highest-traffic pages.
 *  3. Using `useSearchParams` here — even wrapped in Suspense — makes the
 *     prerendered HTML contain the Suspense *fallback* instead of the cards.
 *     The page still "prerendered", but every product was client-rendered and
 *     absent from the HTML a crawler sees.
 *
 * So the query string is read from `window.location` after mount instead of
 * through the router hook. No Suspense boundary is needed, the server emits
 * every card as real HTML in the default order, and this component only
 * reorders the nodes that are already there: CSS `order` on the grid items and
 * the `hidden` attribute for the stock filter.
 *
 * The trade is that a shared `?sort=` link paints in default order for one
 * frame before reordering. That is the right way round: the crawler and the
 * no-JS visitor both get the full catalog.
 *
 * Each card is wrapped by the server in an element carrying data-price,
 * data-available, data-discount and data-name.
 */
export default function CollectionSorter({
  total,
  children,
}: {
  total: number;
  children: React.ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState('featured');
  const [inStock, setInStock] = useState(false);
  const [shown, setShown] = useState(total);

  // Adopt whatever the URL already says, once, after hydration.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSort = params.get('sort');
    if (urlSort && SORT_OPTIONS.some((o) => o.value === urlSort)) setSort(urlSort);
    if (params.get('stock') === 'in') setInStock(true);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-product]'));
    const num = (el: HTMLElement, key: string) => Number(el.dataset[key] ?? 0);

    const compare = (a: HTMLElement, b: HTMLElement) => {
      switch (sort) {
        case 'price-asc':
          return num(a, 'price') - num(b, 'price');
        case 'price-desc':
          return num(b, 'price') - num(a, 'price');
        case 'discount':
          return num(b, 'discount') - num(a, 'discount');
        case 'name':
          return (a.dataset.name ?? '').localeCompare(b.dataset.name ?? '');
        default:
          // "Featured": in stock first, then discounted, then alphabetical —
          // the same order the server already emitted.
          return (
            num(b, 'available') - num(a, 'available') ||
            num(b, 'discount') - num(a, 'discount') ||
            (a.dataset.name ?? '').localeCompare(b.dataset.name ?? '')
          );
      }
    };

    const visible = cards.filter((c) => !inStock || c.dataset.available === '1');
    visible.sort(compare);

    for (const card of cards) {
      const rank = visible.indexOf(card);
      card.hidden = rank === -1;
      // `order` reflows grid items without touching the DOM tree, so React's
      // ownership of the server-rendered children is never violated.
      card.style.order = rank === -1 ? '' : String(rank);
    }
    setShown(visible.length);
  }, [sort, inStock]);

  // Keep the URL shareable without a router navigation, which would re-render
  // the tree and throw away the DOM ordering above.
  const syncUrl = useCallback((nextSort: string, nextStock: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (nextSort === 'featured') params.delete('sort');
    else params.set('sort', nextSort);
    if (nextStock) params.set('stock', 'in');
    else params.delete('stock');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, []);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-3.5">
        <p className="text-[13.5px] text-ink-muted" aria-live="polite">
          Showing <span className="font-semibold text-ink">{shown}</span> of {total} products
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => {
                setInStock(e.target.checked);
                syncUrl(sort, e.target.checked);
              }}
              className="h-4 w-4 rounded border-ink/25 text-moss-600 focus:ring-moss-500"
            />
            In stock only
          </label>

          <label className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                syncUrl(e.target.value, inStock);
              }}
              className="rounded-lg border border-ink/15 bg-white py-1.5 pl-2.5 pr-8 text-[13.5px] font-medium text-ink focus:border-moss-500 focus:outline-none focus:ring-1 focus:ring-moss-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div ref={gridRef}>{children}</div>
    </>
  );
}
