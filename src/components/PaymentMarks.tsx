/**
 * Accepted-payment card marks.
 *
 * Served as local SVGs from /public/payment rather than hotlinked, so they
 * cannot break when an upstream host moves a file, and they cost one small
 * request each. See public/payment/README.md for source and licence.
 *
 * The four marks have very different native aspect ratios (Visa is 3.1:1,
 * Amex is square), so a single height would make Amex tower over Visa. Each
 * therefore gets its own inset, tuned so they read as the same visual weight
 * on a shared tile.
 */
import { paymentMethods } from '@/lib/site';

export default function PaymentMarks({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'small';
}) {
  const tileHeight = size === 'small' ? 28 : 32;
  const tile =
    size === 'small'
      ? 'h-7 w-11 rounded-[4px]'
      : 'h-8 w-[52px] rounded-md';

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      {paymentMethods.map((mark) => (
        <li
          key={mark.name}
          className={`flex ${tile} items-center justify-center border border-ink/12 bg-white px-1.5`}
        >
          {/*
            A plain <img> rather than next/image: these are a few hundred bytes
            of already-optimal vector, so routing them through the optimizer
            would cost more than it saves. Decorative — the list is labelled by
            the "We accept" heading beside it — but each keeps a title for
            hover, and alt carries the brand for anyone inspecting the markup.
          */}
          <img
            src={mark.mark}
            alt={mark.name}
            title={mark.name}
            loading="lazy"
            decoding="async"
            style={{ height: Math.round(tileHeight * mark.scale) }}
            className="w-auto max-w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}
