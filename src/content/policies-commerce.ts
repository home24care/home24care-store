import type { Policy } from '@/lib/policy-types';
import { site, paymentMethodNames, legalEntity } from '@/lib/site';

const UPDATED = 'September 25, 2026';
const A = site.address.formatted;
const E = site.contact.email;
const P = site.contact.phone;

/** Repeated verbatim at the foot of every policy — Merchant Center and Stripe
 *  both look for reachable, consistent contact details on each page. */
const contactSection = (intro: string) => ({
  id: 'contact',
  heading: 'Contact information',
  blocks: [
    { type: 'p' as const, text: intro },
    {
      type: 'ul' as const,
      items: [
        `Company: ${legalEntity}`,
        `Email: ${E}`,
        `Phone: ${P}`,
        `Address: ${A}`,
        `Support hours: ${site.contact.hours}`,
      ],
    },
    {
      type: 'p' as const,
      text: `${site.contact.responseTime} Please include your order number so we can find your order straight away.`,
    },
  ],
});

/* ------------------------------------------------------------- shipping */

export const shippingPolicy: Policy = {
  slug: 'shipping',
  title: 'Shipping Policy',
  summary: `Free standard shipping on every order within the United States. Orders leave our warehouse within ${site.shipping.handlingTime} and typically arrive in ${site.shipping.transitTime}.`,
  updated: UPDATED,
  sections: [
    {
      id: 'where-we-ship',
      heading: 'Where we ship',
      blocks: [
        {
          type: 'p',
          text: `${site.name} ships to all 50 U.S. states, including Alaska and Hawaii. We do not currently ship internationally, and we cannot deliver to freight-forwarding addresses.`,
        },
        {
          type: 'p',
          text: 'We deliver to residential and commercial addresses and to most PO boxes. Orders above $1,000 ship with signature confirmation, so they need a street address where someone can sign for the package.',
        },
      ],
    },
    {
      id: 'cost',
      heading: 'Shipping cost',
      blocks: [
        {
          type: 'p',
          text: 'Standard shipping is free on every order, with no minimum spend. The price you see on the product page is the price you pay — we do not add handling, packaging or insurance surcharges at checkout.',
        },
        {
          type: 'p',
          text: 'Any applicable sales tax is calculated and displayed on the checkout page before you confirm payment. All prices are shown in U.S. Dollars (USD).',
        },
      ],
    },
    {
      id: 'times',
      heading: 'Handling and delivery times',
      blocks: [
        {
          type: 'table',
          head: ['Stage', 'Timeframe'],
          rows: [
            ['Order cut-off time', site.shipping.cutOff],
            ['Handling time', site.shipping.handlingTime],
            ['Transit time (parcel)', site.shipping.transitTime],
            ['Total delivery estimate', '2–4 business days for most orders'],
          ],
        },
        {
          type: 'p',
          text: `Orders placed before ${site.shipping.cutOff} on a business day are processed the same day and usually ship the next business day. Orders placed on a weekend or public holiday are processed on the next business day.`,
        },
        {
          type: 'p',
          text: 'Delivery estimates are business days and exclude weekends and public holidays. Severe weather, carrier backlogs and remote delivery areas can extend transit time; we will contact you if we know your order is delayed.',
        },
      ],
    },
    {
      id: 'packing',
      heading: 'How we pack sealed product',
      blocks: [
        {
          type: 'p',
          text: 'Sealed boxes and cases are collectibles, and a crushed corner or torn shrink-wrap matters to collectors. Every order is packed to protect the factory seal as well as the cards inside:',
        },
        {
          type: 'ul',
          items: [
            'Each box is wrapped in bubble wrap and shipped inside a rigid corrugated carton — never in a padded envelope.',
            'Void fill keeps the box from moving in transit, and corners are protected on high-value boxes and cases.',
            'Sealed cases ship in the manufacturer case, overboxed where the case itself would take the carrier labels.',
            'Orders above $1,000 ship fully insured with signature confirmation.',
          ],
        },
      ],
    },
    {
      id: 'multiple-addresses',
      heading: 'Multiple shipping addresses',
      blocks: [
        {
          type: 'p',
          text: 'We are not able to split a single order across multiple destinations. If you need items delivered to different addresses, please place a separate order for each address.',
        },
      ],
    },
    {
      id: 'tracking',
      heading: 'Order status and tracking',
      blocks: [
        {
          type: 'p',
          text: 'You will receive an order confirmation email immediately after checkout, and a second email containing your tracking number once your order leaves the warehouse.',
        },
        {
          type: 'p',
          text: 'Please allow up to 48 hours after you receive the tracking email for the carrier to register the first scan. Until then the tracking page may show no movement even though the package is on its way.',
        },
        {
          type: 'p',
          text: `If your order has not arrived within 20 days of the shipping confirmation, email ${E} or call ${P} with your name and order number and we will open a trace with the carrier.`,
        },
      ],
    },
    {
      id: 'releases',
      heading: 'New releases and purchase limits',
      blocks: [
        {
          type: 'p',
          text: 'Products are listed only once we can ship them. Where a manufacturer sets a purchase limit on a limited release, or where stock is allocated, the limit is shown on the product page and applies per household and per payment card.',
        },
      ],
    },
    {
      id: 'problems',
      heading: 'Lost, damaged or undeliverable packages',
      blocks: [
        {
          type: 'p',
          text: 'If your order arrives damaged, photograph the shipping carton and the box before opening anything further, and contact us the same day. Do not open the sealed product — a box with its seal intact can be replaced or refunded in full, while an opened box cannot be assessed.',
        },
        {
          type: 'p',
          text: 'If a package is returned to us as undeliverable because of an incorrect or incomplete address, we will contact you to confirm the correct address and reship at no charge.',
        },
        {
          type: 'p',
          text: 'Full details on returns and refunds are set out in our Refunds and Returns Policy.',
        },
      ],
    },
    contactSection('If you have a question about shipping or an order in transit, contact us:'),
  ],
};

