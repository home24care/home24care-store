import type { Policy } from '@/lib/policy-types';
import { site, paymentMethodNames } from '@/lib/site';

const UPDATED = 'September 5, 2026';
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
        `Company: ${site.legalName}, trading as ${site.name}`,
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
          text: 'We can deliver to residential addresses, commercial addresses and most PO boxes for small parcels. Oversized items that move by freight require a physical street address where the carrier can bring a truck.',
        },
      ],
    },
    {
      id: 'cost',
      heading: 'Shipping cost',
      blocks: [
        {
          type: 'p',
          text: 'Standard shipping is free on every order, with no minimum spend. The price you see on the product page is the price you pay — we do not add handling, fuel or oversize surcharges at checkout.',
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
            ['Transit time (freight / oversized)', '3–10 business days'],
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
      id: 'freight',
      heading: 'Freight and oversized deliveries',
      blocks: [
        {
          type: 'p',
          text: 'Pallet quantities of refrigerant ship by freight carrier at no extra cost to you, delivered by appointment.',
        },
        {
          type: 'ul',
          items: [
            'The carrier will call to schedule a delivery appointment before arriving.',
            'Delivery is curbside. The driver is not able to carry items into a garage, yard or house.',
            'Someone aged 18 or over must be present to sign for the delivery.',
            'Please inspect the pallet before signing. If there is visible damage, note it on the delivery receipt and photograph it.',
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
      id: 'refrigerants',
      heading: 'Shipping restrictions on refrigerants',
      blocks: [
        {
          type: 'callout',
          title: 'Regulated products',
          text: 'Refrigerant cylinders and cans are classified as hazardous materials for transport. They ship by ground service only, cannot be sent by air, and cannot be delivered to a PO box. Certain refrigerants may be sold only to buyers certified under Section 608 or 609 of the U.S. Clean Air Act.',
        },
        {
          type: 'p',
          text: 'By placing an order for a regulated refrigerant you confirm that you hold the certification your purchase requires and that the product will be handled, charged and recovered in line with EPA regulations. We may ask you to provide your certification number before an order is released.',
        },
      ],
    },
    {
      id: 'problems',
      heading: 'Lost, damaged or undeliverable packages',
      blocks: [
        {
          type: 'p',
          text: 'If your order arrives damaged, photograph the packaging and contents before unpacking further and contact us the same day. We will arrange a replacement or a full refund without requiring you to return the item in most cases.',
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
  summary: `Return any item within ${site.returns.windowDays} days of delivery — defective or not. No restocking fees, and approved refunds are issued to your original payment method within ${site.returns.refundBusinessDays} business days.`,
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
            'We accept returns of both defective and non-defective products.',
            'We accept returns of new, unused and gently used items.',
            'Returned products should include all original parts, accessories and packaging wherever possible.',
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
            'Photos of the item if it is damaged, defective or incorrect',
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
            'Carrier pickup, which we arrange for oversized and freight items',
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
          text: 'If a return is approved because the merchandise was defective, the wrong item was shipped, or the product was damaged in transit, we cover the return shipping and refund the full amount you paid, including any original shipping charges.',
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
          text: 'If you receive an item that is damaged, defective or different from what you ordered, contact us within a reasonable time after delivery with your order number, a short description and clear photos of the issue.',
        },
        { type: 'p', text: 'Depending on the situation we will:' },
        {
          type: 'ul',
          items: [
            'Send a replacement product at no charge, or',
            'Issue a full refund, or',
            'Ship replacement parts where that fully resolves the problem.',
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
          text: 'A small number of items cannot be returned for health, hygiene, safety or legal reasons. Where an exclusion applies it is stated clearly on the product page before you buy.',
        },
        {
          type: 'callout',
          title: 'Refrigerants',
          text: 'Refrigerant cylinders and cans that have been opened, connected to a system, or had their factory seal broken cannot be returned, because they can no longer be certified as uncontaminated. Unopened, factory-sealed cylinders are fully returnable within the standard window. Defective or incorrectly supplied refrigerant is always covered, opened or not.',
        },
      ],
    },
    contactSection('To start a return or ask about a refund, contact us:'),
  ],
};

/* ------------------------------------------------------------- warranty */

export const warrantyPolicy: Policy = {
  slug: 'warranty',
  title: 'Warranty and Replacement Policy',
  summary: `Every product sold by ${site.name} carries a ${site.warranty.label} covering manufacturing defects under normal use conditions.`,
  updated: UPDATED,
  sections: [
    {
      id: 'coverage',
      heading: 'What the warranty covers',
      blocks: [
        {
          type: 'p',
          text: `${site.legalName} provides a ${site.warranty.label} on all products sold through ${site.name}. The warranty runs for ${site.warranty.years} years from the date of delivery and covers manufacturing defects and product failures that occur under normal use conditions.`,
        },
        {
          type: 'ul',
          items: [
            'Defects in materials or workmanship',
            'Structural failure of components under normal, intended use',
            'Hardware, fixings and fasteners supplied with the product',
            'Finish defects such as premature powder-coat failure or delamination',
          ],
        },
      ],
    },
    {
      id: 'exclusions',
      heading: 'What the warranty does not cover',
      blocks: [
        { type: 'p', text: 'This warranty does not cover:' },
        {
          type: 'ul',
          items: [
            'Misuse, abuse or accidental damage',
            'Improper handling, assembly, installation or storage',
            'Unauthorized modifications, alterations or repairs',
            'Damage caused by neglect or by failure to follow the product instructions',
            'Normal wear and tear, including natural weathering and colour change in timber',
            'Damage caused by extreme weather events, flooding, fire or impact',
            'Commercial or rental use of products sold for residential use',
          ],
        },
      ],
    },
    {
      id: 'replacements',
      heading: 'Replacement products',
      blocks: [
        {
          type: 'p',
          text: `If you are entitled to a replacement, ${site.name} will supply a product that is identical or of equal value. If the exact product is no longer available, we may instead:`,
        },
        {
          type: 'ul',
          items: [
            'Supply a replacement product of similar specification and value,',
            'Issue a full refund, or',
            'Repair the product within a reasonable timeframe.',
          ],
        },
        {
          type: 'p',
          text: 'Replacement products are covered by the same return, refund and warranty conditions as the original order. The warranty on a replacement runs for the remainder of the original warranty period.',
        },
      ],
    },
    {
      id: 'claim',
      heading: 'How to make a warranty claim',
      blocks: [
        {
          type: 'ol',
          items: [
            `Email ${E} or call ${P} with your order number and the date of delivery.`,
            'Describe the fault and attach clear photographs showing the defect and, where relevant, the product as installed.',
            'Our team will assess the claim and respond, usually within one business day.',
            'If the claim is approved we will ship replacement parts, a replacement product, or issue a refund — whichever resolves the fault.',
          ],
        },
        {
          type: 'p',
          text: 'You do not need to return a defective product before we begin resolving a warranty claim in most cases.',
        },
      ],
    },
    {
      id: 'statutory',
      heading: 'Your statutory rights',
      blocks: [
        {
          type: 'p',
          text: 'This warranty is provided in addition to, and does not limit, the rights available to you under applicable consumer protection law. Nothing in this policy excludes any right that cannot lawfully be excluded.',
        },
        {
          type: 'callout',
          title: 'Where the manufacturer offers longer cover',
          text: `Some products carry a manufacturer warranty longer than ${site.warranty.years} years — several outdoor structures are covered for five years or more, and the term is stated in the product description. Where a manufacturer warranty is longer than ours, the longer term applies and we will help you claim under it. Our ${site.warranty.label} is the minimum you get on anything bought here, never a cap.`,
        },
      ],
    },
    contactSection('To make a warranty claim or ask about coverage, contact us:'),
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
            'Orders for regulated products from buyers who cannot evidence the required certification',
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
          text: 'These restrictions may be applied to orders that appear to be placed by the same customer or using related account information. They exist to prevent abuse, unauthorized reselling and fraudulent purchases.',
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
          text: 'To protect our customers and our business, orders may be subject to additional verification. We may contact you to confirm details before approving an order, and we may request evidence of certification for regulated products. Orders that fail verification are cancelled and refunded in full.',
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
