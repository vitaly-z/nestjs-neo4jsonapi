import { Injectable } from "@nestjs/common";
import { AppLoggingService } from "../../../core/logging";
import { Company } from "../../company/entities/company.entity";
import { CompanyRepository } from "../../company/repositories/company.repository";
import { StripePriceRepository } from "../../stripe-price/repositories/stripe-price.repository";
import { StripeSubscriptionRepository } from "../repositories/stripe-subscription.repository";

export interface TokenAllocationResult {
  success: boolean;
  companyId?: string;
  tokensAllocated?: number;
  previousTokens?: number;
  reason?: string;
}

@Injectable()
export class TokenAllocationService {
  constructor(
    private readonly subscriptionRepository: StripeSubscriptionRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly stripePriceRepository: StripePriceRepository,
    private readonly logger: AppLoggingService,
  ) {}

  /**
   * Allocate full tokens on subscription payment (new or renewal)
   *
   * Called when invoice.paid webhook is received. Resets company tokens
   * to full plan amount. Previous unused tokens are lost (no rollover).
   *
   * @param params - Allocation parameters
   * @param params.stripeSubscriptionId - Stripe subscription ID (sub_xxx)
   * @returns Result indicating success/failure and tokens allocated
   */
  async allocateTokensOnPayment(params: { stripeSubscriptionId: string }): Promise<TokenAllocationResult> {
    console.log(`[TokenAllocation] allocateTokensOnPayment called for subscription: ${params.stripeSubscriptionId}`);

    // 1. Find subscription with price
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId({
      stripeSubscriptionId: params.stripeSubscriptionId,
    });

    if (!subscription) {
      console.log(`[TokenAllocation] Subscription NOT FOUND: ${params.stripeSubscriptionId}`);
      this.logger.warn(`Subscription ${params.stripeSubscriptionId} not found for token allocation`);
      return { success: false, reason: "Subscription not found" };
    }

    console.log(`[TokenAllocation] Found subscription: ${subscription.id}`);

    // 2. Get price tokens
    const price = subscription.stripePrice;
    console.log(`[TokenAllocation] Price info:`, { priceId: price?.id, tokens: price?.token });

    if (!price || price.token === undefined || price.token === null) {
      console.log(`[TokenAllocation] No tokens on price - skipping allocation`);
      this.logger.debug(`No tokens configured for price ${price?.id} - skipping allocation`);
      return { success: true, reason: "No tokens configured for this plan" };
    }

    // 3. Find company via customer relationship
    const company = await this.findCompanyBySubscription(subscription.stripeCustomer?.id);
    console.log(`[TokenAllocation] Company ID: ${company?.id}`);

    if (!company) {
      console.log(`[TokenAllocation] Company NOT FOUND for subscription`);
      this.logger.error(`Company not found for subscription ${params.stripeSubscriptionId}`);
      return { success: false, reason: "Company not found" };
    }

    // 4. Get current company state
    const previousTokens = Number(company.availableMonthlyTokens ?? 0);
    console.log(`[TokenAllocation] Current tokens: ${previousTokens}, New tokens: ${price.token}`);

    // 5. Reset monthly tokens to full amount
    await this.companyRepository.updateTokens({
      companyId: company.id,
      monthlyTokens: price.token,
      availableMonthlyTokens: price.token,
    });

    console.log(`[TokenAllocation] ✅ SUCCESS - Allocated ${price.token} tokens to company ${company.id}`);
    this.logger.log(
      `Token allocation on payment: Company ${company.id} - reset from ${previousTokens} to ${price.token} tokens`,
    );

    return {
      success: true,
      companyId: company.id,
      tokensAllocated: price.token,
      previousTokens,
    };
  }

