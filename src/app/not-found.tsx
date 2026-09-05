import Link from 'next/link';
import { collections } from '@/lib/catalog';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-[36px] leading-tight tracking-tight sm:text-[46px]">
        We could not find that page
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-ink-soft">
        The link may be out of date, or the product may have been renamed. Try a collection
        below, or search the catalog.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-7 py-3.5">
          Back to home
        </Link>
        <Link href="/collections" className="btn-outline px-7 py-3.5">
          Browse collections
        </Link>
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2">
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
  );
}
