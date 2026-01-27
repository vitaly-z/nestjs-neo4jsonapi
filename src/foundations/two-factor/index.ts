// Entities
export { BackupCode, BackupCodeDescriptor, BackupCodeDescriptorType } from "./entities/backup-code";
export { backupCodeMeta } from "./entities/backup-code.meta";
export {
  BackupCodesCount,
  BackupCodesCountDescriptor,
  BackupCodesCountDescriptorType,
} from "./entities/backup-codes-count";
export { backupCodesCountMeta } from "./entities/backup-codes-count.meta";
export {
  BackupCodesGeneration,
  BackupCodesGenerationDescriptor,
  BackupCodesGenerationDescriptorType,
} from "./entities/backup-codes-generation";
export { backupCodesGenerationMeta } from "./entities/backup-codes-generation.meta";
export { Passkey, PasskeyDescriptor, PasskeyDescriptorType } from "./entities/passkey";
export { passkeyMeta } from "./entities/passkey.meta";
export {
  PasskeyAuthenticationOptions,
  PasskeyAuthenticationOptionsDescriptor,
  PasskeyAuthenticationOptionsDescriptorType,
} from "./entities/passkey-authentication-options";
export { passkeyAuthenticationOptionsMeta } from "./entities/passkey-authentication-options.meta";
export {
  PasskeyRegistrationOptions,
  PasskeyRegistrationOptionsDescriptor,
  PasskeyRegistrationOptionsDescriptorType,
} from "./entities/passkey-registration-options";
export { passkeyRegistrationOptionsMeta } from "./entities/passkey-registration-options.meta";
export {
  PendingTwoFactor,
  PendingTwoFactorDescriptor,
  PendingTwoFactorDescriptorType,
} from "./entities/pending-two-factor";
export { pendingTwoFactorMeta } from "./entities/pending-two-factor.meta";
export {
  TotpAuthenticator,
  TotpAuthenticatorDescriptor,
  TotpAuthenticatorDescriptorType,
} from "./entities/totp-authenticator";
export { totpAuthenticatorMeta } from "./entities/totp-authenticator.meta";
export { TotpSetup, TotpSetupDescriptor, TotpSetupDescriptorType } from "./entities/totp-setup";
export { totpSetupMeta } from "./entities/totp-setup.meta";
export {
  TwoFactorChallenge,
  TwoFactorChallengeDescriptor,
  TwoFactorChallengeDescriptorType,
} from "./entities/two-factor-challenge";
export { twoFactorChallengeMeta } from "./entities/two-factor-challenge.meta";
export {
  TwoFactorConfig,
  TwoFactorConfigDescriptor,
  TwoFactorConfigDescriptorType,
} from "./entities/two-factor-config";
export { twoFactorConfigMeta } from "./entities/two-factor-config.meta";
export {
  TwoFactorStatus,
  TwoFactorStatusDescriptor,
  TwoFactorStatusDescriptorType,
} from "./entities/two-factor-status";
export { twoFactorStatusMeta } from "./entities/two-factor-status.meta";
export {
  TwoFactorVerification,
  TwoFactorVerificationDescriptor,
  TwoFactorVerificationDescriptorType,
} from "./entities/two-factor-verification";
export { twoFactorVerificationMeta } from "./entities/two-factor-verification.meta";

// Repositories
export { BackupCodeRepository } from "./repositories/backup-code.repository";
export { PasskeyRepository } from "./repositories/passkey.repository";
export { PendingTwoFactorRepository } from "./repositories/pending-two-factor.repository";
export { TotpAuthenticatorRepository } from "./repositories/totp-authenticator.repository";
export { TwoFactorConfigRepository } from "./repositories/two-factor-config.repository";

// Services
export { BackupCodeGenerationResult, BackupCodeService } from "./services/backup-code.service";
export { PasskeyService } from "./services/passkey.service";
export { TotpEncryptionService } from "./services/totp-encryption.service";
export { TotpAuthenticatorInfo, TotpService, TotpSetupResponse } from "./services/totp.service";
export { PendingSession, TwoFactorMethod, TwoFactorService, VerificationResult } from "./services/two-factor.service";

// Guards
export { PendingAuthGuard, PendingAuthPayload } from "./guards/pending-auth.guard";

// DTOs - TOTP
export { TotpSetupAttributesDTO, TotpSetupDataDTO, TotpSetupDTO } from "./dtos/totp-setup.dto";
export {
  TotpSetupVerifyAttributesDTO,
  TotpSetupVerifyDataDTO,
  TotpSetupVerifyDTO,
  TotpVerifyAttributesDTO,
  TotpVerifyDataDTO,
  TotpVerifyDTO,
} from "./dtos/totp-verify.dto";

// DTOs - Passkey
export {
  PasskeyAuthenticationOptionsDTO,
  PasskeyRegistrationOptionsAttributesDTO,
  PasskeyRegistrationOptionsDataDTO,
  PasskeyRegistrationOptionsDTO,
} from "./dtos/passkey-options.dto";
export {
  PasskeyAuthenticationVerifyAttributesDTO,
  PasskeyAuthenticationVerifyDataDTO,
  PasskeyAuthenticationVerifyDTO,
  PasskeyRegistrationVerifyAttributesDTO,
  PasskeyRegistrationVerifyDataDTO,
  PasskeyRegistrationVerifyDTO,
  PasskeyRenameAttributesDTO,
  PasskeyRenameDataDTO,
  PasskeyRenameDTO,
  WebAuthnAuthenticationResponseDTO,
  WebAuthnRegistrationResponseDTO,
} from "./dtos/passkey-verify.dto";

// DTOs - Two-Factor
export {
  BackupCodeVerifyAttributesDTO,
  BackupCodeVerifyDataDTO,
  BackupCodeVerifyDTO,
  TwoFactorChallengeAttributesDTO,
  TwoFactorChallengeDataDTO,
  TwoFactorChallengeDTO,
  TwoFactorEnableAttributesDTO,
  TwoFactorEnableDataDTO,
  TwoFactorEnableDTO,
} from "./dtos/two-factor-verify.dto";

// Controllers
export { PasskeyController } from "./controllers/passkey.controller";
export { TotpController } from "./controllers/totp.controller";
export { TwoFactorController } from "./controllers/two-factor.controller";

// Module
export { TwoFactorModule } from "./two-factor.module";
