/**
 * The hero illustration: a refrigerant cylinder, drawn rather than photographed.
 *
 * Every product photograph available to this store tops out at 1100px, and the
 * hero is a 1920px band — so a photo here is always an upscale, which is what
 * made the previous version visibly soft. Vector has no resolution, so this is
 * sharp on a 4K display and still weighs a few kB.
 *
 * Motion is deliberately small: a slow rise and fall, a highlight that drifts
 * across the steel, and vapour lifting off the valve. A hero that jitters
 * pulls attention away from the headline sitting next to it.
 *
 * All of it is disabled under `prefers-reduced-motion`, and the whole thing is
 * `aria-hidden` — it is decoration beside a heading that already says what the
 * store sells, so announcing it would only add noise for a screen reader.
 */
export default function HeroArtwork({ label = 'R-410A' }: { label?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <svg
        viewBox="0 0 420 520"
        role="presentation"
        aria-hidden="true"
        className="h-auto w-full overflow-visible"
      >
        <defs>
          {/* Steel body. Three stops rather than two: the narrow light band is
              what reads as a curved surface instead of a flat rectangle. */}
          <linearGradient id="ha-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2f8a74" />
            <stop offset="16%" stopColor="#6fc9b0" />
            <stop offset="40%" stopColor="#c8f3e6" />
            <stop offset="62%" stopColor="#7fd3ba" />
            <stop offset="100%" stopColor="#2b7a66" />
          </linearGradient>

          <linearGradient id="ha-shoulder" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#337f6b" />
            <stop offset="45%" stopColor="#b6ecdc" />
            <stop offset="100%" stopColor="#2f7663" />
          </linearGradient>

          <linearGradient id="ha-valve" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8a959b" />
            <stop offset="40%" stopColor="#e6eef1" />
            <stop offset="100%" stopColor="#6c777d" />
          </linearGradient>

          {/* The travelling highlight. Masked to the body so it cannot spill
              over the edges of the cylinder. */}
          <linearGradient id="ha-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="ha-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9fe8d2" stopOpacity="0.30" />
            <stop offset="70%" stopColor="#7fd9c0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7fd9c0" stopOpacity="0" />
          </radialGradient>

          <clipPath id="ha-clip">
            <path d="M118 176 h184 a26 26 0 0 1 26 26 v208 a34 34 0 0 1 -34 34 h-168 a34 34 0 0 1 -34 -34 v-208 a26 26 0 0 1 26 -26 z" />
          </clipPath>
        </defs>

        {/* Ambient glow behind the cylinder */}
        <ellipse cx="210" cy="300" rx="200" ry="220" fill="url(#ha-glow)" />

        <g className="ha-float">
          {/* Vapour off the valve */}
          <g className="ha-vapour" fill="#cfeee4">
            <circle cx="196" cy="126" r="7" opacity="0.5" />
            <circle cx="223" cy="116" r="5" opacity="0.4" style={{ animationDelay: '1.1s' }} />
            <circle cx="210" cy="132" r="4" opacity="0.45" style={{ animationDelay: '2.2s' }} />
          </g>

          {/* Valve stem and hand wheel */}
          <rect x="199" y="122" width="22" height="42" rx="5" fill="url(#ha-valve)" />
          <rect x="186" y="116" width="48" height="12" rx="6" fill="#d8e3e7" />
          <circle cx="210" cy="108" r="13" fill="none" stroke="#cfdade" strokeWidth="7" />

          {/* Collar guards, the two loops on a disposable cylinder */}
          <path
            d="M162 168 q-16 -46 10 -66 q8 -6 14 2 q6 8 -2 14 q-12 10 -2 44 z"
            fill="#86d8c0"
          />
          <path
            d="M258 168 q16 -46 -10 -66 q-8 -6 -14 2 q-6 8 2 14 q12 10 2 44 z"
            fill="#86d8c0"
          />

          {/* Shoulder */}
          <path d="M126 178 q84 -34 168 0 v18 h-168 z" fill="url(#ha-shoulder)" />

          {/* Body */}
          <path
            d="M118 176 h184 a26 26 0 0 1 26 26 v208 a34 34 0 0 1 -34 34 h-168 a34 34 0 0 1 -34 -34 v-208 a26 26 0 0 1 26 -26 z"
            fill="url(#ha-body)"
          />

          <g clipPath="url(#ha-clip)">
            {/* Weld seam around the middle */}
            <rect x="92" y="336" width="236" height="9" fill="#1d6353" opacity="0.45" />
            <rect x="92" y="336" width="236" height="3" fill="#a8e6d3" opacity="0.35" />
            {/* Drifting highlight */}
            <rect className="ha-sheen" x="-160" y="150" width="150" height="330" fill="url(#ha-sheen)" />
          </g>

          {/* Product label */}
          <ellipse cx="210" cy="252" rx="62" ry="40" fill="#f4fbf8" />
          <ellipse cx="210" cy="252" rx="56" ry="34" fill="none" stroke="#0f3b30" strokeWidth="3" />
          <text
            x="210"
            y="245"
            textAnchor="middle"
            fontSize="7.5"
            letterSpacing="1.6"
            fill="#0f3b30"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="700"
          >
            REFRIGERANT
          </text>
          <text
            x="210"
            y="268"
            textAnchor="middle"
            fontSize="21"
            fill="#0f3b30"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            letterSpacing="0.5"
          >
            {label}
          </text>

          {/* Hazard diamond — the marking that makes it read as a real cylinder */}
          <g transform="translate(210 366) rotate(45)">
            <rect x="-30" y="-30" width="60" height="60" rx="4" fill="#1f9d55" />
            <rect x="-25" y="-25" width="50" height="50" rx="2" fill="none" stroke="#f4fbf8" strokeWidth="2" />
          </g>
          <g transform="translate(210 366)">
            <g transform="rotate(-38)">
              <rect x="-16" y="-5" width="32" height="10" rx="5" fill="#f4fbf8" />
              <rect x="14" y="-2.5" width="5" height="5" rx="1.5" fill="#f4fbf8" />
            </g>
            <text
              x="0"
              y="21"
              textAnchor="middle"
              fontSize="8"
              fill="#f4fbf8"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="700"
            >
              2
            </text>
          </g>

          {/* Foot ring */}
          <path d="M112 438 h196 v6 a30 30 0 0 1 -30 30 h-136 a30 30 0 0 1 -30 -30 z" fill="#245f4f" />
        </g>

        {/* Contact shadow, kept separate so it does not rise with the cylinder */}
        <ellipse className="ha-shadow" cx="210" cy="486" rx="104" ry="13" fill="#04140f" opacity="0.4" />
      </svg>

      <style>{`
        @keyframes ha-float  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes ha-shadow { 0%,100% { transform: scaleX(1); opacity: .4; } 50% { transform: scaleX(.9); opacity: .26; } }
        @keyframes ha-sheen  { 0% { transform: translateX(0); } 100% { transform: translateX(620px); } }
        @keyframes ha-vapour {
          0%   { transform: translateY(0) scale(.6); opacity: 0; }
          25%  { opacity: .5; }
          100% { transform: translateY(-58px) scale(1.5); opacity: 0; }
        }
        .ha-float  { animation: ha-float 7s ease-in-out infinite; transform-origin: 210px 320px; }
        .ha-shadow { animation: ha-shadow 7s ease-in-out infinite; transform-origin: 210px 486px; transform-box: fill-box; }
        .ha-sheen  { animation: ha-sheen 9s ease-in-out infinite; }
        .ha-vapour circle { animation: ha-vapour 4.5s ease-out infinite; transform-origin: center; transform-box: fill-box; }
        @media (prefers-reduced-motion: reduce) {
          .ha-float, .ha-shadow, .ha-sheen, .ha-vapour circle { animation: none; }
          .ha-vapour { opacity: .35; }
        }
      `}</style>
    </div>
  );
}
