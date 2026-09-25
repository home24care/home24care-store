/**
 * The editorial band's illustration: a cylinder's markings, drawn as a
 * technical callout.
 *
 * The copy beside it is about what stays intact on a factory-sealed cylinder —
 * DOT stamp, batch number, safety data — so the picture shows those markings
 * being read rather than showing another cylinder photograph. It is a
 * different idea from the hero on purpose; two drawings of the same tank on
 * one page would look like a mistake.
 *
 * The scan line is the only motion, and it is slow. Like the hero, everything
 * stops under `prefers-reduced-motion`, and the whole graphic is decorative.
 */
export default function SealArtwork() {
  const callouts = [
    { y: 96, label: 'DOT-39 stamp' },
    { y: 150, label: 'Batch / fill date' },
    { y: 204, label: 'UN number' },
    { y: 258, label: 'Net weight' },
  ];

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 520 380" role="presentation" aria-hidden="true" className="h-auto w-full">
        <defs>
          <linearGradient id="sa-plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7fcfa" />
            <stop offset="100%" stopColor="#dcece6" />
          </linearGradient>
          <linearGradient id="sa-tank" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2b7a66" />
            <stop offset="35%" stopColor="#bdf0e0" />
            <stop offset="70%" stopColor="#6fc9b0" />
            <stop offset="100%" stopColor="#27705d" />
          </linearGradient>
          <linearGradient id="sa-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f3e6" stopOpacity="0" />
            <stop offset="50%" stopColor="#c8f3e6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#c8f3e6" stopOpacity="0" />
          </linearGradient>
          <clipPath id="sa-plate-clip">
            <rect x="34" y="60" width="180" height="258" rx="16" />
          </clipPath>
        </defs>

        {/* The cylinder, cropped by the frame so it reads as a detail view */}
        <g>
          <rect x="300" y="44" width="150" height="292" rx="30" fill="url(#sa-tank)" />
          <rect x="300" y="182" width="150" height="7" fill="#1d6353" opacity="0.45" />
          <rect x="300" y="182" width="150" height="2" fill="#dcf6ed" opacity="0.5" />
          {/* Seal band around the neck: the thing the copy is about */}
          <rect x="300" y="72" width="150" height="26" fill="#0f3b30" opacity="0.85" />
          <text
            x="375"
            y="90"
            textAnchor="middle"
            fontSize="11"
            letterSpacing="2.4"
            fill="#c8f3e6"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="700"
          >
            FACTORY SEALED
          </text>
        </g>

        {/* Spec plate */}
        <rect x="34" y="60" width="180" height="258" rx="16" fill="url(#sa-plate)" />
        <rect
          x="34"
          y="60"
          width="180"
          height="258"
          rx="16"
          fill="none"
          stroke="#0f3b30"
          strokeOpacity="0.18"
          strokeWidth="2"
        />

        {callouts.map((c, i) => (
          <g key={c.label}>
            {/* Row on the plate */}
            <rect x="52" y={c.y - 12} width="18" height="18" rx="4" fill="#1f9d55" opacity={0.18} />
            <path
              d={`M56 ${c.y - 3.5} l4 4 l7 -8`}
              fill="none"
              stroke="#1f9d55"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="80"
              y={c.y + 2}
              fontSize="11.5"
              fill="#12211c"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="600"
            >
              {c.label}
            </text>
            {/* Leader line out to the cylinder */}
            <path
              d={`M214 ${c.y - 4} H262 L300 ${76 + i * 62}`}
              fill="none"
              stroke="#8fd9c2"
              strokeOpacity="0.5"
              strokeWidth="1.6"
              strokeDasharray="4 4"
            />
            <circle cx="300" cy={76 + i * 62} r="3.5" fill="#c8f3e6" />
          </g>
        ))}

        {/* Scan line travelling down the plate */}
        <g clipPath="url(#sa-plate-clip)">
          <rect className="sa-scan" x="34" y="30" width="180" height="46" fill="url(#sa-scan)" />
        </g>
      </svg>

      <style>{`
        @keyframes sa-scan { 0% { transform: translateY(0); } 100% { transform: translateY(292px); } }
        .sa-scan { animation: sa-scan 6s cubic-bezier(.4,0,.6,1) infinite; }
        @media (prefers-reduced-motion: reduce) { .sa-scan { animation: none; opacity: 0; } }
      `}</style>
    </div>
  );
}
