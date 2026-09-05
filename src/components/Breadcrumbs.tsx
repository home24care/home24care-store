import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbSchema } from '@/lib/schema';

export type Crumb = { name: string; url: string };

export default function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', url: '/' }, ...trail])} />
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-muted">
          <li>
            <Link href="/" className="hover:text-moss-700">
              Home
            </Link>
          </li>
          {trail.map((c, i) => (
            <li key={c.url} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {i === trail.length - 1 ? (
                <span className="font-medium text-ink-soft" aria-current="page">
                  {c.name}
                </span>
              ) : (
                <Link href={c.url} className="hover:text-moss-700">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
