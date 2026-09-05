import type { Policy } from '@/lib/policy-types';
import { site } from '@/lib/site';

const UPDATED = 'September 5, 2026';
const A = site.address.formatted;
const E = site.contact.email;
const P = site.contact.phone;

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
  ],
});

/* -------------------------------------------------------------- privacy */

export const privacyPolicy: Policy = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary: `How ${site.name} collects, uses, shares and protects your personal information, and the rights you have over it.`,
  updated: UPDATED,
  sections: [
    {
      id: 'scope',
      heading: '1. Introduction and scope',
      blocks: [
        {
          type: 'p',
          text: `This Privacy Policy describes how ${site.legalName}, trading as ${site.name} ("we", "our" or "us"), collects, uses, shares and protects your personal information when you visit our website, make a purchase, or interact with our services. It applies to all visitors to this website and all customers of our products.`,
        },
        {
          type: 'p',
          text: 'We are committed to transparency in our data practices and to compliance with applicable privacy laws, including the California Consumer Privacy Act (CCPA/CPRA), the General Data Protection Regulation (GDPR) where it applies, and other relevant data protection regulations. By using our website or services, you acknowledge that you have read and understood this Privacy Policy.',
        },
      ],
    },
    {
      id: 'collect',
      heading: '2. Information we collect',
      blocks: [
        { type: 'h3', text: 'Personal information you give us' },
        {
          type: 'p',
          text: 'We collect personal information that you provide voluntarily, including your name, email address, phone number, billing address, shipping address and payment information, when you place an order, create an account or contact customer service.',
        },
        { type: 'h3', text: 'Business information' },
        {
          type: 'p',
          text: 'For trade and commercial customers we may collect business names, tax identification numbers, professional licences and EPA certification details where these are necessary for the transaction or required by regulation.',
        },
        { type: 'h3', text: 'Technical information' },
        {
          type: 'p',
          text: 'We automatically collect certain technical information when you visit, including your IP address, browser type, operating system, referring website, pages viewed, and the dates and times of your visits, through cookies and similar technologies.',
        },
        { type: 'h3', text: 'Communication data' },
        {
          type: 'p',
          text: 'We retain records of communications between you and our customer service team, including emails, phone calls and chat sessions, in order to provide support and improve our service.',
        },
        {
          type: 'callout',
          title: 'What we never collect',
          text: 'We do not collect or store your full payment card number, card expiry date or security code. Those details are entered directly with our PCI DSS certified payment processor and are never visible to us.',
        },
      ],
    },
    {
      id: 'use',
      heading: '3. How we use your information',
      blocks: [
        {
          type: 'ul',
          items: [
            'Order processing and fulfilment — to process orders, arrange shipping, handle returns and provide support related to your purchases.',
            'Account management — to create and maintain your account, provide order history and save your preferences.',
            'Customer service — to respond to enquiries, resolve issues and improve how we support customers.',
            'Legal compliance — to meet tax obligations, consumer protection requirements, hazardous-goods and environmental regulations, and fraud prevention duties.',
            'Business operations — to analyse aggregated, de-identified data for website improvement and inventory planning.',
            'Marketing — to send you offers and product news, only where you have opted in, and only until you opt out.',
          ],
        },
      ],
    },
    {
      id: 'sharing',
      heading: '4. Information sharing and disclosure',
      blocks: [
        {
          type: 'p',
          text: 'We do not sell your personal information. We share it only in the circumstances described below.',
        },
        {
          type: 'table',
          head: ['Who', 'Why', 'What they receive'],
          rows: [
            ['Payment processors', 'To take payment securely', 'Billing details and order total'],
            ['Shipping carriers', 'To deliver your order', 'Name, delivery address, phone number'],
            ['Service providers', 'Hosting, email, analytics and support tooling', 'Only what each needs to perform its function'],
            ['Authorities', 'Where required by law or valid legal process', 'Only what the law requires'],
          ],
        },
        {
          type: 'p',
          text: 'All service providers are contractually bound to protect your information and to use it only for the purpose we engaged them for.',
        },
        { type: 'h3', text: 'Business transfers' },
        {
          type: 'p',
          text: 'In the event of a merger, acquisition or sale of business assets, customer information may be transferred as part of that transaction, subject to the same privacy protections set out in this policy.',
        },
      ],
    },
    {
      id: 'security',
      heading: '5. Data security and protection',
      blocks: [
        {
          type: 'p',
          text: 'We implement security measures designed to protect personal information against unauthorized access, alteration, disclosure or destruction. These include TLS encryption of data in transit, encryption of sensitive data at rest, strict internal access controls, and regular review of our systems.',
        },
        {
          type: 'p',
          text: 'Access to personal information is restricted to authorized personnel and service providers who need it to perform their role.',
        },
        {
          type: 'p',
          text: 'No method of transmission over the internet or electronic storage is completely secure. While we cannot guarantee absolute security, we commit to addressing any security incident promptly and to notifying affected users as required by law.',
        },
      ],
    },
    {
      id: 'cookies',
      heading: '6. Cookies and tracking technologies',
      blocks: [
        {
          type: 'p',
          text: 'Our website uses cookies and similar technologies to keep the site working, remember your preferences, understand traffic and improve the experience.',
        },
        {
          type: 'table',
          head: ['Type', 'Purpose', 'Can you disable it?'],
          rows: [
            ['Essential', 'Shopping cart, secure checkout, session security', 'No — the store cannot function without them'],
            ['Preference', 'Remembering choices such as sort order', 'Yes'],
            ['Analytics', 'Understanding how visitors use the site, in aggregate', 'Yes'],
          ],
        },
        {
          type: 'p',
          text: 'You can control cookies through your browser settings. Disabling non-essential cookies will not prevent you from shopping; disabling essential cookies will prevent the cart and checkout from working.',
        },
      ],
    },
    {
      id: 'rights',
      heading: '7. Your privacy rights',
      blocks: [
        {
          type: 'ul',
          items: [
            'Access — request a copy of the personal information we hold about you.',
            'Correction — request that inaccurate or incomplete information be corrected.',
            'Deletion — request deletion of your personal information, subject to legal and accounting retention requirements.',
            'Portability — request a copy of your information in a structured, machine-readable format.',
            'Opt out — unsubscribe from marketing at any time using the link in any marketing email, or by contacting us.',
            'Non-discrimination — we will not deny you goods or services, or charge you a different price, for exercising any of these rights.',
          ],
        },
        {
          type: 'p',
          text: `To exercise any of these rights, email ${E} with the subject line "Privacy request". We will verify your identity and respond within the timeframe required by applicable law, and in any case within 45 days.`,
        },
      ],
    },
    {
      id: 'retention',
      heading: '8. Data retention',
      blocks: [
        {
          type: 'p',
          text: 'We retain personal information only for as long as necessary to fulfil the purposes set out in this policy, to comply with legal obligations, to resolve disputes and to enforce our agreements.',
        },
        {
          type: 'table',
          head: ['Record type', 'Retention period'],
          rows: [
            ['Customer account information', 'While your account is active, plus a reasonable period afterwards'],
            ['Order and payment records', 'Seven years from the transaction date, for tax, warranty and legal compliance'],
            ['Customer service communications', 'Up to three years, for quality assurance and dispute resolution'],
            ['Marketing preferences', 'Until you opt out, plus a record of the opt-out itself'],
          ],
        },
        {
          type: 'p',
          text: 'When information is no longer needed we securely delete or anonymise it.',
        },
      ],
    },
    {
      id: 'third-parties',
      heading: '9. Third-party services and links',
      blocks: [
        {
          type: 'p',
          text: `Our website may contain links to third-party websites, services or applications that are not owned or controlled by ${site.legalName}. This Privacy Policy does not apply to them, and we are not responsible for their privacy practices or content. We encourage you to review the privacy policy of any third-party service you use.`,
        },
      ],
    },
    {
      id: 'children',
      heading: "10. Children's privacy",
      blocks: [
        {
          type: 'p',
          text: 'Our website and services are intended for individuals aged 18 or over. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will delete it promptly.',
        },
      ],
    },
    {
      id: 'transfers',
      heading: '11. International data transfers',
      blocks: [
        {
          type: 'p',
          text: 'We operate from the United States, and your personal information is processed there. If you access our services from outside the United States, you understand that your information will be transferred to and processed in the United States. Where we transfer personal information internationally, we ensure appropriate safeguards are in place in line with applicable privacy law.',
        },
      ],
    },
    {
      id: 'ccpa',
      heading: '12. California privacy rights (CCPA/CPRA)',
      blocks: [
        {
          type: 'p',
          text: 'California residents have additional rights under the California Consumer Privacy Act, including the right to know what personal information is collected, used, shared or sold; the right to delete personal information; the right to correct inaccurate personal information; and the right to opt out of the sale or sharing of personal information.',
        },
        {
          type: 'p',
          text: `We do not sell personal information, and we do not share it for cross-context behavioural advertising. To exercise your California rights, email ${E} or call ${P}.`,
        },
      ],
    },
    {
      id: 'updates',
      heading: '13. Updates to this Privacy Policy',
      blocks: [
        {
          type: 'p',
          text: 'We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements or business operations. Updated versions are posted on this page with a revised effective date. Continued use of our services after an update constitutes acceptance of the revised policy.',
        },
      ],
    },
    contactSection(
      'If you have questions about this Privacy Policy, wish to exercise your privacy rights, or want to make a complaint about our data practices, contact us:'
    ),
  ],
};

