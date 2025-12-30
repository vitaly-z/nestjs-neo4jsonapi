import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JsonApiDataInterface } from "../../../core/jsonapi";
import { JsonApiPaginator } from "../../../core/jsonapi";
import { JsonApiService } from "../../../core/jsonapi";
import { StripePriceModel } from "../entities/stripe-price.model";
import { StripePriceRepository } from "../repositories/stripe-price.repository";
import { StripeProductAdminService } from "../../stripe-product/services/stripe-product-admin.service";
import { StripeProductApiService } from "../../stripe-product/services/stripe-product-api.service";
import { StripeProductRepository } from "../../stripe-product/repositories/stripe-product.repository";

/**
 * BillingAdminService
 *
 * Administrative service for managing Stripe prices in the billing system.
 * Provides CRUD operations for prices, with two-way sync between Stripe and local database.
 *
 * Key Features:
 * - Price management (create, update, list)
 * - Support for one-time and recurring prices
 * - Support for usage-based billing with meters
 * - Sync prices from Stripe webhooks
 * - Filter prices by active status and product
 *
 * This service is typically used by admin/backend operations to set up billing pricing
 * before customers subscribe.
 *
 * Note: Product management has been moved to StripeProductAdminService.
 */
@Injectable()
export class BillingAdminService {
  constructor(
    private readonly stripePriceRepository: StripePriceRepository,
    private readonly stripeProductRepository: StripeProductRepository,
    private readonly stripeProductApiService: StripeProductApiService,
    private readonly stripeProductAdminService: StripeProductAdminService,
    private readonly jsonApiService: JsonApiService,
  ) {}

  /**
   * List all prices
   *
   * @param params - Parameters
   * @param params.query - JSON:API query parameters for pagination
   * @param params.productId - Optional filter by product ID
   * @param params.active - Optional filter by active status
   * @returns JSON:API formatted list of prices
   *
   * @example
   * ```typescript
   * const prices = await billingAdminService.listPrices({
   *   query: { page: { number: 1, size: 10 } },
   *   productId: 'prod_123',
   *   active: true
   * });
   * ```
   */
  async listPrices(params: { query: any; productId?: string; active?: boolean }): Promise<JsonApiDataInterface> {
    const paginator = new JsonApiPaginator(params.query);

    const prices = await this.stripePriceRepository.findAll({
      productId: params.productId,
      active: params.active,
    });

    return this.jsonApiService.buildList(StripePriceModel, prices, paginator);
  }

  /**
   * Get a single price by ID
   *
   * @param params - Parameters
   * @param params.id - Price ID
   * @returns JSON:API formatted price data
   * @throws {HttpException} NOT_FOUND if price not found
   */
  async getPrice(params: { id: string }): Promise<JsonApiDataInterface> {
    const price = await this.stripePriceRepository.findById({ id: params.id });

    if (!price) {
      throw new HttpException("Price not found", HttpStatus.NOT_FOUND);
    }

    return this.jsonApiService.buildSingle(StripePriceModel, price);
  }

