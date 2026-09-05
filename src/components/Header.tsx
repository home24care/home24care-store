'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { site } from '@/lib/site';
import { CartIcon, SearchIcon, MenuIcon, CloseIcon, ChevronIcon, PhoneIcon } from './icons';

type NavGroup = { group: string; collections: { slug: string; title: string; tagline: string; count: number }[] };

export default function Header({ groups }: { groups: NavGroup[] }) {
  const { count, open, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Any navigation should dismiss every transient surface.
  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenGroup(null);
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
  const hoverOpen = (group: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(group);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {/* Announcement / trust bar */}
      <div className="bg-moss-800 text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[12.5px]">
          <p className="font-medium tracking-wide">
            Free standard shipping on every order · Ships in {site.shipping.handlingTime}
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/order-status" className="hover:text-moss-100">
              Track order
            </Link>
            <a
              href={`tel:${site.contact.phoneHref}`}
              className="flex items-center gap-1.5 hover:text-moss-100"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {site.contact.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="container-page flex h-[68px] items-center gap-4">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="-ml-2 rounded-lg p-2 text-ink lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${site.name} home`}>
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="font-display text-[21px] font-semibold leading-none tracking-tight text-ink">
            {site.name}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {groups.map((g) => (
            <div key={g.group} onMouseEnter={() => hoverOpen(g.group)} onMouseLeave={hoverClose}>
              <button
                type="button"
                onClick={() => setOpenGroup(openGroup === g.group ? null : g.group)}
                aria-expanded={openGroup === g.group}
                className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  openGroup === g.group ? 'bg-moss-50 text-moss-800' : 'text-ink hover:bg-moss-50'
                }`}
              >
                {g.group}
                <ChevronIcon
                  className={`h-3.5 w-3.5 transition-transform ${openGroup === g.group ? 'rotate-90' : ''}`}
                />
              </button>
            </div>
          ))}
          <Link href="/collections/sale" className="rounded-full px-3.5 py-2 text-sm font-semibold text-clay-700 hover:bg-clay-50">
            Sale
          </Link>
          <Link href="/about" className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink hover:bg-moss-50">
            About
          </Link>
          <Link href="/contact" className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink hover:bg-moss-50">
            Contact
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form onSubmit={submitSearch} className="hidden md:block">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search gazebos, swing sets, R-410A…"
                aria-label="Search products"
                className="w-52 rounded-full border border-ink/15 bg-sand py-2 pl-9 pr-3 text-sm transition-[width] placeholder:text-ink-muted focus:w-72 focus:border-moss-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-moss-500 lg:w-60"
              />
            </div>
          </form>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="rounded-lg p-2.5 text-ink hover:bg-moss-50 md:hidden"
            aria-label="Search"
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            onClick={open}
            className="relative rounded-lg p-2.5 text-ink hover:bg-moss-50"
            aria-label={`Open cart${hydrated && count ? `, ${count} items` : ''}`}
          >
            <CartIcon />
            {hydrated && count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-clay-600 px-1 text-[11px] font-bold leading-none text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {openGroup && (
        <div
          className="absolute inset-x-0 top-full hidden border-t border-ink/10 bg-white shadow-lift lg:block"
          onMouseEnter={() => hoverOpen(openGroup)}
          onMouseLeave={hoverClose}
        >
          <div className="container-page grid grid-cols-4 gap-x-8 gap-y-2 py-7">
            {groups
              .find((g) => g.group === openGroup)
              ?.collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="group rounded-xl p-3 transition-colors hover:bg-moss-50"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink group-hover:text-moss-800">{c.title}</span>
                    <span className="text-xs text-ink-muted">{c.count}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{c.tagline}</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 animate-fade-in bg-white p-3 shadow-lift md:hidden">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
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
        Portalled to <body> on purpose. The header sets `backdrop-blur`, and a
        backdrop-filter creates a containing block for `position: fixed`
        descendants — so rendering the drawer inside the header clipped it to
        the header's own ~104px height instead of the viewport. Everything
        below the fold was unreachable on mobile.
      */}
      {mounted &&
        menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[70] lg:hidden">
              <div
                className="absolute inset-0 animate-fade-in bg-ink/45"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col bg-white">
                <div className="flex h-16 items-center justify-between border-b border-ink/10 px-4">
                  <span className="font-display text-lg font-semibold">Browse</span>
                  <button type="button" onClick={() => setMenuOpen(false)} className="btn-ghost" aria-label="Close menu">
                    <CloseIcon />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-2 py-3">
                  {groups.map((g) => (
                    <div key={g.group} className="mb-4">
                      <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
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
                  <div className="border-t border-ink/10 pt-3">
                    {[
                      ['/collections/sale', 'Sale'],
                      ['/about', 'About us'],
                      ['/contact', 'Contact'],
                      ['/order-status', 'Track order'],
                      ['/faq', 'FAQs'],
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
                <div className="border-t border-ink/10 p-4 text-sm text-ink-soft">
                  <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2 font-semibold text-moss-800">
                    <PhoneIcon className="h-4 w-4" />
                    {site.contact.phone}
                  </a>
                  <p className="mt-1 text-[13px]">{site.contact.hours}</p>
                </div>
              </div>
          </div>,
          document.body
        )}

    </header>
  );
}
