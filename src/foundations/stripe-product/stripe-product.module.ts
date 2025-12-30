import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { StripeModule } from "../stripe/stripe.module";
import { StripeProductController } from "./controllers/stripe-product.controller";
import { StripeProductModel } from "./entities/stripe-product.model";
import { StripeProductRepository } from "./repositories/stripe-product.repository";
import { StripeProductSerialiser } from "./serialisers/stripe-product.serialiser";
import { StripeProductAdminService } from "./services/stripe-product-admin.service";
import { StripeProductApiService } from "./services/stripe-product-api.service";

@Module({
  imports: [forwardRef(() => StripeModule)],
  controllers: [StripeProductController],
  providers: [
    // Services
    StripeProductApiService,
    StripeProductAdminService,
    // Repository
    StripeProductRepository,
    // Serializer
    StripeProductSerialiser,
  ],
  exports: [
    // Services
    StripeProductApiService,
    StripeProductAdminService,
    // Repository
    StripeProductRepository,
  ],
})
export class StripeProductModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(StripeProductModel);
  }
}
