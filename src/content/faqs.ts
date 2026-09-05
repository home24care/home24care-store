import { site } from '@/lib/site';

export type Faq = { q: string; a: string };
export type FaqGroup = { title: string; faqs: Faq[] };

export const faqGroups: FaqGroup[] = [
  {
    title: 'Ordering',
    faqs: [
      {
        q: 'Will I receive the same product I see in the picture?',
        a: 'Yes. Every product photo on this site shows the exact item you are ordering, in the configuration described on the page. Where a product has options, the images update to match. Screen calibration can shift colour slightly, so wood tones and powder-coat finishes may look marginally different in person.',
      },
      {
        q: 'Do I need an account to place an order?',
        a: 'No. You can check out as a guest with just an email address and a delivery address. Your order confirmation and tracking are emailed to you either way.',
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: `Yes, at no cost, as long as it has not shipped yet. Call ${site.contact.phone} or email ${site.contact.email} with your order number as soon as possible. Once a package is with the carrier it can no longer be cancelled, but you can still return it under our returns policy.`,
      },
      {
        q: 'Do you restock items that show as out of stock?',
        a: 'Almost always. Most out-of-stock items return within a few weeks. Email us the product name and we will tell you the expected restock date and let you know when it lands.',
      },
      {
        q: 'Do you offer trade or bulk pricing?',
        a: `Yes. We supply contractors, HVAC technicians and property managers. Email ${site.contact.email} with the products and quantities you need and we will send a quote, including pallet pricing on refrigerants.`,
      },
    ],
  },
  {
    title: 'Shipping and delivery',
    faqs: [
      {
        q: 'How much does shipping cost?',
        a: 'Standard shipping is free on every order, with no minimum spend. There are no handling, fuel or oversize surcharges — the price on the product page is what you pay, plus any applicable sales tax shown at checkout.',
      },
      {
        q: 'How long will my order take to arrive?',
        a: `Orders leave our warehouse within ${site.shipping.handlingTime} and most arrive in ${site.shipping.transitTime}. Oversized items that travel by freight take 3–10 business days. Order before ${site.shipping.cutOff} on a business day to ship the next business day.`,
      },
      {
        q: 'Where can I ship my order?',
        a: 'We ship to all 50 U.S. states, including Alaska and Hawaii. We deliver to residential and commercial addresses; oversized freight items require a street address the carrier can reach with a truck. We do not currently ship internationally or to freight forwarders.',
      },
      {
        q: 'Can I ship one order to several addresses?',
        a: 'Not within a single order. Please place a separate order for each delivery address, and shipping stays free on each one.',
      },
      {
        q: 'How do I track my order?',
        a: 'You will receive a tracking number by email as soon as your order ships. Allow up to 48 hours for the carrier to register the first scan — until then the tracking page may look empty even though the package is moving.',
      },
      {
        q: 'What happens with large freight deliveries?',
        a: 'The carrier calls to schedule an appointment before delivering. Delivery is curbside, so plan to move the pallet yourself, and someone 18 or over must sign for it. Inspect the pallet before signing, and note any visible damage on the delivery receipt.',
      },
    ],
  },
  {
    title: 'Returns and refunds',
    faqs: [
      {
        q: 'How can I return an item?',
        a: `Contact us first at ${site.contact.email} or ${site.contact.phone} with your order number, the product name and the reason for the return. We will review it and send written return instructions. Please do not ship anything back before you have that authorization.`,
      },
      {
        q: 'How long do I have to return something?',
        a: `${site.returns.windowDays} days from the delivery date, on both defective and non-defective products. New, unused and gently used items are all eligible.`,
      },
      {
        q: 'Do you charge restocking fees?',
        a: 'No. We never charge a restocking fee on an approved return.',
      },
      {
        q: 'When will I get my refund?',
        a: `We inspect returns within ${site.returns.inspectionHours} hours of receiving them and process approved refunds within ${site.returns.refundBusinessDays} business days. The money is returned to your original payment method and usually appears on your statement within a further 3–10 business days, depending on your bank.`,
      },
      {
        q: 'My item arrived damaged. What now?',
        a: 'Photograph the packaging and the damage before unpacking further, and contact us the same day with your order number. In most cases we will send a replacement or issue a full refund without asking you to ship anything back.',
      },
      {
        q: 'Where can I view my sales receipt?',
        a: `Your receipt is attached to the order confirmation email sent immediately after checkout. If you cannot find it, email ${site.contact.email} with the name and address used on the order and we will resend it.`,
      },
    ],
  },
  {
    title: 'Payment and security',
    faqs: [
      {
        q: 'What payment methods do you accept?',
        a: 'Visa, Mastercard, American Express and Discover, plus any digital wallet shown at checkout. All prices are in U.S. Dollars.',
      },
      {
        q: 'Is it safe to enter my card details?',
        a: 'Yes. The whole site runs over HTTPS, and card details are entered on an encrypted checkout hosted by a PCI DSS Level 1 certified payment processor. Your card number never passes through or is stored on our servers — we only ever see the card brand and the last four digits.',
      },
      {
        q: 'When am I charged?',
        a: 'Your card is charged when you complete checkout. Orders are processed and shipped once payment has cleared.',
      },
      {
        q: 'How will the charge appear on my statement?',
        a: `As ${site.name}. If you see a charge you do not recognise, contact us before disputing it — we can usually identify and resolve it the same day.`,
      },
    ],
  },
  {
    title: 'Products and warranty',
    faqs: [
      {
        q: 'What warranty do your products carry?',
        a: `Everything we sell carries a ${site.warranty.label}, covering manufacturing defects and failures under normal use conditions. It does not cover misuse, accidental damage, improper assembly or storage, unauthorized modification, or normal wear and weathering.`,
      },
      {
        q: 'Do the structures arrive assembled?',
        a: 'No — they arrive as complete kits with pre-cut, pre-drilled lumber or steel, numbered hardware bags and step-by-step instructions. Most projects go up in a weekend with two people and basic tools.',
      },
      {
        q: 'Can I buy replacement parts?',
        a: `Yes. We stock replacement parts for the life of the warranty. Email ${site.contact.email} with your order number and a photo or description of the part you need.`,
      },
      {
        q: 'Do I need certification to buy refrigerants?',
        a: 'For many of them, yes. Certain refrigerants may be sold only to buyers certified under Section 608 or 609 of the U.S. Clean Air Act. By ordering you confirm you hold the certification your purchase requires, and we may ask for your certification number before releasing the order.',
      },
      {
        q: 'How do refrigerants ship?',
        a: 'By ground service only — they are classified as hazardous materials and cannot travel by air or be delivered to a PO box. Unopened, factory-sealed cylinders are fully returnable; once a seal is broken they cannot be returned, because they can no longer be certified as uncontaminated.',
      },
    ],
  },
];

export const allFaqs = faqGroups.flatMap((g) => g.faqs);