  /**
   * Create a new price
   *
   * Creates both a Stripe price and a local database record. Supports both one-time
   * and recurring prices, including usage-based billing with meters.
   *
   * @param params - Price parameters
   * @param params.productId - Product ID to attach price to
   * @param params.unitAmount - Price amount in smallest currency unit (e.g., cents)
   * @param params.currency - Currency code (e.g., 'usd', 'eur')
   * @param params.nickname - Optional display name
   * @param params.lookupKey - Optional lookup key for referencing price
   * @param params.recurring - Optional recurring billing configuration
   * @param params.recurring.interval - Billing interval (day, week, month, year)
   * @param params.recurring.intervalCount - Number of intervals between billings
   * @param params.recurring.meter - Optional meter ID for usage-based billing
   * @param params.metadata - Optional metadata key-value pairs
   * @returns JSON:API formatted price data
   * @throws {HttpException} NOT_FOUND if product not found
   *
   * @example
   * ```typescript
   * // Create a monthly subscription price
   * const price = await billingAdminService.createPrice({
   *   productId: 'prod_123',
   *   unitAmount: 2999, // $29.99
   *   currency: 'usd',
   *   nickname: 'Monthly Premium',
   *   recurring: {
   *     interval: 'month',
   *     intervalCount: 1
   *   }
   * });
   * ```
   */
  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    nickname?: string;
    lookupKey?: string;
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      intervalCount?: number;
      meter?: string;
    };
    metadata?: Record<string, string>;
  }): Promise<JsonApiDataInterface> {
    const product = await this.stripeProductRepository.findById({ id: params.productId });

    if (!product) {
      throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
    }

    const stripePrice = await this.stripeProductApiService.createPrice({
      productId: product.stripeProductId,
      unitAmount: params.unitAmount,
      currency: params.currency,
      nickname: params.nickname,
      lookupKey: params.lookupKey,
      recurring: params.recurring,
      metadata: params.metadata,
    });

    const price = await this.stripePriceRepository.create({
      productId: params.productId,
      stripePriceId: stripePrice.id,
      active: stripePrice.active,
      currency: params.currency,
      unitAmount: params.unitAmount,
      priceType: params.recurring ? "recurring" : "one_time",
      recurringInterval: params.recurring?.interval,
      recurringIntervalCount: params.recurring?.intervalCount,
      recurringUsageType: params.recurring?.meter ? "metered" : "licensed",
      nickname: params.nickname,
      lookupKey: params.lookupKey,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });

    return this.jsonApiService.buildSingle(StripePriceModel, price);
  }

  /**
   * Update an existing price
   *
   * Note: Most price fields are immutable in Stripe. Only nickname and metadata can be updated.
   *
   * @param params - Update parameters
   * @param params.id - Price ID
   * @param params.nickname - Optional new nickname
   * @param params.metadata - Optional new metadata
   * @returns JSON:API formatted updated price data
   * @throws {HttpException} NOT_FOUND if price not found
   */
  async updatePrice(params: {
    id: string;
    nickname?: string;
    metadata?: Record<string, string>;
  }): Promise<JsonApiDataInterface> {
    const existingPrice = await this.stripePriceRepository.findById({ id: params.id });

    if (!existingPrice) {
      throw new HttpException("Price not found", HttpStatus.NOT_FOUND);
    }

    await this.stripeProductApiService.updatePrice({
      priceId: existingPrice.stripePriceId,
      nickname: params.nickname,
      metadata: params.metadata,
    });

    const price = await this.stripePriceRepository.update({
      id: params.id,
      nickname: params.nickname,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });

    return this.jsonApiService.buildSingle(StripePriceModel, price);
  }


  /**
   * Sync price data from Stripe to local database
   *
   * Fetches the latest price data from Stripe and updates or creates the local database record.
   * Automatically syncs the associated product if not found locally.
   * Used primarily by webhook handlers to keep data in sync.
   *
   * @param params - Parameters
   * @param params.stripePriceId - Stripe price ID to sync
   * @returns Promise that resolves when sync is complete
   */
  async syncPriceFromStripe(params: { stripePriceId: string }): Promise<void> {
    const stripePrice = await this.stripeProductApiService.retrievePrice(params.stripePriceId);

    const existingPrice = await this.stripePriceRepository.findByStripePriceId({
      stripePriceId: params.stripePriceId,
    });

    if (existingPrice) {
      await this.stripePriceRepository.updateByStripePriceId({
        stripePriceId: params.stripePriceId,
        active: stripePrice.active,
        nickname: stripePrice.nickname ?? undefined,
        metadata: stripePrice.metadata ? JSON.stringify(stripePrice.metadata) : undefined,
      });
    } else {
      const productId = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;

      let product = await this.stripeProductRepository.findByStripeProductId({
        stripeProductId: productId,
      });

      if (!product) {
        await this.stripeProductAdminService.syncProductFromStripe({ stripeProductId: productId });
        product = await this.stripeProductRepository.findByStripeProductId({
          stripeProductId: productId,
        });
      }

      if (product) {
        await this.stripePriceRepository.create({
          productId: product.id,
          stripePriceId: stripePrice.id,
          active: stripePrice.active,
          currency: stripePrice.currency,
          unitAmount: stripePrice.unit_amount ?? undefined,
          priceType: stripePrice.type === "recurring" ? "recurring" : "one_time",
          recurringInterval: stripePrice.recurring?.interval,
          recurringIntervalCount: stripePrice.recurring?.interval_count,
          recurringUsageType: stripePrice.recurring?.meter ? "metered" : "licensed",
          nickname: stripePrice.nickname ?? undefined,
          lookupKey: stripePrice.lookup_key ?? undefined,
          metadata: stripePrice.metadata ? JSON.stringify(stripePrice.metadata) : undefined,
        });
      }
    }
  }
}
