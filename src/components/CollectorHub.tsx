'use client';

import { useState } from 'react';
import type { Product } from '@/lib/catalog';
import ProductCard from './ProductCard';

type Tab = { key: string; label: string; products: Product[] };

/** The tabbed product grid under "Elevate your collection". */
export default function CollectorHub({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label="Product groups" className="mb-9 flex flex-wrap justify-center gap-x-8 gap-y-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === current.key}
            onClick={() => setActive(t.key)}
            className={`border-b-2 pb-1 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              t.key === current.key
                ? 'border-moss-400 text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
        {current.products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
