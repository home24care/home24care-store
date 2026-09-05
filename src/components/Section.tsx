import Link from 'next/link';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = 'View all',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="font-display text-[30px] leading-[1.15] tracking-tight text-ink sm:text-[38px]">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 whitespace-nowrap border-b border-moss-600/40 pb-0.5 text-sm font-semibold text-moss-700 transition-colors hover:border-moss-700 hover:text-moss-800"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
      {children}
    </div>
  );
}
