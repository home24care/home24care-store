import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { DailyTotals, RankedRow } from '@/lib/analytics/types';

/* ------------------------------------------------------------ metric card */

const pct = (current: number, previous: number | null) => {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

export function MetricCard({
  label,
  value,
  previous,
  format = 'number',
  hint,
}: {
  label: string;
  value: number;
  previous?: number | null;
  format?: 'number' | 'money' | 'percent';
  hint?: string;
}) {
  const display =
    format === 'money'
      ? formatPrice(value)
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString('en-US');

  const change = previous === undefined ? null : pct(value, previous ?? null);

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1.5 text-[24px] font-bold leading-none tabular-nums text-ink">
        {display}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {change !== null ? (
          <span
            className={`font-semibold ${
              change > 0 ? 'text-moss-700' : change < 0 ? 'text-clay-700' : 'text-ink-muted'
            }`}
          >
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
        <span className="text-ink-muted">{hint ?? 'vs previous period'}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- line chart */

/**
 * Inline SVG rather than a charting library.
 *
 * The dashboard needs one time series; pulling in a chart package would add
 * more JS than the entire storefront ships. This also stays a server component,
 * so the chart costs no client JS at all.
 */
export function TimeSeries({
  series,
  metric,
  label,
  money = false,
}: {
  series: DailyTotals[];
  metric: keyof Omit<DailyTotals, 'date'>;
  label: string;
  money?: boolean;
}) {
  const values = series.map((d) => d[metric]);
  const peak = Math.max(...values);
  // Guard only the divisor. Using the guarded value as the reported peak made
  // an empty revenue chart claim a peak of $0.01.
  const max = Math.max(peak, 1);
  const width = 720;
  const height = 180;
  const padX = 8;
  const padY = 12;

  const step = series.length > 1 ? (width - padX * 2) / (series.length - 1) : 0;
  const y = (v: number) => height - padY - (v / max) * (height - padY * 2);

  const points = values.map((v, i) => `${padX + i * step},${y(v)}`);
  const line = points.join(' ');
  const area = `${padX},${height - padY} ${line} ${padX + (series.length - 1) * step},${height - padY}`;

  const total = values.reduce((a, b) => a + b, 0);
  const peakIndex = values.indexOf(Math.max(...values));

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-ink">{label}</h2>
        <p className="text-[13px] text-ink-muted">
          {money ? formatPrice(total) : total.toLocaleString('en-US')} total
          {series.length > 1 && (
            <>
              {' '}· peak {money ? formatPrice(peak) : peak.toLocaleString('en-US')} on{' '}
              {series[peakIndex]?.date ?? '—'}
            </>
          )}
        </p>
      </div>

      {total === 0 ? (
        <p className="py-14 text-center text-[13.5px] text-ink-muted">
          No {label.toLowerCase()} recorded in this period yet.
        </p>
      ) : series.length === 1 ? (
        // One day is a number, not a trend — a polyline needs two points.
        <p className="py-12 text-center">
          <span className="block text-[34px] font-bold leading-none tabular-nums text-ink">
            {money ? formatPrice(values[0]) : values[0].toLocaleString('en-US')}
          </span>
          <span className="mt-2 block text-[13px] text-ink-muted">
            so far today · pick a longer range to see a trend
          </span>
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-4 h-[180px] w-full"
            role="img"
            aria-label={`${label} over ${series.length} days, peaking at ${peak}`}
            preserveAspectRatio="none"
          >
            <polygon points={area} fill="#417456" fillOpacity="0.10" />
            <polyline
              points={line}
              fill="none"
              stroke="#2f5c43"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {values.map((v, i) => (
              <circle
                key={i}
                cx={padX + i * step}
                cy={y(v)}
                r="2.5"
                fill="#2f5c43"
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${series[i].date}: ${money ? formatPrice(v) : v}`}</title>
              </circle>
            ))}
          </svg>

          <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
            <span>{series[0]?.date}</span>
            <span>{series[series.length - 1]?.date}</span>
          </div>
        </>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- funnel */

export function Funnel({
  steps,
}: {
  steps: { label: string; count: number }[];
}) {
  const first = steps[0]?.count ?? 0;

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="text-[15px] font-semibold text-ink">Conversion funnel</h2>
      <p className="mt-0.5 text-[12.5px] text-ink-muted">
        Sessions that reached each stage — not event counts, so a visitor who
        views three products still counts once.
      </p>

      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => {
          const share = first > 0 ? (step.count / first) * 100 : 0;
          const prev = i > 0 ? steps[i - 1].count : null;
          const drop = prev && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : null;

          return (
            <li key={step.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                <span className="font-medium text-ink">{step.label}</span>
                <span className="tabular-nums text-ink-muted">
                  <span className="font-semibold text-ink">
                    {step.count.toLocaleString('en-US')}
                  </span>{' '}
                  · {share.toFixed(1)}%
                  {drop !== null && drop > 0 && (
                    <span className="ml-2 text-clay-700">−{drop}% from above</span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-moss-600"
                  style={{ width: `${Math.max(share, first > 0 && step.count > 0 ? 1.5 : 0)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ ranked list */

export function RankedList({
  title,
  subtitle,
  rows,
  unit,
  linkPrefix,
  emptyHint,
}: {
  title: string;
  subtitle?: string;
  rows: RankedRow[];
  unit: string;
  linkPrefix?: string;
  emptyHint?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}

      {rows.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink-muted">
          {emptyHint ?? 'Nothing recorded yet.'}
        </p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                <span className="min-w-0 truncate text-ink">
                  {linkPrefix ? (
                    <Link
                      href={`${linkPrefix}${row.key}`}
                      className="hover:text-moss-700 hover:underline"
                    >
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  <span className="font-semibold text-ink">
                    {row.count.toLocaleString('en-US')}
                  </span>{' '}
                  {unit}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-moss-500"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