  /**
   * Allocate pro-rated tokens on mid-cycle plan change
   *
   * Called when customer.subscription.updated webhook is received with a price change.
   * Calculates tokens based on remaining days in billing cycle.
   *
   * Formula: floor(newPlanTokens * (remainingDays / totalDays))
   *
   * @param params - Allocation parameters
   * @param params.stripeSubscriptionId - Stripe subscription ID (sub_xxx)
   * @param params.newPriceId - Internal price ID (not Stripe price_xxx)
   * @returns Result indicating success/failure and tokens allocated
   */
  async allocateProratedTokensOnPlanChange(params: {
    stripeSubscriptionId: string;
    newPriceId: string;
  }): Promise<TokenAllocationResult> {
    console.log(`[TokenAllocation] allocateProratedTokensOnPlanChange called`, {
      subscriptionId: params.stripeSubscriptionId,
      newPriceId: params.newPriceId,
    });

    // 1. Find subscription
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId({
      stripeSubscriptionId: params.stripeSubscriptionId,
    });

    if (!subscription) {
      console.log(`[TokenAllocation] Subscription NOT FOUND: ${params.stripeSubscriptionId}`);
      this.logger.warn(`Subscription ${params.stripeSubscriptionId} not found for prorated allocation`);
      return { success: false, reason: "Subscription not found" };
    }

    console.log(`[TokenAllocation] Found subscription with period:`, {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    });

    // 2. Get new price tokens
    const newPrice = await this.stripePriceRepository.findById({
      id: params.newPriceId,
    });
    console.log(`[TokenAllocation] New price info:`, { priceId: newPrice?.id, tokens: newPrice?.token });

    if (!newPrice || newPrice.token === undefined || newPrice.token === null) {
      console.log(`[TokenAllocation] No tokens on new price - skipping allocation`);
      this.logger.debug(`No tokens configured for new price ${params.newPriceId} - skipping allocation`);
      return { success: true, reason: "No tokens configured for new plan" };
    }

    // 3. Calculate pro-rated tokens
    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);

    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = Math.max(0, (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const proratedTokens = Math.floor(newPrice.token * (remainingDays / totalDays));

    console.log(`[TokenAllocation] Pro-ration calculation:`, {
      totalDays: totalDays.toFixed(1),
      remainingDays: remainingDays.toFixed(1),
      fullTokens: newPrice.token,
      proratedTokens,
    });

    // 4. Find company
    const company = await this.findCompanyBySubscription(subscription.stripeCustomer?.id);
    console.log(`[TokenAllocation] Company ID: ${company?.id}`);

    if (!company) {
      console.log(`[TokenAllocation] Company NOT FOUND for subscription`);
      this.logger.error(`Company not found for subscription ${params.stripeSubscriptionId}`);
      return { success: false, reason: "Company not found" };
    }

    // 5. Get current company state
    const previousTokens = Number(company.availableMonthlyTokens ?? 0);
    console.log(`[TokenAllocation] Current tokens: ${previousTokens}, Prorated tokens: ${proratedTokens}`);

    // 6. Reset to prorated amount
    await this.companyRepository.updateTokens({
      companyId: company.id,
      monthlyTokens: newPrice.token,
      availableMonthlyTokens: proratedTokens,
    });

    console.log(`[TokenAllocation] ✅ SUCCESS - Allocated ${proratedTokens} prorated tokens to company ${company.id}`);
    this.logger.log(
      `Prorated token allocation: Company ${company.id} - reset from ${previousTokens} to ${proratedTokens} tokens (${remainingDays.toFixed(1)}/${totalDays.toFixed(1)} days remaining)`,
    );

    return {
      success: true,
      companyId: company.id,
      tokensAllocated: proratedTokens,
      previousTokens,
    };
  }

  /**
   * Helper to find company from subscription's customer
   */
  private async findCompanyBySubscription(stripeCustomerInternalId?: string): Promise<Company | null> {
    if (!stripeCustomerInternalId) return null;
    return this.companyRepository.findByStripeCustomerId({
      stripeCustomerId: stripeCustomerInternalId,
    });
  }
}
