import { site } from '@/lib/site';

export type Faq = { q: string; a: string };
export type FaqGroup = { title: string; faqs: Faq[] };

export const faqGroups: FaqGroup[] = [
  {
    title: 'Ordering',
    faqs: [
      {
        q: 'Will I receive the same product I see in the picture?',
        a: 'Yes. Product photos show the manufacturer packaging for the exact release and configuration you are ordering — hobby box, Sapphire edition, Delight box or case. You receive that product, factory sealed. Manufacturers occasionally tweak box artwork between print runs, so small graphic differences are possible.',
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
        q: 'Do you restock items that show as sold out?',
        a: 'Sometimes. Limited releases such as Sapphire and Delight boxes are produced once, so when our allocation sells out it may not come back. Email us the product name and we will tell you honestly whether more is expected.',
      },
      {
        q: 'Do you sell sealed cases?',
        a: `Yes, on selected releases. If you want a full sealed case of a product we list as single boxes, email ${site.contact.email} with the product and quantity and we will tell you what we can source.`,
      },
    ],
  },
  {
    title: 'Shipping and delivery',
    faqs: [
      {
        q: 'How much does shipping cost?',
        a: 'Standard shipping is free on every order, with no minimum spend. There are no handling, packaging or insurance surcharges — the price on the product page is what you pay, plus any applicable sales tax shown at checkout.',
      },
      {
        q: 'How long will my order take to arrive?',
        a: `Orders leave within ${site.shipping.handlingTime} and most arrive in ${site.shipping.transitTime}. Order before ${site.shipping.cutOff} on a business day to ship the next business day.`,
      },
      {
        q: 'Where can I ship my order?',
        a: 'We ship to all 50 U.S. states, including Alaska and Hawaii, to residential and commercial addresses. Orders above $1,000 ship with signature confirmation. We do not currently ship internationally or to freight forwarders.',
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
        q: 'How are boxes packed?',
        a: 'Every box is bubble-wrapped and shipped in a rigid corrugated carton with void fill, never in a padded envelope, so the shrink-wrap and corners arrive intact. Sealed cases ship in the manufacturer case and are overboxed where needed.',
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
        a: `${site.returns.windowDays} days from the delivery date. The product must be unopened, with the manufacturer seal and shrink-wrap intact. Opened boxes and packs cannot be returned, because their contents are random and can no longer be verified as untouched.`,
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
        q: 'My box arrived damaged. What now?',
        a: 'Photograph the shipping carton and the box, and contact us the same day with your order number. Please do not open the sealed product — with the seal intact we can send a sealed replacement or issue a full refund.',
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
    title: 'Products and authenticity',
    faqs: [
      {
        q: 'Are your products authentic?',
        a: `Yes. Everything we sell is brand new and factory sealed exactly as released by Topps, Bowman, Panini, The Pokémon Company International or Wizards of the Coast. We never sell resealed, re-wrapped or searched product, and our ${site.warranty.label} gives you a full refund if a box is ever not as described.`,
      },
      {
        q: 'What is a hobby box?',
        a: 'A hobby box is the configuration manufacturers make for hobby shops rather than big-box retail. It usually carries guaranteed hits — autographs or numbered parallels — and hobby-exclusive parallels you cannot pull from retail blasters or megas.',
      },
      {
        q: 'What is the difference between Sapphire, Delight and Logofractor boxes?',
        a: 'They are premium, limited formats of the Chrome brand. Sapphire editions print every card in a blue Sapphire finish with exclusive parallels. Delight (Breaker\'s Delight) boxes are shorter boxes built around hits, such as two autographs per box. Logofractor editions use an exclusive team-logo refractor finish. Each is produced in far smaller quantities than the standard hobby box.',
      },
      {
        q: 'Are box hits guaranteed?',
        a: 'The box break averages we list — for example "1 autograph per box" — are the figures published by the manufacturer. Which cards you pull is random: we have no knowledge of what is inside a sealed box, and the value of the cards is not guaranteed.',
      },
      {
        q: 'What if my box contains a redemption card?',
        a: 'Redemptions are fulfilled by the manufacturer through its own website and timeline. If you have trouble redeeming a card, email us and we will help you reach the manufacturer.',
      },
    ],
  },
];

export const allFaqs = faqGroups.flatMap((g) => g.faqs);