/* -------------------------------------------------------------- returns */

export const returnsPolicy: Policy = {
  slug: 'returns',
  title: 'Refunds and Returns Policy',
  summary: `Return unopened, factory-sealed product within ${site.returns.windowDays} days of delivery. No restocking fees, and approved refunds are issued to your original payment method within ${site.returns.refundBusinessDays} business days.`,
  updated: UPDATED,
  sections: [
    {
      id: 'guarantee',
      heading: 'Customer satisfaction guarantee',
      blocks: [
        {
          type: 'p',
          text: `At ${site.name}, customer satisfaction is our top priority. We want you to shop with confidence, knowing that if you are not completely satisfied with your purchase, we are here to help.`,
        },
      ],
    },
    {
      id: 'eligibility',
      heading: 'Return eligibility',
      blocks: [
        {
          type: 'p',
          text: `You may request a return within ${site.returns.windowDays} days of the delivery date. To qualify for a return:`,
        },
        {
          type: 'ul',
          items: [
            `The item must have been purchased directly from ${site.name}.`,
            'The product must be unopened, with the original manufacturer seal and shrink-wrap intact.',
            'Boxes and cases must be in the same condition they were delivered in — no tears, re-wrapping or tampering.',
            'We accept returns of sealed product for any reason within the window, including a change of mind.',
          ],
        },
      ],
    },
    {
      id: 'start-a-return',
      heading: 'How to request a return',
      blocks: [
        { type: 'h3', text: 'Step 1 — Contact us' },
        {
          type: 'p',
          text: `Before returning any item, contact our support team at ${E} or ${P} and include:`,
        },
        {
          type: 'ul',
          items: [
            'Your order number',
            'The product name',
            'The reason for the return',
            'Photos of the box, showing the seal, if it arrived damaged or is the wrong item',
          ],
        },
        { type: 'h3', text: 'Step 2 — Receive return authorization' },
        {
          type: 'p',
          text: 'Our team reviews every request and sends written return instructions if your return is approved. Please do not ship anything back before you receive that authorization — unauthorized returns can be delayed or refused at the warehouse.',
        },
        { type: 'h3', text: 'Step 3 — Return the product' },
        {
          type: 'p',
          text: `Once approved, ship the item using a trackable and insured service and send us the tracking number. ${site.name} cannot be responsible for packages lost in return transit.`,
        },
      ],
    },
    {
      id: 'methods',
      heading: 'Return methods',
      blocks: [
        {
          type: 'p',
          text: 'Depending on the item and your location, returns can be completed by:',
        },
        {
          type: 'ul',
          items: [
            'Mail-in return using the instructions we provide',
            'A prepaid label we send you for damaged or incorrect items',
            'An authorized drop-off location, where one is available near you',
          ],
        },
      ],
    },
    {
      id: 'refunds',
      heading: 'Refund process',
      blocks: [
        {
          type: 'table',
          head: ['Stage', 'Timeframe'],
          rows: [
            ['Return inspection after we receive the item', `Within ${site.returns.inspectionHours} hours`],
            ['Refund processed once approved', `Within ${site.returns.refundBusinessDays} business days`],
            ['Funds appear on your statement', '3–10 business days, depending on your bank'],
          ],
        },
        {
          type: 'p',
          text: 'Refunds are always issued to the original payment method used for the purchase. We cannot refund to a different card, account or person.',
        },
        {
          type: 'p',
          text: 'We will email you when your return has been inspected to confirm whether the refund has been approved, and again when it has been sent to your payment provider.',
        },
      ],
    },
    {
      id: 'shipping-charges',
      heading: 'Return shipping charges',
      blocks: [
        {
          type: 'p',
          text: 'If a return is approved because the wrong item was shipped, the product was not as described, or it was damaged in transit, we cover the return shipping and refund the full amount you paid.',
        },
        {
          type: 'p',
          text: 'For non-defective returns — for example a change of mind — return shipping may be the responsibility of the customer unless otherwise required by law. We will tell you the exact cost in writing before you ship anything back.',
        },
      ],
    },
    {
      id: 'no-restocking',
      heading: 'No restocking fees',
      blocks: [
        {
          type: 'p',
          text: `${site.name} does not charge restocking fees on approved returns.`,
        },
      ],
    },
    {
      id: 'damaged',
      heading: 'Damaged, defective or incorrect items',
      blocks: [
        {
          type: 'p',
          text: 'If you receive a box that is damaged, has a broken seal, or is different from what you ordered, contact us within 7 days of delivery with your order number, a short description and clear photos of the box and its seal. Please leave the product unopened.',
        },
        { type: 'p', text: 'Depending on the situation we will:' },
        {
          type: 'ul',
          items: [
            'Send a replacement product at no charge, or',
            'Issue a full refund, or',
          ],
        },
        {
          type: 'p',
          text: 'In most of these cases we will not ask you to return the product before we resolve it.',
        },
      ],
    },
    {
      id: 'cancellations',
      heading: 'Order cancellations',
      blocks: [
        {
          type: 'p',
          text: `You can cancel an order at no cost at any point before it ships. Email ${E} or call ${P} as soon as possible with your order number. Once an order has been handed to the carrier it can no longer be cancelled, but you can still return it under this policy.`,
        },
      ],
    },
    {
      id: 'exclusions',
      heading: 'Non-returnable items',
      blocks: [
        {
          type: 'p',
          text: 'Trading card products are sold sealed, and their contents are random. For that reason the following cannot be returned:',
        },
        {
          type: 'ul',
          items: [
            'Boxes, cases or packs that have been opened, or whose seal or shrink-wrap has been removed or broken',
            'Individual packs or cards taken from a box',
            'Product returned because of the cards pulled from it — pack contents are random and are not guaranteed',
          ],
        },
        {
          type: 'callout',
          title: 'Why opened product cannot come back',
          text: 'Once a seal is broken there is no way to show that the packs inside are untouched, so an opened box can never be resold as sealed. If a box arrives damaged or with a broken seal, contact us before opening it and we will put it right.',
        },
      ],
    },
    contactSection('To start a return or ask about a refund, contact us:'),
  ],
};

