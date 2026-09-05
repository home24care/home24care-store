'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BLUR_DATA_URL, SIZES, IMAGES_LOCALIZED } from '@/lib/image';

/**
 * The image pair on a product card: primary photo, with the second photo
 * revealed on hover.
 *
 * One component owns both because the crossfade has to be driven by whether the
 * second image is actually ready. Doing it with a bare CSS `group-hover` on the
 * primary blanks the card in two real cases:
 *
 *   - Touch tap. Mobile browsers apply :hover on tap and keep it until the user
 *     taps elsewhere, so the primary faded out — but `pointerType` is never
 *     'mouse' there, so nothing was ever mounted to replace it.
 *   - First mouse hover. The fade began immediately while the replacement was
 *     still being fetched and decoded.
 *
 * Deferring the second download to the first mouse hover is still worth it: it
 * halves the image requests on a listing page, and touch devices never pay for
 * it at all.
 */
export default function CardImages({
  primary,
  primaryAlt,
  hover,
  priority = false,
}: {
  primary: string;
  primaryAlt: string;
  hover?: string;
  priority?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);

  const revealed = Boolean(hover) && ready;

  return (
    <span
      className="absolute inset-0"
      onPointerEnter={(e) => {
        if (hover && e.pointerType === 'mouse') setArmed(true);
      }}
    >
      <Image
        src={primary}
        alt={primaryAlt}
        fill
        sizes={SIZES.card}
        quality={75}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        unoptimized={IMAGES_LOCALIZED}
        className={`object-cover transition-[opacity,transform] duration-300 ${
          revealed ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'
        }`}
      />

      {hover && armed && (
        <Image
          src={hover}
          alt=""
          fill
          sizes={SIZES.card}
          quality={75}
          unoptimized={IMAGES_LOCALIZED}
          onLoad={() => setReady(true)}
          aria-hidden="true"
          className={`pointer-events-none object-cover opacity-0 transition-opacity duration-300 ${
            ready ? 'group-hover:opacity-100' : ''
          }`}
        />
      )}
    </span>
  );
}
