/**
 * Injection tokens for common module dependencies
 */

// Logging service token
export const LOGGING_SERVICE = Symbol("LOGGING_SERVICE");

// Neo4j service token
export const NEO4J_SERVICE = Symbol("NEO4J_SERVICE");

// Company configurations factory token
export const COMPANY_CONFIGURATIONS_FACTORY = Symbol("COMPANY_CONFIGURATIONS_FACTORY");

// System roles provider token
export const SYSTEM_ROLES = Symbol("SYSTEM_ROLES");

// Security service token
export const SECURITY_SERVICE = Symbol("SECURITY_SERVICE");

/**
 * Interface for logging service
 */
export interface LoggingServiceInterface {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
}

/**
 * Interface for Neo4j service basic operations
 */
export interface Neo4jServiceInterface {
  read(params: { query: string; params?: Record<string, any> }): Promise<any>;
  write(params: { query: string; params?: Record<string, any> }): Promise<any>;
}

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
  neo4j: Neo4jServiceInterface;
}) => Promise<CompanyConfigurationsInterface>;

/**
 * Interface for system roles
 */
export interface SystemRolesInterface {
  Administrator: string;
  [key: string]: string;
}
