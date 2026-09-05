import TrustpilotWidget from './TrustpilotWidget';
import { trustpilot, TRUSTBOX_TEMPLATES } from '@/lib/trustpilot';
import { SectionHeading } from './Section';

/**
 * Homepage review band. Renders only when Trustpilot is configured, so a store
 * with no reviews yet simply shows nothing here rather than an empty frame.
 */
export function TrustpilotReviews() {
  if (!trustpilot.enabled) return null;

  return (
    <section className="container-page pb-16">
      <SectionHeading
        eyebrow="Verified reviews"
        title="What customers say on Trustpilot"
        subtitle="Independently collected and published by Trustpilot — we cannot edit or remove them."
        href={trustpilot.profileUrl}
        linkLabel="See all reviews"
      />
      <TrustpilotWidget templateId={TRUSTBOX_TEMPLATES.carousel} height="240px" />
    </section>
  );
}

/** Compact star + count, for the product buy box. */
export function TrustpilotStars({ className }: { className?: string }) {
  if (!trustpilot.enabled) return null;

  return (
    <TrustpilotWidget
      templateId={TRUSTBOX_TEMPLATES.microCombo}
      height="24px"
      width="220px"
      className={className}
    />
  );
}

/** Footer trust strip. */
export function TrustpilotFooter() {
  if (!trustpilot.enabled) return null;

  return (
    <div className="mt-6">
      <TrustpilotWidget
        templateId={TRUSTBOX_TEMPLATES.microStar}
        height="24px"
        width="200px"
      />
    </div>
  );
}

/**
 * Product-scoped reviews. Trustpilot matches on SKU, so this shows reviews for
 * this exact item where they exist and collapses when they do not
 * (`data-no-reviews="hide"`).
 */
export function TrustpilotProductReviews({ sku }: { sku: string }) {
  if (!trustpilot.enabled) return null;

  return (
    <section className="border-t border-ink/10 py-12">
      <SectionHeading
        eyebrow="Verified reviews"
        title="What buyers said about this product"
      />
      <TrustpilotWidget
        templateId={TRUSTBOX_TEMPLATES.grid}
        height="500px"
        sku={sku}
      />
    </section>
  );
}
