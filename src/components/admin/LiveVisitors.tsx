'use client';

import { useEffect, useState } from 'react';
import { countryName } from '@/lib/countries';
import type { LiveVisitor } from '@/lib/analytics/types';

/**
 * Live visitors: polls /api/admin/live every 15 seconds while the dashboard is
 * visible, and stops while the tab is hidden, so leaving it open costs nothing.
 * Visitors from excluded countries (Vietnam — the owner) are never stored, so
 * they never appear here.
 */
const POLL_MS = 15_000;

const CHANNEL_LABEL: Record<string, string> = {
  direct: 'Direct',
  organic_search: 'Organic',
  paid_search: 'Paid search',
  social: 'Social',
  paid_social: 'Paid social',
  email: 'Email',
  referral: 'Referral',
};

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function LiveVisitors({ excludedLabel }: { excludedLabel: string }) {
  const [visitors, setVisitors] = useState<LiveVisitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    // The first load always runs, so a dashboard opened in a background tab has
    // a number when you switch to it; after that, hidden tabs skip.
    let first = true;
    const load = async () => {
      if (!first && document.visibilityState !== 'visible') return;
      first = false;
      try {
        const res = await fetch('/api/admin/live', { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !data.ok) throw new Error(data.error ?? 'failed');
        setVisitors(data.visitors);
        setError(null);
      } catch {
        if (alive) setError('Could not refresh live visitors.');
      }
    };
    void load();
    const poll = window.setInterval(load, POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    document.addEventListener('visibilitychange', load);
    return () => {
      alive = false;
      window.clearInterval(poll);
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  const count = visitors?.length ?? 0;

  return (
    <section aria-labelledby="live-heading" className="flex h-full min-w-0 flex-col rounded-xl border border-ink/10 bg-white">
      <div className="border-b border-ink/10 p-5">
        <h2 id="live-heading" className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            {count > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-400 opacity-60" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${count > 0 ? 'bg-moss-500' : 'bg-ink/20'}`} />
          </span>
          Live now
        </h2>
        <p className="mt-2 font-display text-[40px] leading-none tabular-nums text-ink" aria-live="polite">
          {visitors === null ? '—' : count}
        </p>
        <p className="mt-1.5 text-[12.5px] text-ink-muted">
          {count === 1 ? 'visitor' : 'visitors'} in the last 5 minutes · {excludedLabel} excluded
        </p>
      </div>

      {error && <p className="px-5 pt-3 text-[12px] text-clay-700">{error}</p>}

      <ul className="min-h-0 flex-1 divide-y divide-ink/8 overflow-y-auto text-[13px] lg:max-h-[19rem]">
        {visitors !== null && count === 0 && <li className="p-5 text-ink-muted">Nobody on the site right now.</li>}
        {visitors?.map((v, i) => (
          <li key={`${v.lastSeen}-${i}`} className="min-w-0 px-5 py-2.5">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-ink">
                <span className="mr-1.5 font-mono text-[11px] text-ink-muted">{v.country ?? '??'}</span>
                {v.country ? countryName(v.country) : 'Unknown'}
              </span>
              <span className="shrink-0 text-[11.5px] tabular-nums text-ink-muted">{ago(now - v.lastSeen)}</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11.5px]">
              <span className="min-w-0 truncate font-mono text-ink-soft">{v.path}</span>
              {v.channel && (
                <span className="shrink-0 rounded border border-ink/12 px-1.5 py-px text-ink-soft">
                  {CHANNEL_LABEL[v.channel] ?? v.channel}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
