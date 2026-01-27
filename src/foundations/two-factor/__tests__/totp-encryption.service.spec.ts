import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { TotpEncryptionService } from "../services/totp-encryption.service";

// Mock the baseConfig
vi.mock("../../../config/base.config", () => ({
  baseConfig: {
    twoFactor: {
      totpEncryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", // 64 hex chars = 32 bytes
    },
  },
}));

describe("TotpEncryptionService", () => {
  let service: TotpEncryptionService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TotpEncryptionService],
    }).compile();

    service = module.get<TotpEncryptionService>(TotpEncryptionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("encrypt", () => {
    it("should encrypt a TOTP secret", () => {
      const plaintext = "JBSWY3DPEHPK3PXP";

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      // Encrypted value should be base64 encoded
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });

    it("should produce different ciphertext for the same plaintext (due to random IV)", () => {
      const plaintext = "JBSWY3DPEHPK3PXP";

      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", () => {
      const plaintext = "";

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
    });

    it("should handle long secrets", () => {
      const plaintext = "A".repeat(1000);

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted TOTP secret", () => {
      const plaintext = "JBSWY3DPEHPK3PXP";
      const encrypted = service.encrypt(plaintext);

      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle empty string round-trip", () => {
      const plaintext = "";
      const encrypted = service.encrypt(plaintext);

      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long secrets round-trip", () => {
      const plaintext = "B".repeat(500);
      const encrypted = service.encrypt(plaintext);

      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters round-trip", () => {
      const plaintext = "TEST+SECRET/WITH=CHARS";
      const encrypted = service.encrypt(plaintext);

      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw on invalid ciphertext", () => {
      const invalidCiphertext = "not-valid-base64-ciphertext!!!";

      expect(() => service.decrypt(invalidCiphertext)).toThrow();
    });

    it("should throw on tampered ciphertext (auth tag verification fails)", () => {
      const plaintext = "JBSWY3DPEHPK3PXP";
      const encrypted = service.encrypt(plaintext);

      // Tamper with the ciphertext by modifying some bytes
      const buffer = Buffer.from(encrypted, "base64");
      buffer[buffer.length - 1] = buffer[buffer.length - 1] ^ 0xff;
      const tampered = buffer.toString("base64");

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it("should throw on truncated ciphertext", () => {
      const plaintext = "JBSWY3DPEHPK3PXP";
      const encrypted = service.encrypt(plaintext);

      // Truncate the ciphertext
      const truncated = encrypted.slice(0, 10);

      expect(() => service.decrypt(truncated)).toThrow();
    });
  });

  describe("verify", () => {
    it("should return true when encryption is working correctly", () => {
      const result = service.verify();

      expect(result).toBe(true);
    });

    it("should complete encryption round-trip successfully", () => {
      // verify() internally performs an encrypt/decrypt round-trip
      expect(() => service.verify()).not.toThrow();
    });
  });

  describe("encryption round-trip", () => {
    it("should preserve exact plaintext through encrypt/decrypt cycle", () => {
      const testCases = ["JBSWY3DPEHPK3PXP", "ABCDEFGHIJKLMNOP", "1234567890123456", "test-secret-value", "", "x"];

      for (const plaintext of testCases) {
        const encrypted = service.encrypt(plaintext);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});

describe("TotpEncryptionService - Missing Key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to have no key
    vi.doMock("../../../config/base.config", () => ({
      baseConfig: {
        twoFactor: {
          totpEncryptionKey: "",
        },
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should throw when TOTP_ENCRYPTION_KEY is not set", async () => {
    // Re-import with the empty key mock
    vi.resetModules();
    vi.doMock("../../../config/base.config", () => ({
      baseConfig: {
        twoFactor: {
          totpEncryptionKey: "",
        },
      },
    }));

    const { TotpEncryptionService: ServiceWithNoKey } = await import("../services/totp-encryption.service");
    const serviceInstance = new ServiceWithNoKey();

    expect(() => serviceInstance.encrypt("test")).toThrow("TOTP_ENCRYPTION_KEY environment variable is not set");
  });
});

describe("TotpEncryptionService - Base64 Key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should accept base64-encoded key", async () => {
    // 32 bytes as base64 = 44 chars ending with =
    const base64Key = Buffer.alloc(32, "k").toString("base64");

    vi.doMock("../../../config/base.config", () => ({
      baseConfig: {
        twoFactor: {
          totpEncryptionKey: base64Key,
        },
      },
    }));

    const { TotpEncryptionService: ServiceWithBase64Key } = await import("../services/totp-encryption.service");
    const serviceInstance = new ServiceWithBase64Key();

    const plaintext = "TESTSECRET";
    const encrypted = serviceInstance.encrypt(plaintext);
    const decrypted = serviceInstance.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it("should derive key from arbitrary string using SHA-256", async () => {
    // A key that doesn't match hex or base64 patterns
    const arbitraryKey = "my-arbitrary-encryption-key-string";

    vi.doMock("../../../config/base.config", () => ({
      baseConfig: {
        twoFactor: {
          totpEncryptionKey: arbitraryKey,
        },
      },
    }));

    const { TotpEncryptionService: ServiceWithArbitraryKey } = await import("../services/totp-encryption.service");
    const serviceInstance = new ServiceWithArbitraryKey();

    const plaintext = "TESTSECRET";
    const encrypted = serviceInstance.encrypt(plaintext);
    const decrypted = serviceInstance.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });
});
