import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * PKCE (Proof Key for Code Exchange) Service
 *
 * Implements RFC 7636 for protection against authorization code interception.
 * PKCE is required for public clients and recommended for all clients.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636
 */
@Injectable()
export class OAuthPkceService {
  /** Allowed characters for code verifier (RFC 7636 Section 4.1) */
  private static readonly VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  /** Minimum length for code verifier */
  private static readonly MIN_VERIFIER_LENGTH = 43;

  /** Maximum length for code verifier */
  private static readonly MAX_VERIFIER_LENGTH = 128;

  /**
   * Generates a cryptographically secure code verifier.
   *
   * The code verifier is a high-entropy random string that the client
   * creates and stores. It must be between 43-128 characters using
   * only unreserved URI characters.
   *
   * @param length - Length of verifier (default 64, range 43-128)
   * @returns A URL-safe code verifier string
   */
  generateCodeVerifier(length: number = 64): string {
    // Clamp length to valid range
    const safeLength = Math.max(
      OAuthPkceService.MIN_VERIFIER_LENGTH,
      Math.min(OAuthPkceService.MAX_VERIFIER_LENGTH, length),
    );

    // Generate random bytes
    const randomBytes = crypto.randomBytes(safeLength);

    // Map to allowed characters
    const chars = OAuthPkceService.VERIFIER_CHARS;
    let verifier = "";
    for (let i = 0; i < safeLength; i++) {
      verifier += chars[randomBytes[i] % chars.length];
    }

    return verifier;
  }

  /**
   * Generates a code challenge from a code verifier.
   *
   * The code challenge is derived from the code verifier using the
   * specified transformation method. The challenge is sent in the
   * authorization request.
   *
   * @param verifier - The code verifier string
   * @param method - Challenge method: 'S256' (recommended) or 'plain'
   * @returns The code challenge string
   *
   * @example
   * const verifier = pkceService.generateCodeVerifier();
   * const challenge = pkceService.generateCodeChallenge(verifier, 'S256');
   */
  generateCodeChallenge(verifier: string, method: "S256" | "plain"): string {
    if (method === "plain") {
      // Plain method: challenge = verifier (not recommended)
      return verifier;
    }

    // S256 method: challenge = BASE64URL(SHA256(verifier))
    const hash = crypto.createHash("sha256").update(verifier, "ascii").digest();

    // Convert to base64url encoding (RFC 4648)
    return hash.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  /**
   * Validates a code verifier against a stored code challenge.
   *
   * This method is called during token exchange to verify that the
   * client presenting the authorization code is the same client that
   * initiated the authorization request.
   *
   * @param verifier - The code verifier from the token request
   * @param challenge - The stored code challenge from the authorization request
   * @param method - The challenge method used ('S256' or 'plain')
   * @returns true if the verifier matches the challenge
   *
   * @example
   * const isValid = pkceService.validateCodeChallenge(
   *   req.body.code_verifier,
   *   storedCode.codeChallenge,
   *   storedCode.codeChallengeMethod
   * );
   */
  validateCodeChallenge(verifier: string, challenge: string, method: "S256" | "plain"): boolean {
    // Validate verifier format
    if (!this.isValidVerifier(verifier)) {
      return false;
    }

    // Generate challenge from verifier and compare
    const expectedChallenge = this.generateCodeChallenge(verifier, method);

    // Ensure both strings are the same length for timing-safe comparison
    if (expectedChallenge.length !== challenge.length) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expectedChallenge), Buffer.from(challenge));
  }

  /**
   * Validates that a code verifier matches RFC 7636 requirements.
   *
   * @param verifier - The code verifier to validate
   * @returns true if the verifier is valid
   */
  isValidVerifier(verifier: string): boolean {
    // Check length
    if (
      verifier.length < OAuthPkceService.MIN_VERIFIER_LENGTH ||
      verifier.length > OAuthPkceService.MAX_VERIFIER_LENGTH
    ) {
      return false;
    }

    // Check characters (only unreserved URI characters allowed)
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    return validChars.test(verifier);
  }

  /**
   * Validates that a challenge method is supported.
   *
   * @param method - The challenge method to validate
   * @returns true if the method is supported
   */
  isValidChallengeMethod(method: string): method is "S256" | "plain" {
    return method === "S256" || method === "plain";
  }
}
