'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { site } from '@/lib/site';
import { formatPrice } from '@/lib/format';
import Logo from './Logo';
import { CartIcon, SearchIcon, MenuIcon, CloseIcon, ChevronIcon, PhoneIcon, MailIcon } from './icons';

type NavGroup = { group: string; collections: { slug: string; title: string; tagline: string; count: number }[] };

/** Secondary links, shown after the categories in the centred nav row. */
const PAGE_LINKS = [
  ['/order-status', 'Order Status'],
  ['/about', 'About Us'],
  ['/contact', 'Contact Us'],
  ['/faq', 'FAQ’s'],
] as const;

export default function Header({ groups }: { groups: NavGroup[] }) {
  const { count, open, hydrated, subtotal } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  const categories = groups.flatMap((g) => g.collections);

  useEffect(() => setMounted(true), []);

  // Any navigation should dismiss every transient surface.
  useEffect(() => {
    setMenuOpen(false);
    setShopOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShopOpen(false);
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  // Small delay on close so the pointer can cross the gap into the panel.
  const hoverOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setShopOpen(false), 140);
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));
  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`relative whitespace-nowrap px-2.5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:text-moss-500 ${
        isActive(href) ? 'text-ink after:absolute after:inset-x-2.5 after:bottom-2.5 after:h-[2px] after:bg-moss-400' : 'text-ink-soft'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Announcement bar */}
      <div className="bg-moss-400 text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11.5px] font-semibold uppercase tracking-[0.08em]">
          <p>Free shipping on all U.S. orders</p>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/order-status" className="hover:text-moss-50">
              Track order
            </Link>
            <span className="h-3 w-px bg-white/40" aria-hidden="true" />
            <Link href="/contact" className="hover:text-moss-50">
              Contact us
            </Link>
            <span className="h-3 w-px bg-white/40" aria-hidden="true" />
            <Link href="/faq" className="hover:text-moss-50">
              FAQs
            </Link>
          </div>
        </div>
      </div>

      {/* Contact / logo / actions */}
      <div className="border-b border-ink/10">
        <div className="container-page grid h-[74px] grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-7">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 rounded-lg p-2 text-ink xl:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <a href={`tel:${site.contact.phoneHref}`} className="hidden items-center gap-3 lg:flex">
              <PhoneIcon className="h-7 w-7 text-moss-400" />
              <span className="leading-tight">
                <span className="block text-[12.5px] font-semibold text-ink">Call us</span>
                <span className="block text-[12.5px] text-ink-muted">{site.contact.phone}</span>
              </span>
            </a>
            <a href={`mailto:${site.contact.email}`} className="hidden items-center gap-3 2xl:flex">
              <MailIcon className="h-7 w-7 text-moss-400" />
              <span className="leading-tight">
                <span className="block text-[12.5px] font-semibold text-ink">Any questions</span>
                <span className="block text-[12.5px] text-ink-muted">{site.contact.email}</span>
              </span>
            </a>
          </div>

          <Link href="/" className="justify-self-center" aria-label={`${site.name} home`}>
            <span className="hidden sm:block">
              <Logo />
            </span>
            <span className="sm:hidden">
              <Logo size="sm" />
            </span>
          </Link>

          <div className="flex items-center justify-end gap-1">
            <form onSubmit={submitSearch} className="hidden xl:block">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search boxes…"
                  aria-label="Search products"
                  className="w-44 rounded border border-ink/15 bg-white py-2 pl-9 pr-3 text-[13px] transition-[width] placeholder:text-ink-muted focus:w-60 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
                />
              </div>
            </form>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2.5 text-ink hover:bg-moss-50 xl:hidden"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              onClick={open}
              className="relative flex items-center gap-2 rounded-lg p-2.5 text-ink hover:bg-moss-50"
              aria-label={`Open cart${hydrated && count ? `, ${count} items` : ''}`}
            >
              <span className="relative">
                <CartIcon className="h-6 w-6" />
                <span className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-moss-400 px-1 text-[10px] font-bold leading-none text-white">
                  {hydrated ? (count > 99 ? '99+' : count) : 0}
                </span>
              </span>
              <span className="hidden text-[13px] font-semibold tabular-nums sm:inline">
                {formatPrice(hydrated ? subtotal : 0)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Centred navigation row */}
      <nav className="relative hidden border-b border-ink/10 xl:block" aria-label="Main">
        <div className="container-page flex items-center justify-center">
          {navLink('/', 'Home')}
          <div onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
            <button
              type="button"
              onClick={() => setShopOpen((v) => !v)}
              aria-expanded={shopOpen}
              className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:text-moss-500 ${
                shopOpen || pathname?.startsWith('/collections') ? 'text-ink' : 'text-ink-soft'
              }`}
            >
              Shop
              <ChevronIcon className={`h-3 w-3 transition-transform ${shopOpen ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          </div>
          {categories.map((c) => navLink(`/collections/${c.slug}`, c.title.replace('Magic: The Gathering', 'Magic')))}
          <span className="mx-2 h-4 w-px bg-ink/15" aria-hidden="true" />
          {PAGE_LINKS.map(([href, label]) => navLink(href, label))}
        </div>

        {shopOpen && (
          <div
            className="absolute inset-x-0 top-full border-t border-ink/10 bg-white shadow-lift"
            onMouseEnter={hoverOpen}
            onMouseLeave={hoverClose}
          >
            <div className="container-page grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.1fr)] gap-8 py-8">
              {groups.map((g) => (
                <div key={g.group} className={g.collections.length > 4 ? 'col-span-2' : ''}>
                  <p className="eyebrow mb-3">{g.group}</p>
                  <div className={g.collections.length > 4 ? 'grid grid-cols-2 gap-x-6' : ''}>
                    {g.collections.map((c) => (
                      <Link key={c.slug} href={`/collections/${c.slug}`} className="group block rounded-md py-2">
                        <span className="flex items-baseline gap-2">
                          <span className="font-display text-[16px] text-ink group-hover:text-moss-500">{c.title}</span>
                          <span className="text-[11px] text-ink-muted">{c.count}</span>
                        </span>
                        <span className="block text-[12.5px] leading-snug text-ink-muted">{c.tagline}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-moss-900 p-6 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-400">Shop the drops</p>
                <ul className="mt-3 space-y-2 font-display text-[16px]">
                  <li><Link href="/collections/best-sellers" className="hover:text-moss-300">High demand</Link></li>
                  <li><Link href="/collections/limited-releases" className="hover:text-moss-300">Limited releases</Link></li>
                  <li><Link href="/collections/new-arrivals" className="hover:text-moss-300">New releases</Link></li>
                  <li><Link href="/collections" className="hover:text-moss-300">All categories →</Link></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 animate-fade-in bg-white p-3 shadow-lift xl:hidden">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boxes…"
                aria-label="Search products"
                className="field pl-9"
              />
            </div>
            <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost" aria-label="Close search">
              <CloseIcon />
            </button>
          </form>
        </div>
      )}

      {/*
        Portalled to <body>: a fixed drawer rendered inside the sticky header
        would be clipped to the header's containing block on some browsers.
      */}
      {mounted &&
        menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[70] xl:hidden">
            <div
              className="absolute inset-0 animate-fade-in bg-ink/45"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col bg-white">
              <div className="flex h-16 items-center justify-between border-b border-ink/10 px-4">
                <Logo size="sm" />
                <button type="button" onClick={() => setMenuOpen(false)} className="btn-ghost" aria-label="Close menu">
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 py-3">
                <Link href="/" className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold uppercase tracking-[0.05em] text-ink hover:bg-moss-50">
                  Home
                </Link>
                {groups.map((g) => (
                  <div key={g.group} className="mt-3">
                    <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-moss-500">
                      {g.group}
                    </p>
                    {g.collections.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/collections/${c.slug}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-moss-50"
                      >
                        {c.title}
                        <span className="text-xs text-ink-muted">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="mt-3 border-t border-ink/10 pt-3">
                  {[
                    ['/collections/best-sellers', 'High demand'],
                    ['/collections/limited-releases', 'Limited releases'],
                    ...PAGE_LINKS,
                  ].map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-moss-50"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="space-y-1.5 border-t border-ink/10 p-4 text-sm text-ink-soft">
                <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2 font-semibold text-ink">
                  <PhoneIcon className="h-4 w-4 text-moss-400" />
                  {site.contact.phone}
                </a>
                <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-moss-400" />
                  {site.contact.email}
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
