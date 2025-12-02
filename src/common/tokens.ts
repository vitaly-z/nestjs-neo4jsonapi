import { Neo4jService } from "../core/neo4j/services/neo4j.service";

/**
 * Injection tokens for common module dependencies
 *
 * NOTE: Logging is done via AppLoggingService directly, no token needed.
 */

// System roles provider token
export const SYSTEM_ROLES = Symbol("SYSTEM_ROLES");

// Re-export from config/tokens for backward compatibility
export { COMPANY_CONFIGURATIONS_FACTORY } from "../config/tokens";

/**
 * Interface for company configurations
 */
export interface CompanyConfigurationsInterface {
  companyId: string;
  userId: string;
  language?: string;
  roles: string[];
  hasModule(moduleId: string): boolean;
  hasRole(role: string): boolean;
}

/**
 * Factory type for creating company configurations
 */
export type CompanyConfigurationsFactory = (params: {
  companyId: string;
  userId: string;
  language?: string;
  roles?: string[];
  neo4j: Neo4jService;
}) => Promise<CompanyConfigurationsInterface>;

/**
 * Interface for system roles
 */
export interface SystemRolesInterface {
  Administrator: string;
  [key: string]: string;
}
