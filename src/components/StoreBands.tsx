import Link from 'next/link';
import { site } from '@/lib/site';
import { TruckIcon, ShieldIcon, SupportIcon, LockIcon, ReturnIcon, BoxIcon, SparkIcon } from './icons';

/** Centred section heading in the hobby-shop style: green eyebrow, serif caps. */
export function CenteredHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto mb-9 max-w-3xl text-center">
      {eyebrow && <p className={`eyebrow mb-2 ${light ? 'text-moss-300' : ''}`}>{eyebrow}</p>}
      <h2 className={`section-title ${light ? 'text-white' : ''}`}>{title}</h2>
      {subtitle && (
        <p className={`mt-3 text-[15px] font-medium leading-relaxed ${light ? 'text-white/75' : 'text-ink-soft'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

const TICKER = [
  [TruckIcon, 'Free U.S. shipping on all orders'],
  [ShieldIcon, '100% authentic, factory-sealed products'],
  [BoxIcon, 'Tracking number sent within 24 hours'],
  [ReturnIcon, `Hassle-free ${site.returns.windowDays}-day returns on sealed product`],
  [SupportIcon, 'Real support from collectors, 7 days a week'],
] as const;

/** The scrolling reassurance strip, duplicated once so the loop is seamless. */
export function TrustTicker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-white py-3.5" aria-label="Store promises">
      <ul className="flex w-max animate-marquee items-center gap-4 motion-reduce:animate-none">
        {items.map(([Icon, label], i) => (
          <li
            key={i}
            aria-hidden={i >= TICKER.length}
            className="flex shrink-0 items-center gap-3 rounded-full border border-ink/10 bg-sand py-2 pl-2 pr-5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-moss-400">
              <Icon className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap text-[13.5px] font-semibold text-ink">{label}</span>
            <span className="ml-3 h-1.5 w-1.5 rounded-full bg-moss-300" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}

const ADVANTAGES = [
  [TruckIcon, 'Premium Shipping', 'Bubble-wrapped and double-boxed in rigid cartons to protect every seal.'],
  [ShieldIcon, '100% Authenticity', 'Every box is genuine, brand new and factory sealed — guaranteed.'],
  [SupportIcon, 'Expert Support', 'We are collectors too. Real answers, seven days a week.'],
  [LockIcon, 'Secure Payments', 'Encrypted checkout through a PCI DSS Level 1 processor.'],
] as const;

/** Four outlined boxes with a round icon badge riding the top edge. */
export function AdvantageGrid() {
  return (
    <section className="container-page py-16">
      <CenteredHeading
        eyebrow="Certified authenticity"
        title={`The ${site.name} advantage`}
        subtitle={`At ${site.name} we put the authenticity and security of every box first — the professional standard serious collectors deserve, from rare hits to factory-sealed hobby cases.`}
      />
      <div className="grid gap-x-5 gap-y-12 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {ADVANTAGES.map(([Icon, title, body]) => (
          <div key={title} className="relative rounded-md border border-ink/12 bg-white px-6 pb-7 pt-10 text-center">
            <span className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-sand text-moss-500">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="font-display text-[16px] uppercase tracking-[0.04em] text-ink">{title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The "Elevate your collection" band that closes every page above the footer. */
export function ElevateBand() {
  return (
    <section className="container-page pb-10">
      <div className="rounded-md bg-sand px-6 py-9 sm:px-10">
        <span className="inline-block rounded bg-moss-400 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Premium hobby shop
        </span>
        <h2 className="mt-4 font-display text-[24px] uppercase leading-tight tracking-[0.02em] text-ink sm:text-[30px]">
          Elevate your collection with <span className="text-moss-400">{site.name}</span>
        </h2>
        <p className="mt-2 text-[14.5px] font-semibold text-ink-soft">
          Expertly curated NFL, NBA, MLB, soccer and UFC hobby boxes, plus Pokémon and Magic: The Gathering. 100% authenticity guaranteed.
        </p>
      </div>
    </section>
  );
}

const BRANDS = ['Topps', 'Bowman', 'Panini', 'Pokémon', 'Magic: The Gathering'];

/** Text wordmarks of the manufacturers we stock. */
export function BrandStrip() {
  return (
    <section className="container-page pb-14">
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 border-y border-ink/10 py-7">
        {BRANDS.map((b) => (
          <span key={b} className="flex items-center gap-2 font-display text-[19px] font-semibold uppercase tracking-[0.08em] text-ink/55">
            <SparkIcon className="h-3.5 w-3.5 text-moss-400" />
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}

/** Dark call-to-action strip linking the collectors' essentials. */
export function ShopAllLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-10 text-center">
      <Link href={href} className="btn-primary px-8 py-3.5">
        {label}
      </Link>
    </div>
  );
}