/* ---------------------------------------------------------------- terms */

export const termsPolicy: Policy = {
  slug: 'terms',
  title: 'Terms of Service',
  summary: `The terms that govern your use of ${site.domain} and any purchase you make from ${site.name}.`,
  updated: UPDATED,
  sections: [
    {
      id: 'agreement',
      heading: 'Overview',
      blocks: [
        {
          type: 'p',
          text: `This website is operated by ${site.legalName}. Throughout the site, the terms "we", "us" and "our" refer to ${site.legalName}, trading as ${site.name}.`,
        },
        {
          type: 'p',
          text: 'By visiting this site or purchasing something from us, you engage in our Service and agree to be bound by these Terms of Service, including any additional terms and policies referenced here or available by hyperlink. These Terms apply to all users of the site, including browsers, customers, vendors and contributors of content.',
        },
        {
          type: 'p',
          text: 'Please read these Terms carefully before using the website. If you do not agree to all of them, you may not use the website or its services.',
        },
      ],
    },
    {
      id: 'store-terms',
      heading: '1. Online store terms',
      blocks: [
        {
          type: 'p',
          text: 'By agreeing to these Terms you confirm that you are at least the age of majority in your state or province of residence, or that you have given consent for any minor dependants to use this site.',
        },
        {
          type: 'p',
          text: 'You may not use our products for any illegal or unauthorized purpose, nor may you violate any law in your jurisdiction, including copyright law. You must not transmit any worms, viruses or code of a destructive nature. A breach of these Terms will result in immediate termination of your access to our services.',
        },
      ],
    },
    {
      id: 'general',
      heading: '2. General conditions',
      blocks: [
        {
          type: 'p',
          text: 'We reserve the right to refuse service to anyone, for any lawful reason, at any time.',
        },
        {
          type: 'p',
          text: 'You understand that your content, excluding payment information, may be transferred unencrypted and involve transmission over various networks, and adaptation to conform to technical requirements. Payment card information is always encrypted in transit.',
        },
        {
          type: 'p',
          text: 'You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service or the website without our express written permission.',
        },
      ],
    },
    {
      id: 'accuracy',
      heading: '3. Accuracy and currency of information',
      blocks: [
        {
          type: 'p',
          text: 'We make every effort to ensure the information on this site is accurate, complete and current. However, we do not warrant that all content is error-free or up to date. Material on this site is provided for general information only and should not be relied upon as the sole basis for a decision without consulting a more accurate or complete source.',
        },
        {
          type: 'p',
          text: 'We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information. You agree that it is your responsibility to monitor changes to our site.',
        },
      ],
    },
    {
      id: 'pricing',
      heading: '4. Modifications to the service and prices',
      blocks: [
        {
          type: 'p',
          text: 'Prices for our products are subject to change without notice. We reserve the right to modify or discontinue the Service, or any part of it, without notice at any time.',
        },
        {
          type: 'p',
          text: 'The price that applies to your order is the price displayed at the moment you complete checkout. We will not charge you more than that price without your consent. We shall not be liable to you or to any third party for any modification, price change, suspension or discontinuance of the Service.',
        },
      ],
    },
    {
      id: 'products',
      heading: '5. Products and returns',
      blocks: [
        {
          type: 'p',
          text: 'Certain products may be available exclusively online and in limited quantities. All purchases made through this website are subject to our Refunds and Returns Policy, Shipping Policy, Warranty and Replacement Policy, and Order Acceptance and Cancellation Policy, each of which forms part of these Terms.',
        },
        {
          type: 'p',
          text: 'We have made every effort to display product colours and images accurately. We cannot guarantee that your display will render a colour accurately.',
        },
        {
          type: 'p',
          text: 'We reserve the right to limit the sales of our products to any person, geographic region or jurisdiction, and to limit the quantities of any products we offer.',
        },
      ],
    },
    {
      id: 'regulated',
      heading: '6. Regulated products',
      blocks: [
        {
          type: 'callout',
          title: 'Refrigerants and controlled substances',
          text: 'Certain refrigerants sold on this website may lawfully be sold only to buyers who hold the appropriate certification under Section 608 or Section 609 of the U.S. Clean Air Act. By ordering a regulated product you represent and warrant that you hold the certification your purchase requires, that the information you provide about it is accurate, and that you will handle, charge, store and recover the product in accordance with EPA regulations and all applicable law.',
        },
        {
          type: 'p',
          text: 'We may require evidence of certification before releasing an order, and we will cancel and refund in full any order we cannot verify. Reselling a regulated product to an uncertified buyer is your responsibility and may be unlawful.',
        },
      ],
    },
    {
      id: 'billing',
      heading: '7. Accuracy of billing and account information',
      blocks: [
        {
          type: 'p',
          text: 'You agree to provide current, complete and accurate purchase and account information for all purchases made on this site, and to update that information promptly so that we can complete your transactions and contact you as needed.',
        },
        {
          type: 'p',
          text: 'We reserve the right to refuse any order you place with us, and to limit or cancel quantities purchased per person, per household or per order, as set out in our Order Acceptance and Cancellation Policy.',
        },
      ],
    },
    {
      id: 'third-party-tools',
      heading: '8. Optional tools and third-party links',
      blocks: [
        {
          type: 'p',
          text: 'We may provide access to third-party tools over which we neither monitor nor have any control. You acknowledge that such tools are provided "as is" and "as available" without any warranties, and that your use of them is entirely at your own risk.',
        },
        {
          type: 'p',
          text: 'Third-party links on this site may direct you to websites that are not affiliated with us. We are not responsible for examining or evaluating their content or accuracy, and we do not warrant or accept liability for any third-party materials or websites. Please review the policies of any third party before you transact with them.',
        },
      ],
    },
    {
      id: 'submissions',
      heading: '9. User comments and submissions',
      blocks: [
        {
          type: 'p',
          text: 'If you send us creative ideas, suggestions, proposals, plans, reviews or other materials, whether at our request or not, you agree that we may edit, copy, publish, distribute, translate and otherwise use them in any medium, without restriction and without obligation to compensate you.',
        },
        {
          type: 'p',
          text: 'You agree that your comments will not violate any right of any third party, will not contain unlawful, abusive or obscene material, and will not contain any computer virus or malware. You are solely responsible for any comments you make and their accuracy.',
        },
      ],
    },
    {
      id: 'personal-data',
      heading: '10. Personal information',
      blocks: [
        {
          type: 'p',
          text: 'Your submission of personal information through this store is governed by our Privacy Policy.',
        },
      ],
    },
    {
      id: 'errors',
      heading: '11. Errors, inaccuracies and omissions',
      blocks: [
        {
          type: 'p',
          text: 'Occasionally there may be information on our site that contains typographical errors, inaccuracies or omissions relating to product descriptions, pricing, promotions, offers, shipping charges, transit times or availability.',
        },
        {
          type: 'p',
          text: 'We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel orders if any information is inaccurate, at any time and without prior notice, including after you have submitted your order. Where a correction affects an order you have already placed, we will contact you before proceeding.',
        },
      ],
    },
    {
      id: 'prohibited',
      heading: '12. Prohibited uses',
      blocks: [
        {
          type: 'p',
          text: 'In addition to other prohibitions set out in these Terms, you are prohibited from using the site or its content:',
        },
        {
          type: 'ul',
          items: [
            'For any unlawful purpose, or to solicit others to perform any unlawful act',
            'To violate any international, federal, state or local regulation, rule or law',
            'To infringe upon our intellectual property rights or those of others',
            'To harass, abuse, insult, harm, defame, slander, disparage, intimidate or discriminate',
            'To submit false or misleading information',
            'To upload or transmit viruses or any other type of malicious code',
            'To collect or track the personal information of others',
            'To spam, phish, pharm, pretext, spider, crawl or scrape',
            'For any obscene or immoral purpose',
            'To interfere with or circumvent the security features of the Service',
          ],
        },
        {
          type: 'p',
          text: 'We reserve the right to terminate your use of the Service for violating any of these prohibited uses.',
        },
      ],
    },
    {
      id: 'disclaimer',
      heading: '13. Disclaimer of warranties and limitation of liability',
      blocks: [
        {
          type: 'p',
          text: 'We do not guarantee that your use of our Service will be uninterrupted, timely, secure or error-free, or that the results obtained from using it will be accurate or reliable.',
        },
        {
          type: 'p',
          text: `To the maximum extent permitted by law, ${site.legalName}, its directors, officers, employees and affiliates shall not be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special or consequential damages arising from your use of the Service or of any products procured using the Service.`,
        },
        {
          type: 'p',
          text: 'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for death or personal injury caused by negligence, or for fraud. Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for consequential damages; in those jurisdictions our liability is limited to the maximum extent permitted by law.',
        },
        {
          type: 'p',
          text: 'This does not affect the Three-Year Limited Warranty we provide on the products we sell, or your statutory consumer rights.',
        },
      ],
    },
    {
      id: 'indemnification',
      heading: '14. Indemnification',
      blocks: [
        {
          type: 'p',
          text: `You agree to indemnify, defend and hold harmless ${site.legalName} and our parent, subsidiaries, affiliates, partners, officers, directors, agents and employees from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your breach of these Terms of Service or your violation of any law or the rights of a third party.`,
        },
      ],
    },
    {
      id: 'severability',
      heading: '15. Severability',
      blocks: [
        {
          type: 'p',
          text: 'If any provision of these Terms of Service is determined to be unlawful, void or unenforceable, that provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed severed. Such a determination shall not affect the validity and enforceability of any other remaining provisions.',
        },
      ],
    },
    {
      id: 'termination',
      heading: '16. Termination',
      blocks: [
        {
          type: 'p',
          text: 'The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes.',
        },
        {
          type: 'p',
          text: 'These Terms are effective unless and until terminated by either you or us. You may terminate them at any time by notifying us that you no longer wish to use our services, or by ceasing to use the site.',
        },
      ],
    },
    {
      id: 'entire-agreement',
      heading: '17. Entire agreement',
      blocks: [
        {
          type: 'p',
          text: 'These Terms of Service, together with any policies or operating rules posted by us on this site, constitute the entire agreement and understanding between you and us, and govern your use of the Service. They supersede any prior agreements or communications between you and us.',
        },
        {
          type: 'p',
          text: 'Any ambiguity in the interpretation of these Terms shall not be construed against the drafting party.',
        },
      ],
    },
    {
      id: 'governing-law',
      heading: '18. Governing law',
      blocks: [
        {
          type: 'p',
          text: `These Terms of Service, and any separate agreements by which we provide you services, shall be governed by and construed in accordance with the laws of the State of ${site.address.regionName}, United States, without regard to its conflict of law provisions.`,
        },
      ],
    },
    {
      id: 'changes',
      heading: '19. Changes to these Terms',
      blocks: [
        {
          type: 'p',
          text: 'You can review the most current version of these Terms of Service at any time on this page. We reserve the right to update, change or replace any part of them by posting updates to our website. It is your responsibility to check this page periodically. Your continued use of the website following the posting of any changes constitutes acceptance of those changes.',
        },
      ],
    },
    contactSection('Questions about these Terms of Service should be sent to us at:'),
  ],
};

