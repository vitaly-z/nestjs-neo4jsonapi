import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsString, Length, Matches, ValidateNested } from "class-validator";
import { backupCodeMeta } from "../entities/backup-code.meta";
import { twoFactorConfigMeta } from "../entities/two-factor-config.meta";

/**
 * Attributes for backup code verification request.
 */
export class BackupCodeVerifyAttributesDTO {
  /**
   * The 8-character backup code (hex format).
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 8, { message: "Backup code must be exactly 8 characters" })
  @Matches(/^[a-fA-F0-9]{8}$/, { message: "Backup code must be a valid 8-character hex string" })
  code: string;
}

/**
 * Data wrapper for backup code verification request.
 */
export class BackupCodeVerifyDataDTO {
  @Equals(backupCodeMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => BackupCodeVerifyAttributesDTO)
  attributes: BackupCodeVerifyAttributesDTO;
}

/**
 * DTO for backup code verification during 2FA login flow.
 *
 * Used when a user provides a backup code to complete two-factor authentication.
 * Backup codes are single-use and marked as used after successful verification.
 *
 * Endpoint: POST /auth/two-factor/verify/backup
 */
export class BackupCodeVerifyDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => BackupCodeVerifyDataDTO)
  data: BackupCodeVerifyDataDTO;
}

/**
 * Attributes for getting 2FA challenge.
 */
export class TwoFactorChallengeAttributesDTO {
  /**
   * The preferred 2FA method to use.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(totp|passkey|backup)$/, {
    message: "Method must be one of: totp, passkey, backup",
  })
  method: "totp" | "passkey" | "backup";
}

/**
 * Data wrapper for 2FA challenge request.
 */
export class TwoFactorChallengeDataDTO {
  @Equals(twoFactorConfigMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TwoFactorChallengeAttributesDTO)
  attributes: TwoFactorChallengeAttributesDTO;
}

/**
 * DTO for requesting a 2FA challenge.
 *
 * Used to initiate the 2FA verification process for a specific method.
 * For passkeys, this returns WebAuthn authentication options.
 * For TOTP and backup codes, no challenge is needed (user provides code directly).
 *
 * Endpoint: POST /auth/two-factor/challenge
 */
export class TwoFactorChallengeDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TwoFactorChallengeDataDTO)
  data: TwoFactorChallengeDataDTO;
}

/**
 * Attributes for enabling 2FA.
 */
export class TwoFactorEnableAttributesDTO {
  /**
   * The preferred method for 2FA.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(totp|passkey)$/, {
    message: "Preferred method must be one of: totp, passkey",
  })
  preferredMethod: "totp" | "passkey";
}

/**
 * Data wrapper for enabling 2FA.
 */
export class TwoFactorEnableDataDTO {
  @Equals(twoFactorConfigMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TwoFactorEnableAttributesDTO)
  attributes: TwoFactorEnableAttributesDTO;
}

/**
 * DTO for enabling 2FA.
 *
 * Used to enable two-factor authentication for the user.
 * Requires at least one 2FA method (TOTP or passkey) to be set up first.
 *
 * Endpoint: POST /auth/two-factor/enable
 */
export class TwoFactorEnableDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TwoFactorEnableDataDTO)
  data: TwoFactorEnableDataDTO;
}