/* -------------------------------------------------------- authenticity */

export const authenticityPolicy: Policy = {
  slug: 'authenticity',
  title: 'Authenticity Guarantee',
  summary: `Every box sold by ${site.name} is genuine, brand new and delivered in its original manufacturer seal. If it is not, we refund you in full.`,
  updated: UPDATED,
  sections: [
    {
      id: 'guarantee',
      heading: 'Our guarantee',
      blocks: [
        {
          type: 'p',
          text: `${site.legalName} guarantees that every product sold through ${site.name} is authentic, brand new and factory sealed exactly as released by the manufacturer — Topps, Bowman, Panini, The Pokémon Company International or Wizards of the Coast. We do not sell resealed, re-wrapped, searched or weighed product.`,
        },
        {
          type: 'ul',
          items: [
            'Boxes ship in the manufacturer shrink-wrap or seal they left the factory in',
            'Cases ship with the manufacturer case seal intact',
            'Products are described exactly as released: configuration, pack count and stated box hits',
          ],
        },
      ],
    },
    {
      id: 'if-not',
      heading: 'If a product is not as described',
      blocks: [
        {
          type: 'p',
          text: 'If you believe a box you received is not genuine, has been tampered with, or does not match its listing, contact us before opening it. Send your order number and clear photos of the box, the seal and the barcode.',
        },
        { type: 'p', text: 'If we confirm the problem we will, at your choice:' },
        {
          type: 'ul',
          items: [
            'Send an identical sealed replacement at no charge, or',
            'Refund the full amount you paid, including return shipping.',
          ],
        },
      ],
    },
    {
      id: 'random-contents',
      heading: 'Random pack contents',
      blocks: [
        {
          type: 'p',
          text: 'Trading card packs are randomly inserted by the manufacturer. Box break averages, such as "1 autograph per box", are the manufacturer\'s stated averages or guarantees and are reproduced as published. We have no knowledge of or control over which cards are inside a sealed box, and the value of the cards you pull is not guaranteed.',
        },
      ],
    },
    {
      id: 'redemptions',
      heading: 'Manufacturer redemptions',
      blocks: [
        {
          type: 'p',
          text: 'Some products contain redemption cards for autographs or other items. Redemptions are fulfilled by the manufacturer under its own terms and timelines, not by us, but we are happy to help if you have trouble reaching the manufacturer.',
        },
      ],
    },
    {
      id: 'statutory',
      heading: 'Your statutory rights',
      blocks: [
        {
          type: 'p',
          text: 'This guarantee is provided in addition to, and does not limit, the rights available to you under applicable consumer protection law. Nothing in this policy excludes any right that cannot lawfully be excluded.',
        },
      ],
    },
    contactSection('To report a problem with a product or ask about authenticity, contact us:'),
  ],
};

