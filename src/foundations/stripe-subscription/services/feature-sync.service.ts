import { Injectable } from "@nestjs/common";
import { AppLoggingService } from "../../../core/logging";
import { CompanyRepository } from "../../company/repositories/company.repository";
import { StripePriceRepository } from "../../stripe-price/repositories/stripe-price.repository";
import { StripeSubscriptionRepository } from "../repositories/stripe-subscription.repository";

export interface FeatureSyncResult {
  success: boolean;
  companyId?: string;
  featuresAdded?: string[];
  featuresRemoved?: string[];
  reason?: string;
}

@Injectable()
export class FeatureSyncService {
  constructor(
    private readonly subscriptionRepository: StripeSubscriptionRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly stripePriceRepository: StripePriceRepository,
    private readonly logger: AppLoggingService,
  ) {}

  /**
   * Add price features to company on subscription payment
   * Additive operation - merges with existing features
   */
  async syncFeaturesOnPayment(params: { stripeSubscriptionId: string }): Promise<FeatureSyncResult> {
    // 1. Find subscription with price
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId({
      stripeSubscriptionId: params.stripeSubscriptionId,
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${params.stripeSubscriptionId} not found for feature sync`);
      return { success: false, reason: "Subscription not found" };
    }

    // 2. Skip if not recurring (priceType !== "recurring")
    if (subscription.stripePrice?.priceType !== "recurring") {
      this.logger.debug(`Skipping feature sync for non-recurring price ${subscription.stripePrice?.id}`);
      return { success: true, reason: "Not a recurring subscription" };
    }

    // 3. Get price's features via stripePriceRepository.findById()
    const priceWithFeatures = await this.stripePriceRepository.findById({
      id: subscription.stripePrice.id,
    });

    const priceFeatureIds = priceWithFeatures?.feature?.map((f) => f.id) ?? [];

    if (priceFeatureIds.length === 0) {
      this.logger.debug(`No features configured for price ${subscription.stripePrice.id} - skipping sync`);
      return { success: true, reason: "No features configured for this price" };
    }

    // 4. Find company via subscription.stripeCustomer
    const company = await this.companyRepository.findByStripeCustomerId({
      stripeCustomerId: subscription.stripeCustomer?.id ?? "",
    });

    if (!company) {
      this.logger.error(`Company not found for subscription ${params.stripeSubscriptionId}`);
      return { success: false, reason: "Company not found" };
    }

    // 5. Call companyRepository.addFeatures() - additive
    const addedFeatureIds = await this.companyRepository.addFeatures({
      companyId: company.id,
      featureIds: priceFeatureIds,
    });

    // 6. Log and return result
    this.logger.log(
      `Feature sync on payment: Company ${company.id} - added ${addedFeatureIds.length} features from price ${subscription.stripePrice.id}`,
    );

    return {
      success: true,
      companyId: company.id,
      featuresAdded: addedFeatureIds,
    };
  }

  /**
   * Remove price features from company on subscription end
   * SMART REMOVAL: Only removes features NOT provided by other active subscriptions
   */
  async removeFeaturesOnSubscriptionEnd(params: { stripeSubscriptionId: string }): Promise<FeatureSyncResult> {
    // 1. Find subscription with price
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId({
      stripeSubscriptionId: params.stripeSubscriptionId,
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${params.stripeSubscriptionId} not found for feature removal`);
      return { success: false, reason: "Subscription not found" };
    }

    // 2. Skip if not recurring (priceType !== "recurring")
    if (subscription.stripePrice?.priceType !== "recurring") {
      this.logger.debug(`Skipping feature removal for non-recurring price ${subscription.stripePrice?.id}`);
      return { success: true, reason: "Not a recurring subscription" };
    }

    // 3. Get price's features
    const priceWithFeatures = await this.stripePriceRepository.findById({
      id: subscription.stripePrice.id,
    });

    const priceFeatureIds = priceWithFeatures?.feature?.map((f) => f.id) ?? [];

    if (priceFeatureIds.length === 0) {
      this.logger.debug(`No features configured for price ${subscription.stripePrice.id} - skipping removal`);
      return { success: true, reason: "No features configured for this price" };
    }

    // 4. Find company
    const company = await this.companyRepository.findByStripeCustomerId({
      stripeCustomerId: subscription.stripeCustomer?.id ?? "",
    });

    if (!company) {
      this.logger.error(`Company not found for subscription ${params.stripeSubscriptionId}`);
      return { success: false, reason: "Company not found" };
    }

    // 5. SMART REMOVAL LOGIC:
    //    a. Get all OTHER active subscriptions for this company's customer
    const otherActiveFeatureIds = new Set<string>();

    const allSubscriptions = await this.subscriptionRepository.findActiveByStripeCustomerId({
      stripeCustomerId: subscription.stripeCustomer?.stripeCustomerId ?? "",
    });

    //    b. Collect features from all those active subscriptions
    for (const otherSub of allSubscriptions) {
      // Exclude the subscription being cancelled
      if (otherSub.stripeSubscriptionId === params.stripeSubscriptionId) continue;
      // Skip non-recurring
      if (otherSub.stripePrice?.priceType !== "recurring") continue;

      const otherPrice = await this.stripePriceRepository.findById({
        id: otherSub.stripePrice.id,
      });
      otherPrice?.feature?.forEach((f) => otherActiveFeatureIds.add(f.id));
    }

    //    c. Only remove features NOT in that set
    const featuresToRemove = priceFeatureIds.filter((id) => !otherActiveFeatureIds.has(id));

    if (featuresToRemove.length === 0) {
      this.logger.debug(
        `All features for price ${subscription.stripePrice.id} are covered by other active subscriptions - skipping removal`,
      );
      return { success: true, reason: "All features covered by other active subscriptions" };
    }

    // 6. Call companyRepository.removeFeatures() with filtered list
    const removedFeatureIds = await this.companyRepository.removeFeatures({
      companyId: company.id,
      featureIds: featuresToRemove,
    });

    // 7. Log and return result
    this.logger.log(
      `Feature removal on subscription end: Company ${company.id} - removed ${removedFeatureIds.length} features`,
    );

    return {
      success: true,
      companyId: company.id,
      featuresRemoved: removedFeatureIds,
    };
  }
}
