/**
 * Interface for referral completion handling.
 *
 * Allows consuming applications to provide their own referral completion implementation
 * that handles awarding tokens to referrer and referred companies.
 *
 * Use with @Optional() @Inject(REFERRAL_COMPLETION_HANDLER) to make it optional.
 */
export interface ReferralCompletionHandler {
  /**
   * Complete a referral when a payment is made by the referred company.
   * Awards tokens to both the referrer and referred companies.
   *
   * @param params.referredCompanyId - The ID of the company that made the payment
   * @returns Promise that resolves when referral completion is complete
   */
  completeReferralOnPayment(params: { referredCompanyId: string }): Promise<void>;
}

/**
 * Injection token for optional referral completion handler.
 * If not provided, referral completion logic is skipped.
 */
export const REFERRAL_COMPLETION_HANDLER = Symbol("REFERRAL_COMPLETION_HANDLER");
