'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProductImage } from '@/lib/catalog';
import { BLUR_DATA_URL, SIZES, IMAGES_LOCALIZED } from '@/lib/image';
import { CloseIcon, ChevronIcon } from './icons';

export default function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[active] ?? images[0];

  // createPortal needs a document, which the server render does not have.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const step = useCallback(
    (delta: number) => setActive((i) => (i + delta + images.length) % images.length),
    [images.length]
  );

  /* --------------------------------------------------------------- zoomed */

  // Keep the page still behind the overlay, so dismissing it does not land the
  // reader somewhere else on the page.
  useEffect(() => {
    if (!zoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      // Keep tabbing inside the overlay; without this the reader tabs into the
      // page behind it, which is still there but inert to the eye.
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll<HTMLElement>('[data-lightbox] button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, step]);

  // Move focus in on open and hand it back on close, so the keyboard does not
  // lose its place.
  useEffect(() => {
    if (zoomed) closeRef.current?.focus();
    else openerRef.current?.focus({ preventScroll: true });
  }, [zoomed]);

  // Swipe between images on a touch screen. Only a decisive mostly-horizontal
  // drag counts, so a vertical scroll attempt is not read as a swipe.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {images.map((img, i) => (
            <li key={img.thumb + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand ring-offset-2 transition-all lg:h-[84px] lg:w-[84px] ${
                  i === active ? 'ring-2 ring-moss-600' : 'ring-1 ring-ink/10 hover:ring-ink/30'
                }`}
              >
                <Image
                  src={img.thumb}
                  alt=""
                  fill
                  sizes={SIZES.thumb}
                  unoptimized={IMAGES_LOCALIZED}
                  quality={70}
                  loading={i === 0 ? undefined : 'lazy'}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        ref={openerRef}
        onClick={() => setZoomed(true)}
        aria-label={`Open ${title} at full size`}
        className="group relative aspect-[4/3] flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-sand lg:aspect-square"
      >
        <Image
          key={current.full}
          src={current.full}
          alt={current.alt || title}
          fill
          // Only the first frame is LCP; later frames are user-initiated.
          priority={active === 0}
          sizes={SIZES.gallery}
          unoptimized={IMAGES_LOCALIZED}
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="animate-fade-in object-cover"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:opacity-100">
          View full image
        </span>
      </button>

      {mounted &&
        zoomed &&
        createPortal(
          <div
            data-lightbox
            className="fixed inset-0 z-[70] flex flex-col bg-ink/95"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} images`}
          >
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <p className="text-[13px] font-semibold tabular-nums">
                {active + 1} / {images.length}
              </p>
              <button
                type="button"
                ref={closeRef}
                onClick={() => setZoomed(false)}
                aria-label="Close full image"
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Dismiss by tapping the surround, the way a lightbox is expected
                to behave; the image itself keeps the tap so a mis-hit on it
                does not close the view. */}
            <div
              className="relative flex-1"
              onClick={() => setZoomed(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Image
                key={current.full}
                src={current.full}
                alt={current.alt || title}
                fill
                sizes={SIZES.lightbox}
                unoptimized={IMAGES_LOCALIZED}
                quality={90}
                // contain, not cover: the point of opening this is to see the
                // whole photograph rather than a crop of it.
                className="animate-fade-in object-contain p-2"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-center gap-4 px-4 pb-6 pt-3">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronIcon className="h-5 w-5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
