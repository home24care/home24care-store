/**
 * Trustpilot-style rating blocks: five squares, filled for the score.
 *
 * Trustpilot's own palette, so the widget and this self-hosted section read as
 * one thing rather than two different rating systems on the same page.
 */
const FILL = {
  1: '#ff3722',
  2: '#ff8622',
  3: '#ffce00',
  4: '#73cf11',
  5: '#00b67a',
} as const;

const EMPTY = '#dcdce6';

export default function ReviewStars({
  rating,
  size = 22,
  className,
  label,
}: {
  rating: number;
  size?: number;
  className?: string;
  /** Omit to render decoratively inside an element that already has a label. */
  label?: string;
}) {
  const rounded = Math.round(rating);
  const fill = FILL[(Math.min(5, Math.max(1, rounded)) as 1 | 2 | 3 | 4 | 5)];
  // A half-filled final block would misrepresent the score, so blocks are
  // whole and the numeric value beside them carries the precision.
  const filled = Math.floor(rating);
  const partial = rating - filled;

  return (
    <span
      className={`inline-flex gap-[3px] ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const ratio = i < filled ? 1 : i === filled ? partial : 0;
        return (
          <span
            key={i}
            style={{ width: size, height: size, background: EMPTY }}
            className="relative inline-block overflow-hidden rounded-[2px]"
          >
            {ratio > 0 && (
              <span
                style={{ width: `${ratio * 100}%`, background: fill }}
                className="absolute inset-y-0 left-0"
              />
            )}
            <svg
              viewBox="0 0 24 24"
              className="absolute inset-0 h-full w-full p-[3px]"
              fill="#fff"
              aria-hidden="true"
            >
              <path d="m12 3.4 2.55 5.5 5.95.72-4.4 4.12 1.15 5.86L12 16.7l-5.25 2.9 1.15-5.86-4.4-4.12 5.95-.72z" />
            </svg>
          </span>
        );
      })}
    </span>
  );
}
