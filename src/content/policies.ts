import type { Policy } from '@/lib/policy-types';
import {
  shippingPolicy,
  returnsPolicy,
  authenticityPolicy,
  orderAcceptancePolicy,
  paymentSecurityPolicy,
} from './policies-commerce';
import { privacyPolicy, termsPolicy, accessibilityPolicy } from './policies-legal';

/** Order here drives the policy index page and the sitemap. */
export const policies: Policy[] = [
  shippingPolicy,
  returnsPolicy,
  authenticityPolicy,
  orderAcceptancePolicy,
  paymentSecurityPolicy,
  privacyPolicy,
  termsPolicy,
  accessibilityPolicy,
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
