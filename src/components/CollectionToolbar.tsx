'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'name', label: 'Name: A–Z' },
] as const;

export default function CollectionToolbar({
  total,
  showing,
}: {
  total: number;
  showing: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = params.get('sort') ?? 'featured';
  const inStock = params.get('stock') === 'in';

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-3.5">
      <p className="text-[13.5px] text-ink-muted" aria-live="polite">
        Showing <span className="font-semibold text-ink">{showing}</span> of {total} products
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => update('stock', e.target.checked ? 'in' : null)}
            className="h-4 w-4 rounded border-ink/25 text-moss-600 focus:ring-moss-500"
          />
          In stock only
        </label>

        <label className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value === 'featured' ? null : e.target.value)}
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
  );
}
