/**
 * Stripe Promotion Code validation result entity.
 * This is a transient entity used for API responses, not stored in the database.
 */
export interface StripePromotionCode {
  id: string;
  valid: boolean;
  promotionCodeId?: string;
  code: string;
  discountType?: "percent_off" | "amount_off";
  discountValue?: number;
  currency?: string;
  duration?: "forever" | "once" | "repeating";
  durationInMonths?: number;
  errorMessage?: string;
}
