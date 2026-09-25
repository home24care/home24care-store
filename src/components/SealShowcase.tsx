'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CheckIcon } from './icons';

/**
 * The editorial band's picture: a real photograph of sealed cartons on a
 * pallet, with a real cylinder standing in front of the frame.
 *
 * The copy beside it is about what arrives intact — DOT stamp, batch number,
 * safety data — so those markings are called out over the photo, one after
 * another, once the section scrolls into view.
 *
 * The reveal is progressive enhancement. The server renders every callout
 * visible, so the section is complete without JavaScript. On mount, if the
 * section is still below the fold, the callouts are hidden ("armed") and
 * brought back in sequence when it arrives. If it is already on screen they
 * are simply left showing.
 *
 * Other motion: a slow Ken Burns drift on the photo, a band of light passing
 * across it, and the cylinder floating on its own shadow. All of it stops
 * under `prefers-reduced-motion`.
 */

const CALLOUTS = ['DOT-39 stamp', 'Batch & fill date', 'UN number', 'Net weight'];

export default function SealShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'static' | 'armed' | 'shown'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already visible: leave as rendered

    setState('armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('shown');
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-state={state} className="ss-root relative mx-auto w-full max-w-[580px] pb-8 pl-[10%] sm:pb-10">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <Image
          src="/hero/pallet-sealed.webp"
          alt="Factory-sealed refrigerant cartons stacked on a pallet"
          fill
          sizes="(min-width: 1024px) 520px, 90vw"
          unoptimized
          loading="lazy"
          className="ss-kenburns object-cover"
        />
        <span className="ss-scan pointer-events-none absolute inset-y-0 w-[28%]" aria-hidden="true" />

        <ul className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
          {CALLOUTS.map((label, i) => (
            <li
              key={label}
              className="ss-callout flex items-center gap-2 rounded-full bg-moss-900/85 py-1.5 pl-2 pr-3 text-[12px] font-semibold text-white shadow-lg backdrop-blur sm:text-[12.5px]"
              style={{ animationDelay: `${0.25 + i * 0.22}s` }}
            >
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-clay-300/20">
                <span className="ss-ping absolute inset-0 rounded-full bg-clay-300/40" style={{ animationDelay: `${0.25 + i * 0.22}s` }} />
                <CheckIcon className="relative h-3.5 w-3.5 text-clay-300" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* The cylinder stands in front of the frame, overlapping its edge,
          so the photo reads as a place and the cylinder as the product. */}
      <div className="absolute bottom-0 left-0 h-[70%] w-[34%]" aria-hidden="true">
        <span className="ss-shadow absolute -bottom-[2%] left-[10%] h-[7%] w-[80%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(4,20,15,0.6),transparent)]" />
        <div className="ss-float relative h-full w-full">
          <Image
            src="/hero/cyl-r507.webp"
            alt=""
            fill
            sizes="200px"
            unoptimized
            loading="lazy"
            className="object-contain object-bottom drop-shadow-[0_16px_24px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      <style>{`
        @keyframes ss-kenburns { from { transform: scale(1.02) translate(0,0); } to { transform: scale(1.12) translate(-2%,-1.5%); } }
        @keyframes ss-scan     { 0% { transform: translateX(-120%); } 60%,100% { transform: translateX(460%); } }
        @keyframes ss-float    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4%); } }
        @keyframes ss-shadow   { 0%,100% { transform: scaleX(1); opacity: 1; } 50% { transform: scaleX(.85); opacity: .6; } }
        @keyframes ss-in       { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
        @keyframes ss-ping     { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(2.1); opacity: 0; } }

        .ss-kenburns { animation: ss-kenburns 22s ease-in-out infinite alternate; }
        .ss-scan {
          left: 0;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent);
          mix-blend-mode: soft-light;
          animation: ss-scan 7s ease-in-out infinite;
        }
        .ss-float  { animation: ss-float 6.8s ease-in-out infinite; }
        .ss-shadow { animation: ss-shadow 6.8s ease-in-out infinite; }

        .ss-root[data-state='armed'] .ss-callout { opacity: 0; }
        .ss-root[data-state='shown'] .ss-callout { animation: ss-in .55s cubic-bezier(.2,.8,.2,1) both; }
        .ss-root[data-state='shown'] .ss-ping    { animation: ss-ping 1.1s ease-out 1 both; }
        .ss-ping { opacity: 0; }

        @media (prefers-reduced-motion: reduce) {
          .ss-kenburns, .ss-scan, .ss-float, .ss-shadow, .ss-callout, .ss-ping { animation: none !important; }
          .ss-scan { display: none; }
        }
      `}</style>
    </div>
  );
}
