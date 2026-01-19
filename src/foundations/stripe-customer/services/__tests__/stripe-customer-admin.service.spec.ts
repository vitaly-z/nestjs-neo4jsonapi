import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { StripeCustomerAdminService } from "../stripe-customer-admin.service";
import { StripeCustomerApiService } from "../stripe-customer-api.service";
import { StripeCustomerRepository } from "../../repositories/stripe-customer.repository";
import { CompanyRepository } from "../../../company/repositories/company.repository";
import { UserRepository } from "../../../user/repositories/user.repository";
import { JsonApiService } from "../../../../core/jsonapi";
import { StripeCustomerPostDTO, StripeCustomerPutDTO } from "../../dtos/stripe-customer.dto";
import { TEST_IDS, MOCK_CUSTOMER } from "../../../stripe/__tests__/fixtures/stripe.fixtures";

// Mock customer entity that would be returned from repository
const MOCK_CUSTOMER_ENTITY = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  stripeCustomerId: TEST_IDS.customerId,
  email: "test@example.com",
  name: "Test Customer",
  currency: "usd",
  balance: 0,
  delinquent: false,
  defaultPaymentMethodId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_COMPANY = {
  id: TEST_IDS.companyId,
  name: "Test Company",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_USER = {
  id: "770e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  firstName: "Test",
  lastName: "User",
};

const MOCK_JSON_API_RESPONSE = {
  data: {
    type: "stripe-customers",
    id: MOCK_CUSTOMER_ENTITY.id,
    attributes: {
      stripeCustomerId: MOCK_CUSTOMER_ENTITY.stripeCustomerId,
      email: MOCK_CUSTOMER_ENTITY.email,
      name: MOCK_CUSTOMER_ENTITY.name,
      currency: MOCK_CUSTOMER_ENTITY.currency,
      balance: MOCK_CUSTOMER_ENTITY.balance,
      delinquent: MOCK_CUSTOMER_ENTITY.delinquent,
    },
  },
};

// Factory functions for mocks
const createMockStripeCustomerApiService = () => ({
  createCustomer: vi.fn(),
  retrieveCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  listPaymentMethods: vi.fn(),
  setDefaultPaymentMethod: vi.fn(),
  detachPaymentMethod: vi.fn(),
});

const createMockStripeCustomerRepository = () => ({
  findByCompanyId: vi.fn(),
  findByStripeCustomerId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateByStripeCustomerId: vi.fn(),
  delete: vi.fn(),
});

const createMockCompanyRepository = () => ({
  findByCompanyId: vi.fn(),
});

const createMockUserRepository = () => ({
  findByUserId: vi.fn(),
});

const createMockJsonApiService = () => ({
  buildSingle: vi.fn(),
  buildCollection: vi.fn(),
  buildPaginated: vi.fn(),
});

describe("StripeCustomerAdminService", () => {
  let service: StripeCustomerAdminService;
  let stripeCustomerApiService: ReturnType<typeof createMockStripeCustomerApiService>;
  let stripeCustomerRepository: ReturnType<typeof createMockStripeCustomerRepository>;
  let companyRepository: ReturnType<typeof createMockCompanyRepository>;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let jsonApiService: ReturnType<typeof createMockJsonApiService>;

  beforeEach(async () => {
    stripeCustomerApiService = createMockStripeCustomerApiService();
    stripeCustomerRepository = createMockStripeCustomerRepository();
    companyRepository = createMockCompanyRepository();
    userRepository = createMockUserRepository();
    jsonApiService = createMockJsonApiService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeCustomerAdminService,
        { provide: StripeCustomerApiService, useValue: stripeCustomerApiService },
        { provide: StripeCustomerRepository, useValue: stripeCustomerRepository },
        { provide: CompanyRepository, useValue: companyRepository },
        { provide: UserRepository, useValue: userRepository },
        { provide: JsonApiService, useValue: jsonApiService },
      ],
    }).compile();

    service = module.get<StripeCustomerAdminService>(StripeCustomerAdminService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomerByCompanyId", () => {
    it("should return customer when found", async () => {
      stripeCustomerRepository.findByCompanyId.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.getCustomerByCompanyId(TEST_IDS.companyId);

      expect(stripeCustomerRepository.findByCompanyId).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
      });
      expect(jsonApiService.buildSingle).toHaveBeenCalled();
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should return null when customer not found", async () => {
      stripeCustomerRepository.findByCompanyId.mockResolvedValue(null);

      const result = await service.getCustomerByCompanyId(TEST_IDS.companyId);

      expect(stripeCustomerRepository.findByCompanyId).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
      });
      expect(jsonApiService.buildSingle).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("getCustomerById", () => {
    it("should return customer when found", async () => {
      stripeCustomerRepository.findById.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.getCustomerById(MOCK_CUSTOMER_ENTITY.id);

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({
        id: MOCK_CUSTOMER_ENTITY.id,
      });
      expect(jsonApiService.buildSingle).toHaveBeenCalled();
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should return null when customer not found", async () => {
      stripeCustomerRepository.findById.mockResolvedValue(null);

      const result = await service.getCustomerById("non-existent-id");

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({
        id: "non-existent-id",
      });
      expect(jsonApiService.buildSingle).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("getCustomerByStripeId", () => {
    it("should return customer when found", async () => {
      stripeCustomerRepository.findByStripeCustomerId.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.getCustomerByStripeId(TEST_IDS.customerId);

      expect(stripeCustomerRepository.findByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: TEST_IDS.customerId,
      });
      expect(jsonApiService.buildSingle).toHaveBeenCalled();
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should return null when customer not found", async () => {
      stripeCustomerRepository.findByStripeCustomerId.mockResolvedValue(null);

      const result = await service.getCustomerByStripeId("cus_non_existent");

      expect(stripeCustomerRepository.findByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: "cus_non_existent",
      });
      expect(jsonApiService.buildSingle).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("createCustomer", () => {
    const userId = MOCK_USER.id;

    it("should create customer with provided DTO attributes", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            name: "Custom Name",
            email: "custom@example.com",
            currency: "eur",
          },
        },
      };

      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.createCustomer(TEST_IDS.companyId, userId, dto);

      expect(stripeCustomerApiService.createCustomer).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
        email: "custom@example.com",
        name: "Custom Name",
      });
      expect(stripeCustomerRepository.create).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
        stripeCustomerId: MOCK_CUSTOMER.id,
        email: "custom@example.com",
        name: "Custom Name",
        currency: "eur",
      });
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should auto-fetch company name when not provided in DTO", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            email: "custom@example.com",
          },
        },
      };

      companyRepository.findByCompanyId.mockResolvedValue(MOCK_COMPANY);
      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, userId, dto);

      expect(companyRepository.findByCompanyId).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
      });
      expect(stripeCustomerApiService.createCustomer).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
        email: "custom@example.com",
        name: MOCK_COMPANY.name,
      });
    });

    it("should throw BadRequestException when company not found", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            email: "custom@example.com",
          },
        },
      };

      companyRepository.findByCompanyId.mockResolvedValue(null);

      await expect(service.createCustomer(TEST_IDS.companyId, userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createCustomer(TEST_IDS.companyId, userId, dto)).rejects.toThrow("Company not found");
    });

    it("should auto-fetch user email when not provided in DTO", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            name: "Custom Name",
          },
        },
      };

      userRepository.findByUserId.mockResolvedValue(MOCK_USER);
      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, userId, dto);

      expect(userRepository.findByUserId).toHaveBeenCalledWith({
        userId: userId,
      });
      expect(stripeCustomerApiService.createCustomer).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
        email: MOCK_USER.email,
        name: "Custom Name",
      });
    });

    it("should throw BadRequestException when user not found", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            name: "Custom Name",
          },
        },
      };

      userRepository.findByUserId.mockResolvedValue(null);

      await expect(service.createCustomer(TEST_IDS.companyId, userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createCustomer(TEST_IDS.companyId, userId, dto)).rejects.toThrow("User not found");
    });

    it("should use default currency (usd) when not provided", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {
            name: "Custom Name",
            email: "custom@example.com",
          },
        },
      };

      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, userId, dto);

      expect(stripeCustomerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: "usd",
        }),
      );
    });

    it("should create customer without DTO (auto-fetch all fields)", async () => {
      companyRepository.findByCompanyId.mockResolvedValue(MOCK_COMPANY);
      userRepository.findByUserId.mockResolvedValue(MOCK_USER);
      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, userId);

      expect(companyRepository.findByCompanyId).toHaveBeenCalled();
      expect(userRepository.findByUserId).toHaveBeenCalled();
      expect(stripeCustomerApiService.createCustomer).toHaveBeenCalledWith({
        companyId: TEST_IDS.companyId,
        email: MOCK_USER.email,
        name: MOCK_COMPANY.name,
      });
    });
  });

  describe("updateCustomer", () => {
    const customerId = MOCK_CUSTOMER_ENTITY.id;

    it("should update customer successfully", async () => {
      const dto: StripeCustomerPutDTO = {
        data: {
          type: "stripe-customers",
          id: customerId,
          attributes: {
            name: "Updated Name",
            email: "updated@example.com",
          },
        },
      };

      stripeCustomerRepository.findById.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerApiService.updateCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.update.mockResolvedValue({
        ...MOCK_CUSTOMER_ENTITY,
        name: "Updated Name",
        email: "updated@example.com",
      });
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.updateCustomer(customerId, dto);

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({ id: customerId });
      expect(stripeCustomerApiService.updateCustomer).toHaveBeenCalledWith({
        stripeCustomerId: MOCK_CUSTOMER_ENTITY.stripeCustomerId,
        name: "Updated Name",
        email: "updated@example.com",
        defaultPaymentMethodId: undefined,
      });
      expect(stripeCustomerRepository.update).toHaveBeenCalledWith({
        id: customerId,
        name: "Updated Name",
        email: "updated@example.com",
        defaultPaymentMethodId: undefined,
      });
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should return null when customer not found", async () => {
      const dto: StripeCustomerPutDTO = {
        data: {
          type: "stripe-customers",
          id: "non-existent-id",
          attributes: {
            name: "Updated Name",
          },
        },
      };

      stripeCustomerRepository.findById.mockResolvedValue(null);

      const result = await service.updateCustomer("non-existent-id", dto);

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({ id: "non-existent-id" });
      expect(stripeCustomerApiService.updateCustomer).not.toHaveBeenCalled();
      expect(stripeCustomerRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should update default payment method", async () => {
      const dto: StripeCustomerPutDTO = {
        data: {
          type: "stripe-customers",
          id: customerId,
          attributes: {
            defaultPaymentMethodId: TEST_IDS.paymentMethodId,
          },
        },
      };

      stripeCustomerRepository.findById.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerApiService.updateCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.update.mockResolvedValue({
        ...MOCK_CUSTOMER_ENTITY,
        defaultPaymentMethodId: TEST_IDS.paymentMethodId,
      });
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.updateCustomer(customerId, dto);

      expect(stripeCustomerApiService.updateCustomer).toHaveBeenCalledWith({
        stripeCustomerId: MOCK_CUSTOMER_ENTITY.stripeCustomerId,
        name: undefined,
        email: undefined,
        defaultPaymentMethodId: TEST_IDS.paymentMethodId,
      });
    });

    it("should skip Stripe update when no changes provided", async () => {
      const dto: StripeCustomerPutDTO = {
        data: {
          type: "stripe-customers",
          id: customerId,
          attributes: {},
        },
      };

      stripeCustomerRepository.findById.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerRepository.update.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.updateCustomer(customerId, dto);

      expect(stripeCustomerApiService.updateCustomer).not.toHaveBeenCalled();
      expect(stripeCustomerRepository.update).toHaveBeenCalled();
    });
  });

  describe("syncFromStripe", () => {
    it("should sync customer data from Stripe webhook", async () => {
      const webhookData = {
        email: "synced@example.com",
        name: "Synced Name",
        defaultPaymentMethodId: TEST_IDS.paymentMethodId,
        balance: 5000,
        delinquent: true,
      };

      stripeCustomerRepository.findByStripeCustomerId.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerRepository.updateByStripeCustomerId.mockResolvedValue({
        ...MOCK_CUSTOMER_ENTITY,
        ...webhookData,
      });
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      const result = await service.syncFromStripe(TEST_IDS.customerId, webhookData);

      expect(stripeCustomerRepository.findByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: TEST_IDS.customerId,
      });
      expect(stripeCustomerRepository.updateByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: TEST_IDS.customerId,
        ...webhookData,
      });
      expect(result).toEqual(MOCK_JSON_API_RESPONSE);
    });

    it("should return null when customer not found", async () => {
      stripeCustomerRepository.findByStripeCustomerId.mockResolvedValue(null);

      const result = await service.syncFromStripe("cus_non_existent", {
        email: "synced@example.com",
      });

      expect(stripeCustomerRepository.findByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: "cus_non_existent",
      });
      expect(stripeCustomerRepository.updateByStripeCustomerId).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should sync partial data", async () => {
      const partialData = {
        balance: 10000,
      };

      stripeCustomerRepository.findByStripeCustomerId.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerRepository.updateByStripeCustomerId.mockResolvedValue({
        ...MOCK_CUSTOMER_ENTITY,
        ...partialData,
      });
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.syncFromStripe(TEST_IDS.customerId, partialData);

      expect(stripeCustomerRepository.updateByStripeCustomerId).toHaveBeenCalledWith({
        stripeCustomerId: TEST_IDS.customerId,
        balance: 10000,
      });
    });
  });

  describe("deleteCustomer", () => {
    it("should delete customer from both Stripe and Neo4j", async () => {
      stripeCustomerRepository.findById.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      stripeCustomerApiService.deleteCustomer.mockResolvedValue({ id: TEST_IDS.customerId, deleted: true });
      stripeCustomerRepository.delete.mockResolvedValue(undefined);

      await service.deleteCustomer(MOCK_CUSTOMER_ENTITY.id);

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({ id: MOCK_CUSTOMER_ENTITY.id });
      expect(stripeCustomerApiService.deleteCustomer).toHaveBeenCalledWith(MOCK_CUSTOMER_ENTITY.stripeCustomerId);
      expect(stripeCustomerRepository.delete).toHaveBeenCalledWith({ id: MOCK_CUSTOMER_ENTITY.id });
    });

    it("should do nothing when customer not found", async () => {
      stripeCustomerRepository.findById.mockResolvedValue(null);

      await service.deleteCustomer("non-existent-id");

      expect(stripeCustomerRepository.findById).toHaveBeenCalledWith({ id: "non-existent-id" });
      expect(stripeCustomerApiService.deleteCustomer).not.toHaveBeenCalled();
      expect(stripeCustomerRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty DTO data object", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {},
      };

      companyRepository.findByCompanyId.mockResolvedValue(MOCK_COMPANY);
      userRepository.findByUserId.mockResolvedValue(MOCK_USER);
      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, MOCK_USER.id, dto);

      expect(companyRepository.findByCompanyId).toHaveBeenCalled();
      expect(userRepository.findByUserId).toHaveBeenCalled();
    });

    it("should handle empty attributes in DTO", async () => {
      const dto: StripeCustomerPostDTO = {
        data: {
          attributes: {},
        },
      };

      companyRepository.findByCompanyId.mockResolvedValue(MOCK_COMPANY);
      userRepository.findByUserId.mockResolvedValue(MOCK_USER);
      stripeCustomerApiService.createCustomer.mockResolvedValue(MOCK_CUSTOMER);
      stripeCustomerRepository.create.mockResolvedValue(MOCK_CUSTOMER_ENTITY);
      jsonApiService.buildSingle.mockReturnValue(MOCK_JSON_API_RESPONSE);

      await service.createCustomer(TEST_IDS.companyId, MOCK_USER.id, dto);

      expect(companyRepository.findByCompanyId).toHaveBeenCalled();
      expect(userRepository.findByUserId).toHaveBeenCalled();
    });
  });
});
