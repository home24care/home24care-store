'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/catalog';
import { BLUR_DATA_URL, SIZES, IMAGES_LOCALIZED } from '@/lib/image';

export default function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {images.map((img, i) => (
            <li key={img.thumb + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-sand ring-offset-2 transition-all lg:h-[84px] lg:w-[84px] ${
                  i === active ? 'ring-2 ring-moss-600' : 'ring-1 ring-ink/10 hover:ring-ink/30'
                }`}
              >
                <Image
                  src={img.thumb}
                  alt=""
                  fill
                  sizes={SIZES.thumb}
                  unoptimized={IMAGES_LOCALIZED}
                  quality={70}
                  loading={i === 0 ? undefined : 'lazy'}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-sand">
        <Image
          key={current.full}
          src={current.full}
          alt={current.alt || title}
          fill
          // Only the first frame is LCP; later frames are user-initiated.
          priority={active === 0}
          sizes={SIZES.gallery}
          unoptimized={IMAGES_LOCALIZED}
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="animate-fade-in object-cover"
        />
      </div>
    </div>
  );
}