/* -------------------------------------------------------- accessibility */

export const accessibilityPolicy: Policy = {
  slug: 'accessibility',
  title: 'Accessibility Statement',
  summary: `Our commitment to keeping ${site.domain} usable for everyone, and how to tell us when we fall short.`,
  updated: UPDATED,
  sections: [
    {
      id: 'commitment',
      heading: 'Our commitment',
      blocks: [
        {
          type: 'p',
          text: `${site.name} is committed to making this website usable by as many people as possible, regardless of technology or ability. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA.`,
        },
      ],
    },
    {
      id: 'measures',
      heading: 'What we have done',
      blocks: [
        {
          type: 'ul',
          items: [
            'Semantic HTML structure with a single main landmark and a skip-to-content link on every page',
            'Keyboard access to every interactive control, with a visible focus indicator',
            'Text and interface colours tested for WCAG AA contrast',
            'Descriptive alternative text on product and content imagery',
            'Form fields with associated labels and clear, text-based error messages',
            'Respect for the operating system "reduce motion" preference',
            'Layouts that reflow without horizontal scrolling down to 320px wide',
          ],
        },
      ],
    },
    {
      id: 'limitations',
      heading: 'Known limitations',
      blocks: [
        {
          type: 'p',
          text: 'Some product descriptions and images are supplied by manufacturers, and their alternative text may be less descriptive than text we author ourselves. We review and improve these as we identify them.',
        },
      ],
    },
    {
      id: 'feedback',
      heading: 'Tell us about a problem',
      blocks: [
        {
          type: 'p',
          text: `If you encounter a barrier on this website, or need information in an alternative format, contact us at ${E} or ${P}. Please describe the page and what you were trying to do. We aim to respond within one business day and to resolve accessibility issues as a priority.`,
        },
        {
          type: 'p',
          text: 'If you would rather place an order by phone than on the website, we are glad to take it that way — call us during support hours and we will handle it for you.',
        },
      ],
    },
    contactSection('For accessibility support, contact us:'),
  ],
};
