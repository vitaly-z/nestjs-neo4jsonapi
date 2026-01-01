/**
 * StripePaymentMethod entity
 *
 * Represents a payment method attached to a Stripe customer.
 * This is a transient entity - not stored in Neo4j, only fetched from Stripe.
 */
export type StripePaymentMethod = {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingName?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  billingAddressCity?: string | null;
  billingAddressCountry?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingAddressPostalCode?: string | null;
  billingAddressState?: string | null;
};
