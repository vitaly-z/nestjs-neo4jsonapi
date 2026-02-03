/**
 * Interface for registration hooks that can be provided by the application.
 * This allows applications to extend registration behavior without modifying the library.
 */
export interface RegistrationHookInterface {
  /**
   * Called after a new company and user have been created during registration.
   * The companyId will be set in ClsService before this is called.
   *
   * @param params.companyId - The newly created company's ID
   * @param params.userId - The newly created user's ID
   * @param params.referralCode - Optional referral code from the registration
   */
  onRegistrationComplete(params: { companyId: string; userId: string; referralCode?: string }): Promise<void>;
}

/**
 * Injection token for the optional registration hook
 */
export const REGISTRATION_HOOK = "REGISTRATION_HOOK";