/* ------------------------------------------------- order acceptance */

export const orderAcceptancePolicy: Policy = {
  slug: 'order-acceptance',
  title: 'Order Acceptance and Cancellation Policy',
  summary: 'How we review, accept, limit and cancel orders — and what happens to your payment if an order cannot be fulfilled.',
  updated: UPDATED,
  sections: [
    {
      id: 'acceptance',
      heading: 'Order acceptance',
      blocks: [
        {
          type: 'p',
          text: `All orders placed through ${site.name} constitute an offer to purchase and are subject to review and acceptance by us. Submitting an order and receiving an automatic order confirmation email does not by itself form a binding contract of sale. The contract is formed when we dispatch the goods.`,
        },
        {
          type: 'p',
          text: 'We reserve the right to refuse, limit or cancel any order at our sole discretion, including in situations involving:',
        },
        {
          type: 'ul',
          items: [
            'Product availability issues or stock shortages',
            'Pricing, listing or typographical errors',
            'Suspected fraudulent or unauthorized activity',
            'Orders that cannot pass our payment verification checks',
            'Orders that exceed a published purchase limit on a limited release',
            'Violations of our Terms of Service',
          ],
        },
      ],
    },
    {
      id: 'limits',
      heading: 'Order limitations',
      blocks: [
        {
          type: 'p',
          text: 'We may limit or cancel quantities purchased per:',
        },
        {
          type: 'ul',
          items: [
            'Person',
            'Household',
            'Order',
            'Customer account',
            'Payment card',
            'Billing address',
            'Shipping address',
          ],
        },
        {
          type: 'p',
          text: 'These restrictions may be applied to orders that appear to be placed by the same customer or using related account information. They exist to keep limited releases available to as many collectors as possible and to prevent fraudulent purchases.',
        },
      ],
    },
    {
      id: 'pricing-errors',
      heading: 'Pricing and listing errors',
      blocks: [
        {
          type: 'p',
          text: 'We take care to ensure that prices, descriptions and availability on this website are accurate. If an error means an item was listed at an incorrect price, we will contact you before processing the order and give you the choice of proceeding at the correct price or cancelling for a full refund. We will never charge you more than the price you agreed at checkout without your consent.',
        },
      ],
    },
    {
      id: 'changes',
      heading: 'Order changes and cancellations',
      blocks: [
        {
          type: 'p',
          text: 'If we modify or cancel an order, we will make reasonable efforts to notify you using the email address or phone number you provided at checkout. We cannot be responsible for delays or non-delivery caused by contact or address information that is incorrect, incomplete or out of date.',
        },
        {
          type: 'p',
          text: 'If payment has already been taken for an order we cancel, a full refund is issued to the original payment method. Refunds for cancelled orders are processed immediately and typically appear on your statement within 3–10 business days depending on your bank.',
        },
        {
          type: 'p',
          text: `To cancel an order yourself, contact us at ${E} or ${P} as soon as possible with your order number. Orders can be cancelled free of charge at any point before dispatch.`,
        },
      ],
    },
    {
      id: 'verification',
      heading: 'Fraud prevention and verification',
      blocks: [
        {
          type: 'p',
          text: 'To protect our customers and our business, orders may be subject to additional verification. We may contact you to confirm details before approving an order, particularly on high-value orders or orders shipping to an address that differs from the billing address. Orders that fail verification are cancelled and refunded in full.',
        },
      ],
    },
    contactSection('If you have a question about an order, contact us:'),
  ],
};

