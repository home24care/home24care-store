import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { CheckIcon } from './icons';

/**
 * The hero picture: three real cylinders from the catalogue, cut out of their
 * white studio backgrounds so they stand directly on the dark band.
 *
 * The cut-outs in /public/hero were upscaled with Real-ESRGAN before masking,
 * so the edges stay clean at 2x. They are 960px tall and the tallest one
 * renders at about 460 CSS px, which keeps them sharp on a retina screen.
 *
 * Motion, all in CSS so none of it waits on JavaScript:
 *   - each cylinder rises into place on load, a beat apart;
 *   - each then floats on its own period, so the three never move in step;
 *   - a highlight crosses each one, clipped to the cylinder's own outline by
 *     using the photo as a mask, so it reads as light on the metal rather
 *     than a stripe over the picture;
 *   - the contact shadows stay on the floor and shrink as a cylinder rises.
 * `prefers-reduced-motion` stops all of it and leaves the still composition.
 *
 * The photos are decorative (`alt=""`). The heading beside them says what the
 * store sells, and the price chip below carries the text for the one product
 * it links to.
 */

type Cylinder = {
  src: string;
  /** Position and size, as percentages of the stage. */
  left: string;
  bottom: string;
  height: string;
  z: number;
  /** Entrance delay and float timing, so no two cylinders move together. */
  enter: string;
  period: string;
  phase: string;
  priority?: boolean;
};

const CYLINDERS: Cylinder[] = [
  { src: '/hero/cyl-r410a.webp', left: '1%', bottom: '15%', height: '63%', z: 1, enter: '.15s', period: '7.2s', phase: '-2.4s' },
  { src: '/hero/cyl-r404a.webp', left: '65%', bottom: '15%', height: '63%', z: 1, enter: '.3s', period: '7.8s', phase: '-4.6s' },
  { src: '/hero/cyl-r32.webp', left: '27%', bottom: '5%', height: '85%', z: 2, enter: '0s', period: '6.4s', phase: '0s', priority: true },
];

/** Cut-outs are ~0.57 wide per unit of height; used to size each frame. */
const ASPECT = 556 / 960;

export default function HeroCylinders({
  feature,
}: {
  /** The product the price chip links to. Omitted if it is not in the catalogue. */
  feature?: { href: string; label: string; price: number };
}) {
  return (
    <div className="hc-stage relative mx-auto aspect-[10/9] w-full max-w-[560px] select-none">
      {/* Backdrop: a glow for the cylinders to stand in, and a slow dashed
          orbit so the space behind them is not completely still. */}
      <div
        className="absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgba(143,217,194,0.30),rgba(143,217,194,0.08)_60%,transparent)]"
        aria-hidden="true"
      />
      <svg className="hc-orbit absolute inset-[3%] h-[94%] w-[94%]" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(200,243,230,0.22)" strokeWidth="0.35" strokeDasharray="1.2 2.4" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(200,243,230,0.12)" strokeWidth="0.3" />
      </svg>

      {/* Cold vapour drifting upward: small, slow, and few. */}
      <div className="absolute inset-0" aria-hidden="true">
        {[12, 30, 47, 63, 80, 90].map((x, i) => (
          <span
            key={x}
            className="hc-mote absolute bottom-[18%] block h-1.5 w-1.5 rounded-full bg-moss-100/60"
            style={{ left: `${x}%`, animationDelay: `${i * -1.3}s`, animationDuration: `${7 + (i % 3)}s` }}
          />
        ))}
      </div>

      {CYLINDERS.map((c) => (
        <div
          key={c.src}
          className="hc-enter absolute"
          style={{
            left: c.left,
            bottom: c.bottom,
            height: c.height,
            aspectRatio: `${ASPECT}`,
            zIndex: c.z,
            animationDelay: c.enter,
          }}
        >
          {/* Floor shadow: outside the floating element, so it stays put. */}
          <span
            className="hc-shadow absolute -bottom-[3%] left-[8%] h-[7%] w-[84%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(4,20,15,0.55),transparent)]"
            style={{ animationDuration: c.period, animationDelay: c.phase }}
            aria-hidden="true"
          />
          <div
            className="hc-float relative h-full w-full"
            style={{ animationDuration: c.period, animationDelay: c.phase }}
          >
            <Image
              src={c.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 260px, 45vw"
              unoptimized
              priority={c.priority}
              className="object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]"
            />
            <span
              className="hc-sheen absolute inset-0"
              style={{ WebkitMaskImage: `url(${c.src})`, maskImage: `url(${c.src})` }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}

      {/* A plain statement of the policy the page already makes. */}
      <span className="hc-chip absolute right-[2%] top-[4%] z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md [animation-delay:.9s]">
        <CheckIcon className="h-3.5 w-3.5 text-clay-300" />
        Factory sealed
      </span>

      {feature ? (
        <Link
          href={feature.href}
          className="hc-chip group absolute bottom-[1%] left-[0%] z-10 flex items-center gap-3 rounded-2xl bg-white/95 py-2.5 pl-3 pr-4 shadow-lift backdrop-blur transition-shadow [animation-delay:1.1s] hover:shadow-xl sm:left-[2%]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#43c6e8]/15 text-[11px] font-bold text-[#0b7ea3]">
            R-32
          </span>
          <span className="leading-tight">
            <span className="block text-[12.5px] font-medium text-ink-soft group-hover:text-moss-700">
              {feature.label}
            </span>
            <span className="block text-[15px] font-bold tabular-nums text-ink">
              {formatPrice(feature.price)}
            </span>
          </span>
        </Link>
      ) : null}

      <style>{`
        @keyframes hc-enter  { from { opacity: 0; transform: translateY(46px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes hc-float  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3.5%); } }
        @keyframes hc-shadow { 0%,100% { transform: scaleX(1); opacity: 1; } 50% { transform: scaleX(.86); opacity: .6; } }
        @keyframes hc-sheen  { 0% { background-position: 160% 0; } 55%,100% { background-position: -60% 0; } }
        @keyframes hc-orbit  { to { transform: rotate(360deg); } }
        @keyframes hc-mote   { 0% { transform: translateY(0) scale(.6); opacity: 0; } 20% { opacity: .9; } 100% { transform: translateY(-260px) scale(1.4); opacity: 0; } }
        @keyframes hc-chip   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

        .hc-enter  { animation: hc-enter 1s cubic-bezier(.2,.8,.2,1) both; }
        .hc-float  { animation: hc-float 6.4s ease-in-out infinite; will-change: transform; }
        .hc-shadow { animation: hc-shadow 6.4s ease-in-out infinite; }
        .hc-sheen  {
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.42) 50%, transparent 62%);
          background-size: 260% 100%;
          -webkit-mask-size: contain; mask-size: contain;
          -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
          -webkit-mask-position: center; mask-position: center;
          animation: hc-sheen 7s ease-in-out infinite;
        }
        .hc-orbit  { animation: hc-orbit 90s linear infinite; transform-origin: center; }
        .hc-mote   { animation: hc-mote 8s ease-out infinite; }
        .hc-chip   { animation: hc-chip .6s cubic-bezier(.2,.8,.2,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .hc-enter, .hc-float, .hc-shadow, .hc-sheen, .hc-orbit, .hc-mote, .hc-chip { animation: none; }
          .hc-mote, .hc-sheen { display: none; }
        }
      `}</style>
    </div>
  );
}
