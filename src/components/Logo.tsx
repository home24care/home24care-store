import { site } from '@/lib/site';

/** The brand mark, inline so it stays crisp at any size and needs no request. */
export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1f2a24" />
      <rect x="15" y="12" width="26" height="36" rx="3.5" fill="#79b38a" transform="rotate(-12 32 34)" />
      <g transform="rotate(9 32 34)">
        <rect x="23" y="15" width="26" height="36" rx="3.5" fill="#fff" />
        <rect x="26" y="18" width="20" height="22" rx="2" fill="#d9a83d" />
        <path d="M36 22.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#fff" />
        <rect x="26" y="43" width="14" height="2.4" rx="1.2" fill="#1f2a24" />
      </g>
    </svg>
  );
}

/** Mark + wordmark, in the stacked "name / sub-line" style of hobby shops. */
export default function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const mark = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const word = size === 'lg' ? 'text-[30px]' : size === 'sm' ? 'text-[20px]' : 'text-[24px]';
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={mark} />
      <span className="flex flex-col leading-none">
        <span className={`font-display ${word} font-bold tracking-[0.04em] ${light ? 'text-white' : 'text-ink'}`}>
          {site.name}
        </span>
        <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.34em] text-moss-500">
          Sports Card Store
        </span>
      </span>
    </span>
  );
}