/* -------------------------------------------------- payment & security */

export const paymentSecurityPolicy: Policy = {
  slug: 'payment-security',
  title: 'Secure Payment and Security Policy',
  summary: 'How we protect your payment information, which payment methods we accept, and what we can and cannot see about your card.',
  updated: UPDATED,
  sections: [
    {
      id: 'secure-transactions',
      heading: 'Secure transactions',
      blocks: [
        {
          type: 'p',
          text: `${site.name} uses Transport Layer Security (TLS) with 128-bit encryption or higher across the entire website. Every page and every form is served over HTTPS, so information you enter is encrypted in transit.`,
        },
        { type: 'p', text: 'This protects sensitive information such as:' },
        {
          type: 'ul',
          items: ['Passwords', 'Payment details', 'Personal and delivery information'],
        },
      ],
    },
    {
      id: 'pci',
      heading: 'PCI DSS compliance',
      blocks: [
        {
          type: 'p',
          text: 'The Payment Card Industry Data Security Standard (PCI DSS) is a global security standard designed to protect cardholder data and reduce fraud.',
        },
        {
          type: 'p',
          text: `${site.name} maintains a secure payment environment in line with PCI DSS requirements by processing all card payments through PCI DSS Level 1 certified payment providers. Card details are entered directly on our payment provider's hosted, encrypted checkout — they are never transmitted through or stored on our own servers.`,
        },
      ],
    },
    {
      id: 'methods',
      heading: 'Accepted payment methods',
      blocks: [
        { type: 'p', text: 'We accept the following payment methods:' },
        {
          type: 'ul',
          items: [
            ...paymentMethodNames,
            'Other major credit and debit cards, and any digital wallet shown at checkout',
          ],
        },
      ],
    },
    {
      id: 'terms',
      heading: 'Payment terms',
      blocks: [
        {
          type: 'ul',
          items: [
            'All prices on this website are listed in U.S. Dollars (USD $).',
            'Applicable sales tax, where it applies, is calculated and displayed at checkout before you confirm payment.',
            'Standard shipping is free; no shipping charge is added at checkout.',
            'Payment must be received in full before an order is processed and shipped.',
            'By submitting payment information you confirm that you are authorized to use the selected payment method.',
          ],
        },
      ],
    },
    {
      id: 'what-we-see',
      heading: 'What we can see about your payment',
      blocks: [
        {
          type: 'p',
          text: 'We do not have access to your complete card number, and we do not store full card details on our servers. Once a transaction completes, our payment provider passes back only:',
        },
        {
          type: 'ul',
          items: [
            'Your billing information',
            'Your shipping information',
            'The order details',
            'The last four digits and card brand of the payment method used',
          ],
        },
        {
          type: 'p',
          text: 'Your full payment credentials remain with the payment processor at all times.',
        },
      ],
    },
    {
      id: 'statement',
      heading: 'How charges appear on your statement',
      blocks: [
        {
          type: 'p',
          text: `Charges from this store appear on your card or bank statement as ${site.name}. If you see a charge you do not recognise, contact us at ${E} or ${P} before disputing it — we can usually identify and resolve it the same day.`,
        },
      ],
    },
    {
      id: 'privacy',
      heading: 'Privacy and data protection',
      blocks: [
        {
          type: 'p',
          text: `${site.name} respects your privacy. We do not rent, sell or share your personal information with third parties for marketing purposes. Our Privacy Policy sets out in full how your information is collected, used, stored and protected.`,
        },
      ],
    },
    {
      id: 'commitment',
      heading: 'Our security commitment',
      blocks: [
        {
          type: 'p',
          text: 'We continuously monitor and improve our systems to protect transactions and customer data. This includes enforced HTTPS, strict transport security, restricted internal access to customer records, and regular review of our payment integrations.',
        },
        {
          type: 'callout',
          title: 'Report a security issue',
          text: `If you believe you have found a security vulnerability on this website, please email ${E} with the subject line "Security" and a description of the issue. We investigate every report and will acknowledge yours within one business day. Please do not publicly disclose the issue until we have had a chance to address it.`,
        },
      ],
    },
    contactSection('For questions about payments or account security, contact us:'),
  ],
};
