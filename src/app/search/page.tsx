import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { ProductGrid } from '@/components/Section';
import Breadcrumbs from '@/components/Breadcrumbs';
import { search, collections } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the Home24Care catalog.',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const results = search(query);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs trail={[{ name: 'Search', url: '/search' }]} />

      <header className="max-w-3xl pb-8">
        <h1 className="font-display text-[32px] leading-tight tracking-tight sm:text-[40px]">
          {query ? <>Results for “{query}”</> : 'Search'}
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          {!query
            ? 'Type at least two characters to search the catalog.'
            : results.length > 0
              ? `${results.length} ${results.length === 1 ? 'product' : 'products'} found.`
              : 'No products matched that search.'}
        </p>
      </header>

      <form action="/search" className="mb-10 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Try “gazebo”, “R-410A” or “swing set”"
          aria-label="Search products"
          className="field"
        />
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      {results.length > 0 ? (
        <ProductGrid>
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </ProductGrid>
      ) : (
        <div>
          <p className="mb-5 text-[15px] font-semibold">Browse a collection instead</p>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-ink/15 px-4 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-moss-500 hover:bg-moss-50 hover:text-moss-800"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
